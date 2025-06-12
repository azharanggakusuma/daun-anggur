document.addEventListener("DOMContentLoaded", function () {
    const historyContainer = document.getElementById("history-container");
    const emptyHistoryMessage = document.getElementById("empty-history");
    const history = JSON.parse(localStorage.getItem("analysisHistory")) || [];

    // Pastikan elemen yang dibutuhkan ada di halaman
    if (!historyContainer || !emptyHistoryMessage) return;

    if (history.length === 0) {
        // Tampilkan pesan jika tidak ada riwayat
        emptyHistoryMessage.classList.remove("hidden");
    } else {
        // Sembunyikan pesan jika ada riwayat
        emptyHistoryMessage.classList.add("hidden");
        const fragment = document.createDocumentFragment();
        
        const diseaseInfo = {
            'Sehat': { color: 'green', icon: 'fa-leaf' },
            'Busuk': { color: 'red', icon: 'fa-virus' },
            'Esca': { color: 'orange', icon: 'fa-disease' },
            'Hawar': { color: 'yellow', icon: 'fa-bacterium' },
            'Negative': { color: 'zinc', icon: 'fa-question-circle' }
        };

        history.forEach((item, index) => {
            const date = new Date(item.timestamp);
            
            // Format tanggal untuk desktop (Lengkap)
            const desktopDate = new Intl.DateTimeFormat("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }).format(date);
            const desktopTime = date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            });

            // Format tanggal untuk mobile (Ringkas)
             const mobileDate = new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(date);

            const info = diseaseInfo[item.label] || diseaseInfo['Negative'];

            const cardLink = document.createElement("a");
            cardLink.href = `/hasil/${item.filename}`;
            cardLink.className = `history-card group animate-stagger-in`;
            cardLink.style.setProperty('--delay', `${index * 60}ms`);
            
            // STRUKTUR HTML FINAL DENGAN TANGGAL RESPONSIF
            cardLink.innerHTML = `
                <div class="flex items-center gap-4 w-full">
                    <img src="/static/uploads/${item.filename}" alt="Miniatur ${item.label}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-primary/10 flex-shrink-0">
                    
                    <div class="flex-grow">
                        <p class="font-bold text-base sm:text-lg text-primary dark:text-white flex items-center gap-2">
                            <i class="fa-solid ${info.icon} text-sm text-${info.color}-500"></i>
                            <span>${item.label}</span>
                        </p>
                        <p class="text-sm text-secondary font-medium">Keyakinan: ${item.confidence}%</p>
                        <p class="block sm:hidden text-xs text-muted mt-1">${mobileDate}, ${desktopTime}</p>
                    </div>
                    
                    <div class="flex-shrink-0 flex items-center gap-4">
                        <div class="text-right text-sm text-muted hidden sm:block">
                            <p class="font-semibold">${desktopDate}</p>
                            <p class="text-xs">pukul ${desktopTime}</p>
                        </div>
                        <i class="fa-solid fa-chevron-right text-muted group-hover:text-brand transition-colors duration-200"></i>
                    </div>
                </div>
            `;
            fragment.appendChild(cardLink);
        });
        
        historyContainer.appendChild(fragment);
    }
});