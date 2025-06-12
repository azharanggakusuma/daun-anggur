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
        
        // Membalik urutan riwayat agar yang terbaru muncul di atas
        history.reverse();

        const diseaseInfo = {
            'Sehat': { color: 'green', icon: 'fa-solid fa-leaf' },
            'Busuk': { color: 'red', icon: 'fa-solid fa-virus' },
            'Esca': { color: 'orange', icon: 'fa-solid fa-disease' },
            'Hawar': { color: 'yellow', icon: 'fa-solid fa-bacterium' },
            'Negative': { color: 'zinc', icon: 'fa-solid fa-question-circle' }
        };

        history.forEach((item, index) => {
            // Format tanggal dan waktu
            const date = new Date(item.timestamp);
            const formattedDate = new Intl.DateTimeFormat("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }).format(date);
            const formattedTime = date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            });

            // Buat elemen kartu riwayat
            const card = document.createElement("a");
            card.href = `/hasil/${item.filename}`;
            const info = diseaseInfo[item.label] || diseaseInfo['Negative'];
            card.className = `history-card animate-stagger-in border-color-${info.color}`;
            card.style.setProperty('--delay', `${index * 60}ms`);

            // Isi konten HTML untuk kartu
            card.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex items-center gap-4 flex-grow">
                         <img src="/static/uploads/${item.filename}" alt="Miniatur ${item.label}" class="w-16 h-16 rounded-md object-cover border-2 border-primary/20 flex-shrink-0">
                         <div>
                             <p class="font-bold text-lg text-${info.color}-600 dark:text-${info.color}-400">${item.label}</p>
                             <p class="text-sm text-secondary font-medium">Keyakinan: ${item.confidence}%</p>
                         </div>
                    </div>
                    <div class="text-left sm:text-right text-sm text-muted mt-2 sm:mt-0 flex-shrink-0">
                         <p class="font-semibold">${formattedDate}</p>
                         <p class="text-xs">pukul ${formattedTime}</p>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        
        // Tambahkan semua kartu ke kontainer riwayat
        historyContainer.appendChild(fragment);
    }
});
