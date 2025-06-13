document.addEventListener('DOMContentLoaded', function() {
    // Jangan jalankan skrip jika data hasil tidak ada (untuk halaman lain)
    if (typeof RESULT_DATA === 'undefined' || !RESULT_DATA) return;

    // --- Logika Pemformatan Waktu Terpusat ---
    const date = new Date(RESULT_DATA.timestamp);
    const options = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
    };
    const formattedTimestamp = new Intl.DateTimeFormat('id-ID', options).format(date);
    
    const timestampDisplay = document.getElementById('timestamp-display');
    if (timestampDisplay) {
        timestampDisplay.textContent = `Dianalisis pada ${formattedTimestamp}`;
    }
    
    // --- Simpan ke Riwayat di LocalStorage ---
    function saveToHistory() {
        if (RESULT_DATA.label === 'Negative') return; // Jangan simpan jika tidak teridentifikasi
        let history = JSON.parse(localStorage.getItem('analysisHistory')) || [];
        // Cek apakah hasil ini sudah ada di riwayat berdasarkan nama file unik
        const isAlreadyExist = history.some(item => item.filename === RESULT_DATA.image);
        if (isAlreadyExist) return;

        const historyItem = {
            filename: RESULT_DATA.image,
            label: RESULT_DATA.label,
            confidence: RESULT_DATA.confidence.toFixed(1),
            timestamp: new Date().toISOString() // Simpan waktu saat ini
        };
        history.unshift(historyItem); // Tambahkan item baru di awal array
        // Batasi riwayat hingga 15 item terakhir
        if (history.length > 15) {
            history = history.slice(0, 15);
        }
        localStorage.setItem('analysisHistory', JSON.stringify(history));
    }
    saveToHistory();

    // --- Animasi Bar Tingkat Keyakinan ---
    const confidenceBar = document.getElementById('confidence-bar');
    if (confidenceBar) {
        setTimeout(() => {
            const confidenceValue = confidenceBar.getAttribute('data-confidence');
            confidenceBar.style.width = `${confidenceValue}%`;
        }, 100); // Beri sedikit jeda agar transisi terlihat
    }

    // --- Logika Kontrol Tab ---
    const tabContainer = document.getElementById('tab-buttons');
    if (tabContainer) {
        const tabButtons = tabContainer.querySelectorAll('.tab-button');
        const tabPanes = document.getElementById('tab-content').querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-tab');
                const targetPane = document.getElementById(targetId);

                // Non-aktifkan semua tombol dan sembunyikan semua panel
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                tabPanes.forEach(pane => pane.classList.add('hidden'));

                // Aktifkan tombol yang diklik dan tampilkan panel yang sesuai
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
                if (targetPane) { targetPane.classList.remove('hidden'); }
            });
        });
    }

    // --- Fungsi Salin Laporan ke Clipboard ---
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const { label, confidence, info } = RESULT_DATA;
            const formatList = (title, list) => list && list.length ? `${title}:\n${list.map(item => `• ${item}`).join('\n')}\n\n` : '';
            const formatNumberedList = (title, list) => list && list.length ? `${title}:\n${list.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n` : '';
            
            // Buat teks laporan yang rapi
            const reportText = `--- Laporan Analisis Daun Anggur ---\nTanggal: ${formattedTimestamp}\n\nDIAGNOSIS: ${label} (Tingkat Keyakinan: ${confidence.toFixed(2)}%)\n\nDESKRIPSI:\n${info.description}\n\n${formatList('GEJALA UMUM', info.symptoms)}${formatList('FAKTOR PEMICU', info.triggers)}${formatNumberedList('REKOMENDASI TINDAKAN', info.action)}----------------------------------`;
            
            navigator.clipboard.writeText(reportText.trim()).then(() => {
                // Beri feedback visual kepada pengguna
                const copyButtonText = document.getElementById('copyButtonText');
                const copyIcon = document.getElementById('copyIcon');
                copyButtonText.innerText = 'Tersalin!';
                copyIcon.className = 'fa-solid fa-check';
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButtonText.innerText = 'Salin Laporan';
                    copyIcon.className = 'fa-regular fa-copy';
                    copyButton.disabled = false;
                }, 2500);
            });
        });
    }
    
    // --- Logika untuk Tombol Bagikan ---
    const shareButton = document.getElementById("shareButton");
    if (shareButton && navigator.share) {
        shareButton.addEventListener("click", async () => {
            const shareData = {
                title: `Hasil Analisis Daun Anggur - ${RESULT_DATA.label}`,
                text: `Hasil analisis daun anggur saya adalah "${RESULT_DATA.label}" dengan keyakinan ${RESULT_DATA.confidence.toFixed(1)}%. Lihat laporannya di GrapeCheck.`,
                url: window.location.href,
            };
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Gagal membagikan:", err);
            }
        });
    } else if (shareButton) {
        // Sembunyikan tombol jika Web Share API tidak didukung
        shareButton.style.display = "none";
    }


    // --- Fungsi Unduh Laporan sebagai PDF ---
    const downloadButton = document.getElementById('downloadButton');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const { label, confidence, info, all_probs } = RESULT_DATA;
            const downloadButtonText = document.getElementById('downloadButtonText');
            downloadButtonText.innerText = 'Membuat...';
            downloadButton.disabled = true;

            setTimeout(() => { // Beri jeda agar UI bisa update
                try {
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const primaryColor = '#166534';
                    const textColor = '#334155';
                    const lightTextColor = '#64748b';
                    const margin = 15;
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const usableWidth = pageWidth - (2 * margin);
                    let yPosition = 0;
                    const colorMap = { 'green': '#16a34a', 'red': '#dc2626', 'orange': '#f97316', 'yellow': '#eab308', 'zinc': '#71717a' };
                    const diagnosisColor = colorMap[info.color] || '#71717a';

                    // Fungsi untuk menambah header di setiap halaman
                    const addHeader = () => {
                        pdf.setFillColor(primaryColor);
                        pdf.rect(0, 0, pageWidth, 25, 'F');
                        pdf.setFontSize(16);
                        pdf.setTextColor('#FFFFFF');
                        pdf.setFont(undefined, 'bold');
                        pdf.text('Laporan Analisis GrapeCheck', margin, 16);
                        yPosition = 35;
                    };

                    // Fungsi untuk menambah footer di setiap halaman
                    const addFooter = (pageNumber, pageCount) => {
                        pdf.setFontSize(8);
                        pdf.setTextColor(lightTextColor);
                        pdf.setLineWidth(0.2);
                        pdf.line(margin, 280, pageWidth - margin, 280);
                        pdf.text(`Halaman ${pageNumber} dari ${pageCount}`, pageWidth - margin, 285, { align: 'right' });
                        pdf.text('© GrapeCheck', margin, 285);
                    };

                    // Cek jika butuh halaman baru
                    const checkPageBreak = () => {
                        if (yPosition > 260) {
                            pdf.addPage();
                            addHeader();
                        }
                    };
                    
                    // Fungsi untuk menambah bagian (judul + konten)
                    const addSection = (title, content, options = {}) => {
                        checkPageBreak();
                        pdf.setFontSize(options.size || 12);
                        pdf.setFont(undefined, options.style || 'bold');
                        pdf.setTextColor(options.color || primaryColor);
                        pdf.text(title, margin, yPosition);
                        yPosition += 6;
                        if (content) {
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'normal');
                            pdf.setTextColor(textColor);
                            const lines = pdf.splitTextToSize(content, usableWidth);
                            pdf.text(lines, margin, yPosition);
                            yPosition += (lines.length * 4) + 8;
                        }
                    };

                    // Fungsi untuk menambah daftar (list)
                    const addList = (title, list, isNumbered) => {
                        if (!list || list.length === 0) return;
                        addSection(title, null);
                        pdf.setFontSize(10);
                        pdf.setFont(undefined, 'normal');
                        pdf.setTextColor(textColor);
                        list.forEach((item, index) => {
                            checkPageBreak();
                            const prefix = isNumbered ? `${index + 1}. ` : '• ';
                            const lines = pdf.splitTextToSize(item, usableWidth - 5);
                            pdf.text(prefix, margin, yPosition);
                            pdf.text(lines, margin + 5, yPosition);
                            yPosition += (lines.length * 4) + 2;
                        });
                        yPosition += 6;
                    };

                    // --- Mulai Membuat Konten PDF ---
                    addHeader();

                    pdf.setFontSize(9);
                    pdf.setFont(undefined, 'normal');
                    pdf.setTextColor(lightTextColor);
                    pdf.text(formattedTimestamp, margin, yPosition);
                    yPosition += 10;
                    
                    pdf.setFillColor(diagnosisColor);
                    pdf.roundedRect(margin, yPosition, usableWidth, 12, 3, 3, 'F');
                    pdf.setFontSize(14);
                    pdf.setFont(undefined, 'bold');
                    pdf.setTextColor('#FFFFFF');
                    pdf.text(`DIAGNOSIS: ${label.toUpperCase()}`, margin + 5, yPosition + 8);
                    yPosition += 18;
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(textColor);
                    pdf.text(`Tingkat Keyakinan: ${confidence.toFixed(2)}%`, margin, yPosition);
                    yPosition += 10;

                    addSection('Deskripsi', info.description);
                    addList('Gejala Umum', info.symptoms, false);
                    addList('Faktor Pemicu', info.triggers, false);
                    addList('Rekomendasi Tindakan', info.action, true);
                    
                    if (label !== 'Negative' && all_probs) {
                       addList('Distribusi Probabilitas', 
                           Object.entries(all_probs).sort(([, a], [, b]) => b - a).map(([disease, prob]) => `${disease}: ${prob.toFixed(2)}%`), false);
                    }

                    // Tambahkan footer ke semua halaman yang ada
                    const pageCount = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        pdf.setPage(i);
                        addFooter(i, pageCount);
                    }
                    
                    const safeLabel = label.replace(/ /g, '_');
                    const fileDate = new Date().toISOString().split('T')[0];
                    const fileName = `Laporan_Analisis_${safeLabel}_${fileDate}.pdf`;
                    pdf.save(fileName);

                } catch (error) {
                    console.error("Gagal membuat PDF:", error);
                    alert("Maaf, terjadi kesalahan saat membuat file PDF.");
                } finally {
                    downloadButtonText.innerText = 'Unduh PDF';
                    downloadButton.disabled = false;
                }
            }, 50);
        });
    }

    // --- Inisialisasi Grafik Doughnut dengan Chart.js ---
    const probChartCanvas = document.getElementById('probChart');
    if (probChartCanvas && RESULT_DATA.label !== 'Negative') {
        const labels = Object.keys(RESULT_DATA.all_probs);
        const dataValues = Object.values(RESULT_DATA.all_probs);
        const colorMap = { 'red': 'rgba(220, 38, 38, 0.8)', 'orange': 'rgba(249, 115, 22, 0.8)', 'yellow': 'rgba(234, 179, 8, 0.8)', 'green': 'rgba(22, 163, 74, 0.8)', 'zinc': 'rgba(113, 113, 122, 0.8)' };
        const hoverColorMap = { 'red': 'rgba(220, 38, 38, 1)', 'orange': 'rgba(249, 115, 22, 1)', 'yellow': 'rgba(234, 179, 8, 1)', 'green': 'rgba(22, 163, 74, 1)', 'zinc': 'rgba(113, 113, 122, 1)' };
        
        const backgroundColors = labels.map(label => {
            const colorKey = (DISEASE_INFO[label] || {}).color || 'zinc';
            return colorMap[colorKey];
        });
        const hoverBackgroundColors = labels.map(label => {
            const colorKey = (DISEASE_INFO[label] || {}).color || 'zinc';
            return hoverColorMap[colorKey];
        });
        
        new Chart(probChartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    hoverBackgroundColor: hoverBackgroundColors,
                    borderColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
                    borderWidth: 4,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#475569',
                            padding: 20,
                            font: { family: "'Inter', sans-serif", size: 14, weight: '500' }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#0f172a',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed.toFixed(2)}%`
                        }
                    }
                }
            }
        });
    }
});