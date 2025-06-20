document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const historyContainer = document.getElementById("history-container");
    const emptyHistoryMessage = document.getElementById("empty-history");
    const skeletonContainer = document.getElementById("history-skeleton");
    const searchInput = document.getElementById('search-history');
    const clearHistoryButton = document.getElementById('clear-history-button');
    const noSearchResultsMessage = document.getElementById('no-search-results');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    const managementPanel = document.querySelector('.mb-8.flex');
    const summarySection = document.getElementById('history-summary-section');

    // Modal Elements
    const modal = document.getElementById("delete-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const modalConfirmButton = document.getElementById("modal-confirm-button");
    
    // State
    let history = JSON.parse(localStorage.getItem("analysisHistory")) || [];
    let currentFilter = '*';
    let currentAction = { type: null, data: null };
    let lastFocusedElement; 

    const diseaseInfo = {
        'Sehat': { color: 'green', icon: 'fa-leaf' },
        'Busuk': { color: 'red', icon: 'fa-virus' },
        'Esca': { color: 'orange', icon: 'fa-disease' },
        'Hawar': { color: 'yellow', icon: 'fa-bacterium' },
        'Negative': { color: 'zinc', icon: 'fa-question-circle' }
    };

    function calculateSummary() {
        const totalAnalysesEl = document.getElementById('total-analyses');
        const commonDiagnosisEl = document.getElementById('common-diagnosis');
        const avgConfidenceEl = document.getElementById('average-confidence');
        const healthyDetectedEl = document.getElementById('healthy-detected');

        if (history.length === 0) {
            if (summarySection) summarySection.classList.add('hidden');
            return;
        }

        if (summarySection) summarySection.classList.remove('hidden');

        // Total Analisis
        totalAnalysesEl.textContent = history.length;

        // Diagnosis Umum
        const labelCounts = history.reduce((acc, item) => {
            if (item.label !== 'Sehat') {
                acc[item.label] = (acc[item.label] || 0) + 1;
            }
            return acc;
        }, {});
        const commonDiagnosis = Object.keys(labelCounts).length > 0 ? Object.keys(labelCounts).reduce((a, b) => labelCounts[a] > labelCounts[b] ? a : b) : 'N/A';
        commonDiagnosisEl.textContent = commonDiagnosis;
        
        // Rata-rata Keyakinan
        const totalConfidence = history.reduce((sum, item) => sum + parseFloat(item.confidence), 0);
        const avgConfidence = (totalConfidence / history.length).toFixed(1) + '%';
        avgConfidenceEl.textContent = avgConfidence;

        // Sehat Terdeteksi
        const healthyCount = history.filter(item => item.label === 'Sehat').length;
        healthyDetectedEl.textContent = healthyCount;
    }

    function renderHistory() {
        if (skeletonContainer) skeletonContainer.classList.add('hidden');
        if (historyContainer) historyContainer.classList.remove('hidden');

        historyContainer.innerHTML = '';

        const isHistoryEmpty = history.length === 0;
        emptyHistoryMessage.classList.toggle("hidden", !isHistoryEmpty);
        if (managementPanel) managementPanel.classList.toggle('hidden', isHistoryEmpty);

        if (isHistoryEmpty) return;

        const filteredHistory = history.filter(item => currentFilter === '*' || item.label === currentFilter);
        const searchQuery = searchInput.value.toLowerCase().trim();
        const finalHistory = filteredHistory.filter(item => item.label.toLowerCase().includes(searchQuery));
        
        noSearchResultsMessage.classList.toggle('hidden', finalHistory.length > 0);

        const fragment = document.createDocumentFragment();
        finalHistory.forEach((item, index) => {
            const date = new Date(item.timestamp);
            const desktopDate = new Intl.DateTimeFormat("id-ID", { year: "numeric", month: "long", day: "numeric" }).format(date);
            const desktopTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            const info = diseaseInfo[item.label] || diseaseInfo['Negative'];

            const cardDiv = document.createElement('div');
            cardDiv.className = `history-card animate-stagger-in`;
            cardDiv.style.setProperty('--delay', `${index * 60}ms`);
            
            cardDiv.innerHTML = `
                <a href="/hasil/${item.filename}" class="history-card-link group">
                    <img src="/static/uploads/${item.filename}" alt="Miniatur ${item.label}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-primary/10 flex-shrink-0">
                    <div class="flex-grow">
                        <p class="font-bold text-base sm:text-lg text-primary dark:text-white flex items-center gap-2">
                            <i class="fa-solid ${info.icon} text-sm text-${info.color}-500"></i>
                            <span>${item.label}</span>
                        </p>
                        <p class="text-sm text-secondary font-medium">Keyakinan: ${item.confidence}%</p>
                    </div>
                    <div class="text-right text-sm text-muted hidden sm:block">
                        <p class="font-semibold">${desktopDate}</p>
                        <p class="text-xs">pukul ${desktopTime}</p>
                    </div>
                </a>
                <button class="history-delete-button" data-filename="${item.filename}" title="Hapus riwayat ini">
                    <i class="fa-solid fa-trash-can-xmark"></i>
                </button>
            `;
            fragment.appendChild(cardDiv);
        });
        historyContainer.appendChild(fragment);
    }

    function showModal(type, data = null) {
        lastFocusedElement = document.activeElement; 
        currentAction = { type, data };
        if (type === 'single') {
            modalTitle.textContent = 'Konfirmasi Penghapusan';
            modalText.textContent = 'Apakah Anda yakin ingin menghapus riwayat ini secara permanen?';
        } else if (type === 'all') {
            modalTitle.textContent = 'Hapus Semua Riwayat?';
            modalText.textContent = 'Apakah Anda yakin ingin menghapus SEMUA riwayat secara permanen?';
        }
        modal.classList.add('visible');
        modalCancelButton.focus(); 
    }

    function hideModal() {
        currentAction = { type: null, data: null };
        modal.classList.remove('visible');
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    // --- PERUBAHAN DI SINI ---
    function deleteSingleItem(filename) {
        // Temukan kartu yang akan dihapus untuk dianimasikan
        const cardToDelete = historyContainer.querySelector(`[data-filename="${filename}"]`)?.closest('.history-card');

        // Jalankan animasi jika elemennya ada
        if (cardToDelete) {
            cardToDelete.classList.add('animate-fade-out-shrink');
        }

        // Selalu jalankan logika penghapusan data setelah jeda untuk sinkronisasi dengan animasi.
        // Ini memastikan data akan selalu terhapus meskipun elemen visualnya tidak ditemukan.
        setTimeout(() => {
            history = history.filter(item => item.filename !== filename);
            localStorage.setItem('analysisHistory', JSON.stringify(history));
            calculateSummary();
            renderHistory();
        }, 400); // Durasi harus cocok dengan animasi 'fade-out-shrink'
    }
    // --- AKHIR PERUBAHAN ---
    
    function deleteAllHistory() {
        localStorage.removeItem('analysisHistory');
        history = [];
        calculateSummary();
        renderHistory();
    }
    
    // Event Listeners
    historyContainer.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.history-delete-button');
        if (deleteButton) {
            event.preventDefault();
            showModal('single', deleteButton.dataset.filename);
        }
    });

    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            if (history.length > 0) showModal('all');
        });
    }

    if (modal) {
        modalCancelButton.addEventListener('click', hideModal);
        modalConfirmButton.addEventListener('click', () => {
            if (currentAction.type === 'single') deleteSingleItem(currentAction.data);
            else if (currentAction.type === 'all') deleteAllHistory();
            hideModal();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', renderHistory);
    }
    
    if (filterButtonsContainer) {
        filterButtonsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.filter-button');
            if (!button) return;
            
            filterButtonsContainer.querySelector('.active').classList.remove('active');
            button.classList.add('active');
            
            currentFilter = button.dataset.filter;
            renderHistory();
        });
    }

    // Initial Load
    function initialize() {
        setTimeout(() => {
            calculateSummary();
            renderHistory();
        }, 300);
    }

    initialize();
});