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
            cardDiv.setAttribute('data-filename', item.filename);

            // --- PERUBAHAN STRUKTUR HTML DI SINI ---
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
                </a>
                <div class="text-right text-sm text-muted hidden sm:block flex-shrink-0">
                    <p class="font-semibold">${desktopDate}</p>
                    <p class="text-xs">pukul ${desktopTime}</p>
                </div>
                <button class="history-delete-button" data-filename="${item.filename}" title="Hapus riwayat ini">
                    <i class="fa-solid fa-trash-can-xmark"></i>
                </button>
            `;
            // --- AKHIR PERUBAHAN ---
            
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
        itemToDeleteFilename = filename; 
        
        if (type === 'single') {
            modalTitle.textContent = 'Konfirmasi Penghapusan';
            modalText.textContent = 'Apakah Anda yakin ingin menghapus riwayat ini secara permanen? Tindakan ini juga akan menghapus file gambar dari server.';
        } else if (type === 'all') {
            modalTitle.textContent = 'Hapus Semua Riwayat?';
            modalText.textContent = 'Tindakan ini akan menghapus SEMUA data dan file gambar analisis Anda dan tidak bisa dibatalkan.';
        }
        modal.classList.add('visible');
        modalConfirmButton.focus();
    }

    /**
     * Menyembunyikan modal konfirmasi.
     */
    function hideModal() {
        modal.classList.remove('visible');
        itemToDeleteFilename = null; 
    }

    /**
     * Menghapus satu item riwayat berdasarkan nama file.
     * Mengirim permintaan ke server untuk menghapus file fisik.
     * @param {string} filename - Nama file yang akan dihapus.
     */
    async function deleteSingleItem(filename) {
        const cardToDelete = historyContainer.querySelector(`.history-card[data-filename="${filename}"]`);
        
        if (cardToDelete) {
            cardToDelete.classList.add('animate-fade-out-shrink');
        }

        try {
            const response = await fetch(`/history/${filename}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menghapus file di server.');
            }

            setTimeout(() => {
                analysisHistory = analysisHistory.filter(item => item.filename !== filename);
                localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
                renderHistory();
            }, 400); 

        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Terjadi kesalahan saat mencoba menghapus riwayat. Silakan coba lagi.');
            if (cardToDelete) {
                cardToDelete.classList.remove('animate-fade-out-shrink');
            }
        }
    }
    
    /**
     * Menghapus seluruh riwayat analisis.
     * Mengirim daftar semua nama file ke server untuk dihapus.
     */
    async function deleteAllHistory() {
        const filenamesToDelete = analysisHistory.map(item => item.filename);
        if (filenamesToDelete.length === 0) return;

        try {
            const response = await fetch('/history', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filenames: filenamesToDelete })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menghapus riwayat di server.');
            }

            analysisHistory = [];
            localStorage.removeItem('analysisHistory');
            renderHistory();

        } catch (error) {
            console.error('Error deleting all history:', error);
            alert('Terjadi kesalahan saat mencoba menghapus semua riwayat. Silakan coba lagi.');
        }
    }
    
    // --- Event Listeners ---

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
            if (analysisHistory.length > 0) {
                showModal('all');
            }
        });
    }

    if (modal) {
        modalCancelButton.addEventListener('click', hideModal);
        
        modalConfirmButton.addEventListener('click', () => {
            if (itemToDeleteFilename) { 
                deleteSingleItem(itemToDeleteFilename);
            } else { 
                deleteAllHistory();
            }
            hideModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                hideModal();
            }
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

    /**
     * Inisialisasi halaman riwayat.
     */
    function initialize() {
        setTimeout(() => {
            renderHistory();
        }, 300); 
    }

    initialize();
});