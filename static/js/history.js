document.addEventListener("DOMContentLoaded", function () {
    const historyContainer = document.getElementById("history-container");
    const emptyHistoryMessage = document.getElementById("empty-history");
    const skeletonContainer = document.getElementById("history-skeleton"); // KODE BARU
    let history = JSON.parse(localStorage.getItem("analysisHistory")) || [];

    const modal = document.getElementById("delete-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const modalConfirmButton = document.getElementById("modal-confirm-button");
    
    let currentAction = { type: null, data: null };

    const searchInput = document.getElementById('search-history');
    const clearHistoryButton = document.getElementById('clear-history-button');
    
    const noSearchResultsMessage = document.getElementById('no-search-results');
    const searchQueryDisplay = document.getElementById('search-query-display');

    const diseaseInfo = {
        'Sehat': { color: 'green', icon: 'fa-leaf' },
        'Busuk': { color: 'red', icon: 'fa-virus' },
        'Esca': { color: 'orange', icon: 'fa-disease' },
        'Hawar': { color: 'yellow', icon: 'fa-bacterium' },
        'Negative': { color: 'zinc', icon: 'fa-question-circle' }
    };

    function renderHistory() {
        // KODE BARU: Logika untuk menyembunyikan skeleton dan menampilkan konten
        if (skeletonContainer) skeletonContainer.classList.add('hidden');
        if (historyContainer) historyContainer.classList.remove('hidden');

        historyContainer.innerHTML = '';
        const managementPanel = document.querySelector('.mb-8.flex');

        if (history.length === 0) {
            emptyHistoryMessage.classList.remove("hidden");
            if (managementPanel) managementPanel.classList.add('hidden');
        } else {
            emptyHistoryMessage.classList.add("hidden");
            if (managementPanel) managementPanel.classList.remove('hidden');
            
            const fragment = document.createDocumentFragment();
            history.forEach((item, index) => {
                const date = new Date(item.timestamp);
                const desktopDate = new Intl.DateTimeFormat("id-ID", { year: "numeric", month: "long", day: "numeric" }).format(date);
                const desktopTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                const mobileDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
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
                            <p class="block sm:hidden text-xs text-muted mt-1">${mobileDate}, ${desktopTime}</p>
                        </div>
                        <div class="text-right text-sm text-muted hidden sm:block">
                            <p class="font-semibold">${desktopDate}</p>
                            <p class="text-xs">pukul ${desktopTime}</p>
                        </div>
                    </a>
                    <button class="history-delete-button" data-filename="${item.filename}" title="Hapus riwayat ini">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
                fragment.appendChild(cardDiv);
            });
            historyContainer.appendChild(fragment);
        }
    }

    function showModal(type, data = null) {
        currentAction = { type, data };
        if (type === 'single') {
            modalTitle.textContent = 'Konfirmasi Penghapusan';
            modalText.textContent = 'Apakah Anda yakin ingin menghapus riwayat ini secara permanen? Tindakan ini tidak dapat dibatalkan.';
            modalConfirmButton.textContent = 'Ya, Hapus';
        } else if (type === 'all') {
            modalTitle.textContent = 'Hapus Semua Riwayat?';
            modalText.textContent = 'Apakah Anda yakin ingin menghapus SEMUA riwayat secara permanen? Tindakan ini tidak dapat dibatalkan.';
            modalConfirmButton.textContent = 'Ya, Hapus Semua';
        }
        modal.classList.add('visible');
    }

    function hideModal() {
        currentAction = { type: null, data: null };
        modal.classList.remove('visible');
    }

    function deleteSingleItem(filename) {
        const cardToDelete = historyContainer.querySelector(`[data-filename="${filename}"]`)?.closest('.history-card');
        if (cardToDelete) {
            cardToDelete.classList.add('animate-fade-out-shrink');
            setTimeout(() => {
                history = history.filter(item => item.filename !== filename);
                localStorage.setItem('analysisHistory', JSON.stringify(history));
                renderHistory();
            }, 400);
        }
    }
    
    function deleteAllHistory() {
        localStorage.removeItem('analysisHistory');
        history = [];
        renderHistory();
    }

    historyContainer.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.history-delete-button');
        if (deleteButton) {
            event.preventDefault();
            const filename = deleteButton.dataset.filename;
            showModal('single', filename);
        }
    });

    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            if (history.length > 0) {
                showModal('all');
            } else {
                alert('Riwayat Anda sudah kosong.');
            }
        });
    }

    if (modal) {
        modalCancelButton.addEventListener('click', hideModal);
        modalConfirmButton.addEventListener('click', () => {
            if (currentAction.type === 'single') {
                deleteSingleItem(currentAction.data);
            } else if (currentAction.type === 'all') {
                deleteAllHistory();
            }
            hideModal();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.history-card');
            let visibleCount = 0;
            cards.forEach(card => {
                const label = card.querySelector('.font-bold').textContent.toLowerCase();
                if (label.includes(query)) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            if (visibleCount === 0 && query !== '') {
                if (searchQueryDisplay) searchQueryDisplay.textContent = e.target.value;
                if (noSearchResultsMessage) noSearchResultsMessage.classList.remove('hidden');
            } else {
                if (noSearchResultsMessage) noSearchResultsMessage.classList.add('hidden');
            }
        });
    }

    // KODE BARU: Logika untuk menampilkan skeleton sebelum render
    if (historyContainer) {
        setTimeout(() => {
            renderHistory();
        }, 300);
    }
});