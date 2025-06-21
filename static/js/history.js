// static/js/history.js

document.addEventListener("DOMContentLoaded", function () {
    // --- Elemen DOM ---
    const historyContainer = document.getElementById("history-container");
    const emptyHistoryMessage = document.getElementById("empty-history");
    const skeletonContainer = document.getElementById("history-skeleton");
    const searchInput = document.getElementById('search-history');
    const clearHistoryButton = document.getElementById('clear-history-button');
    const noSearchResultsMessage = document.getElementById('no-search-results');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    const managementPanel = document.querySelector('.mb-8.flex');

    // --- Elemen Modal ---
    const modal = document.getElementById("delete-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const modalConfirmButton = document.getElementById("modal-confirm-button");
    
    // --- State Aplikasi ---
    let analysisHistory = JSON.parse(localStorage.getItem("analysisHistory")) || [];
    let currentFilter = '*';
    let itemToDeleteFilename = null; // State untuk menyimpan filename yang akan dihapus

    // --- Informasi untuk tampilan (icon & warna) ---
    const diseaseInfoMap = {
        'Sehat': { color: 'green', icon: 'fa-leaf' },
        'Busuk': { color: 'red', icon: 'fa-virus' },
        'Esca': { color: 'orange', icon: 'fa-disease' },
        'Hawar': { color: 'yellow', icon: 'fa-bacterium' },
        'Negative': { color: 'zinc', icon: 'fa-question-circle' }
    };

    /**
     * Merender kartu riwayat ke dalam kontainer.
     * Fungsi ini sekarang lebih andal dalam menangani filter dan pencarian.
     */
    function renderHistory() {
        if (skeletonContainer) skeletonContainer.classList.add('hidden');
        if (historyContainer) historyContainer.classList.remove('hidden');

        historyContainer.innerHTML = '';

        const isHistoryEmpty = analysisHistory.length === 0;
        emptyHistoryMessage.classList.toggle("hidden", !isHistoryEmpty);
        if (managementPanel) managementPanel.classList.toggle('hidden', isHistoryEmpty);

        if (isHistoryEmpty) return;

        const searchQuery = searchInput.value.toLowerCase().trim();
        
        const finalHistory = analysisHistory.filter(item => {
            const matchesFilter = currentFilter === '*' || item.label === currentFilter;
            const matchesSearch = item.label.toLowerCase().includes(searchQuery);
            return matchesFilter && matchesSearch;
        });
        
        noSearchResultsMessage.classList.toggle('hidden', finalHistory.length > 0 || isHistoryEmpty);

        const fragment = document.createDocumentFragment();
        finalHistory.forEach((item, index) => {
            const date = new Date(item.timestamp);
            const desktopDate = new Intl.DateTimeFormat("id-ID", { year: "numeric", month: "long", day: "numeric" }).format(date);
            const desktopTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            const info = diseaseInfoMap[item.label] || diseaseInfoMap['Negative'];

            const cardDiv = document.createElement('div');
            cardDiv.className = `history-card animate-stagger-in`;
            cardDiv.style.setProperty('--delay', `${index * 60}ms`);
            cardDiv.setAttribute('data-filename', item.filename); // Atribut pada elemen terluar

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

    /**
     * Menampilkan modal konfirmasi penghapusan.
     * @param {string} type - Tipe penghapusan ('single' atau 'all').
     * @param {string|null} filename - Nama file jika tipenya 'single'.
     */
    function showModal(type, filename = null) {
        itemToDeleteFilename = filename; // Simpan filename
        
        if (type === 'single') {
            modalTitle.textContent = 'Konfirmasi Penghapusan';
            modalText.textContent = 'Apakah Anda yakin ingin menghapus riwayat ini secara permanen?';
        } else if (type === 'all') {
            modalTitle.textContent = 'Hapus Semua Riwayat?';
            modalText.textContent = 'Tindakan ini akan menghapus SEMUA data analisis Anda dan tidak bisa dibatalkan.';
        }
        modal.classList.add('visible');
        modalConfirmButton.focus();
    }

    /**
     * Menyembunyikan modal konfirmasi.
     */
    function hideModal() {
        modal.classList.remove('visible');
        itemToDeleteFilename = null; // Reset state
    }

    /**
     * Menghapus satu item riwayat berdasarkan nama file.
     * @param {string} filename - Nama file yang akan dihapus.
     */
    function deleteSingleItem(filename) {
        const cardToDelete = historyContainer.querySelector(`.history-card[data-filename="${filename}"]`);
        
        if (cardToDelete) {
            cardToDelete.classList.add('animate-fade-out-shrink');
        }
        
        // Tunggu animasi selesai sebelum menghapus data dan re-render
        setTimeout(() => {
            analysisHistory = analysisHistory.filter(item => item.filename !== filename);
            localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
            renderHistory();
        }, 400); // Durasi harus cocok dengan animasi di CSS
    }
    
    /**
     * Menghapus seluruh riwayat analisis.
     */
    function deleteAllHistory() {
        analysisHistory = [];
        localStorage.removeItem('analysisHistory');
        renderHistory();
    }
    
    // --- Event Listeners ---

    // Event listener untuk klik di dalam kontainer riwayat (menangani tombol hapus)
    historyContainer.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.history-delete-button');
        if (deleteButton) {
            event.preventDefault(); // Mencegah perilaku default jika ada
            const filename = deleteButton.dataset.filename;
            showModal('single', filename);
        }
    });

    // Event listener untuk tombol hapus semua
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            if (analysisHistory.length > 0) {
                showModal('all');
            }
        });
    }

    // Event listeners untuk tombol di dalam modal
    if (modal) {
        modalCancelButton.addEventListener('click', hideModal);
        
        modalConfirmButton.addEventListener('click', () => {
            if (itemToDeleteFilename) { // Jika ada filename yang tersimpan, hapus satu
                deleteSingleItem(itemToDeleteFilename);
            } else { // Jika tidak, berarti ini adalah 'hapus semua'
                deleteAllHistory();
            }
            hideModal();
        });

        // Tutup modal jika menekan tombol Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                hideModal();
            }
        });
    }
    
    // Event listener untuk input pencarian
    if (searchInput) {
        searchInput.addEventListener('input', renderHistory);
    }
    
    // Event listener untuk tombol filter
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

    /**
     * Inisialisasi halaman riwayat.
     */
    function initialize() {
        setTimeout(() => {
            renderHistory();
        }, 300); // Beri sedikit jeda agar animasi halaman masuk selesai
    }

    initialize();
});