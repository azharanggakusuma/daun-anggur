document.addEventListener("DOMContentLoaded", function () {
    const historyContainer = document.getElementById("history-container");
    const emptyHistoryMessage = document.getElementById("empty-history");
    let history = JSON.parse(localStorage.getItem("analysisHistory")) || [];

    // Elemen Modal
    const modal = document.getElementById("delete-modal");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const modalConfirmButton = document.getElementById("modal-confirm-button");
    let itemToDelete = null;
    
    // Elemen manajemen riwayat
    const searchInput = document.getElementById('search-history');
    const clearHistoryButton = document.getElementById('clear-history-button');
    
    // Elemen baru untuk pesan "tidak ada hasil"
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
        historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            emptyHistoryMessage.classList.remove("hidden");
            // Sembunyikan juga panel manajemen jika tidak ada riwayat
            const managementPanel = document.querySelector('.mb-8.flex');
            if(managementPanel) managementPanel.classList.add('hidden');
        } else {
            emptyHistoryMessage.classList.add("hidden");
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

    function showModal(filename) {
        itemToDelete = filename;
        modal.classList.add('visible');
    }

    function hideModal() {
        itemToDelete = null;
        modal.classList.remove('visible');
    }

    function deleteHistoryItem(filename) {
        if (!filename) return;

        // Cari elemen card yang akan dihapus
        const cardToDelete = historyContainer.querySelector(`[data-filename="${filename}"]`).closest('.history-card');
        
        if (cardToDelete) {
            // Tambahkan kelas animasi keluar
            cardToDelete.classList.add('animate-fade-out-shrink');

            // Tunggu animasi selesai, baru hapus dari data dan DOM
            setTimeout(() => {
                history = history.filter(item => item.filename !== filename);
                localStorage.setItem('analysisHistory', JSON.stringify(history));
                
                // Render ulang riwayat setelah data diperbarui
                // Ini akan secara efektif menghapus elemen dari DOM
                renderHistory(); 

                // Jika container menjadi kosong, tampilkan pesan
                if(history.length === 0) {
                    emptyHistoryMessage.classList.remove("hidden");
                    const managementPanel = document.querySelector('.mb-8.flex');
                    if(managementPanel) managementPanel.classList.add('hidden');
                }

            }, 400); // Durasi harus cocok dengan durasi animasi CSS
        }
        hideModal();
    }

    // Event listener untuk semua tombol hapus
    historyContainer.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.history-delete-button');
        if (deleteButton) {
            event.preventDefault();
            const filename = deleteButton.dataset.filename;
            showModal(filename);
        }
    });

    // Event listener untuk tombol di dalam modal
    if (modal) {
        modalCancelButton.addEventListener('click', hideModal);
        modalConfirmButton.addEventListener('click', () => {
            deleteHistoryItem(itemToDelete);
        });
    }
    
    // Event listener untuk pencarian
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

            // Logika untuk menampilkan/menyembunyikan pesan "tidak ada hasil"
            if (visibleCount === 0 && query !== '') {
                if(searchQueryDisplay) searchQueryDisplay.textContent = e.target.value;
                if(noSearchResultsMessage) noSearchResultsMessage.classList.remove('hidden');
            } else {
                if(noSearchResultsMessage) noSearchResultsMessage.classList.add('hidden');
            }
        });
    }

    // Event listener untuk tombol Hapus Semua
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            if (history.length > 0) {
                if (confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat? Tindakan ini tidak dapat dibatalkan.')) {
                    localStorage.removeItem('analysisHistory');
                    history = [];
                    renderHistory();
                }
            } else {
                alert('Riwayat Anda sudah kosong.');
            }
        });
    }

    // Render riwayat saat halaman pertama kali dimuat
    if (historyContainer) {
        renderHistory();
    }
});