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
        
        history.forEach((item, index) => {
            // Format tanggal dan waktu
            const date = new Date(item.timestamp);
            const options = {
                year: "numeric",
                month: "long",
                day: "numeric",
            };
            const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(date);
            const formattedTime = date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            });

            // Buat elemen kartu riwayat
            const card = document.createElement("a");
            card.href = `/hasil/${item.filename}`;
            card.className = "history-card animate-stagger-in";
            card.style.setProperty('--delay', `${index * 60}ms`);

            // Tentukan warna teks untuk label penyakit
            let labelColorClass = 'text-green-600 dark:text-green-500'; // Default untuk 'Sehat'
            if (item.label === 'Busuk') labelColorClass = 'text-red-600 dark:text-red-500';
            else if (item.label === 'Esca') labelColorClass = 'text-orange-600 dark:text-orange-500';
            else if (item.label === 'Hawar') labelColorClass = 'text-yellow-600 dark:text-yellow-500';

            // Isi konten HTML untuk kartu
            card.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div class="flex items-center gap-4">
                         <img src="/static/uploads/${item.filename}" alt="Miniatur ${item.label}" class="w-12 h-12 rounded-md object-cover border-2 border-primary hidden sm:block">
                         <div>
                             <p class="font-bold text-lg ${labelColorClass}">${item.label}</p>
                             <p class="text-sm text-secondary">Keyakinan: ${item.confidence}%</p>
                         </div>
                    </div>
                    <div class="text-left sm:text-right text-sm text-muted mt-2 sm:mt-0">
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
