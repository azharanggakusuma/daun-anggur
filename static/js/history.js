document.addEventListener("DOMContentLoaded", function () {
    const historyContainer = document.getElementById("history-container");
    const emptyHistoryMessage = document.getElementById("empty-history");
    let history = JSON.parse(localStorage.getItem("analysisHistory")) || [];

    // Elemen Modal
    const modal = document.getElementById("delete-modal");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const modalConfirmButton = document.getElementById("modal-confirm-button");
    let itemToDelete = null;

    const diseaseInfo = {
        'Sehat': { color: 'green', icon: 'fa-leaf' },
        'Busuk': { color: 'red', icon: 'fa-virus' },
        'Esca': { color: 'orange', icon: 'fa-disease' },
        'Hawar': { color: 'yellow', icon: 'fa-bacterium' },
        'Negative': { color: 'zinc', icon: 'fa-question-circle' }
    };

    function renderHistory() {
        // Selalu kosongkan kontainer utama terlebih dahulu
        historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            // JIKA RIWAYAT KOSONG: Tampilkan pesan dan sembunyikan kontainer
            emptyHistoryMessage.classList.remove("hidden");
        } else {
            // JIKA ADA RIWAYAT: Sembunyikan pesan
            emptyHistoryMessage.classList.add("hidden");
            
            const fragment = document.createDocumentFragment();

            history.forEach((item, index) => {
                const date = new Date(item.timestamp);
                const desktopDate = new Intl.DateTimeFormat("id-ID", { year: "numeric", month: "long", day: "numeric" }).format(date);
                const desktopTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                const mobileDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
                const info = diseaseInfo[item.label] || diseaseInfo['Negative'];

                // Kartu sekarang adalah DIV, bukan A, untuk menampung link dan tombol
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

    function deleteHistoryItem() {
        if (!itemToDelete) return;

        history = history.filter(item => item.filename !== itemToDelete);
        localStorage.setItem('analysisHistory', JSON.stringify(history));
        
        hideModal();
        renderHistory();
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
        modalConfirmButton.addEventListener('click', deleteHistoryItem);
    }

    // Render riwayat saat halaman pertama kali dimuat
    if (historyContainer) {
        renderHistory();
    }
});