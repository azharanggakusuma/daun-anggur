/**
 * IIFE (Immediately Invoked Function Expression)
 * Ini membungkus semua logika untuk menghindari polusi scope global.
 */
(() => {
    // Jalankan skrip setelah seluruh konten halaman dimuat.
    document.addEventListener('DOMContentLoaded', () => {

        // --- Elemen DOM ---
        const themeToggleButton = document.getElementById('theme-toggle');
        const currentYearSpan = document.getElementById('currentYear');
        const htmlElement = document.documentElement;

        /**
         * Menerapkan tema yang dipilih ke elemen <html>.
         * @param {string} theme - Nama tema ('dark' atau 'light').
         */
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }
        };
        
        /**
         * Memperbarui warna pada grafik Chart.js saat tema berubah.
         * @param {string} theme - Tema baru yang diterapkan.
         */
        const updateChartsTheme = (theme) => {
            // Pastikan Chart.js sudah dimuat dan ada instance grafik
            if (typeof Chart === 'undefined' || !Chart.instances) {
                return;
            }

            const isDark = theme === 'dark';
            const legendColor = isDark ? '#d1d5db' : '#475569'; // slate-300 | slate-600
            const borderColor = isDark ? '#0f172a' : '#f8fafc'; // slate-900 | slate-50

            Object.values(Chart.instances).forEach(chart => {
                if (chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = legendColor;
                }
                if (chart.data.datasets.length > 0) {
                    chart.data.datasets[0].borderColor = borderColor;
                }
                chart.update();
            });
        };

        // --- Logika Inisialisasi Tema ---
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Prioritaskan tema yang tersimpan di localStorage. Jika tidak ada, gunakan preferensi sistem.
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        applyTheme(initialTheme);

        // Simpan tema awal ke localStorage jika belum pernah disimpan sebelumnya.
        if (!savedTheme) {
            localStorage.setItem('theme', initialTheme);
        }

        // --- Event Listener ---
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => {
                // Tentukan tema baru berdasarkan kelas yang ada saat ini.
                const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
                
                // Terapkan tema baru dan simpan ke localStorage.
                applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);

                // Perbarui tema pada grafik jika ada.
                updateChartsTheme(newTheme);
            });
        }
        
        // --- PENAMBAHAN: Haptic Feedback untuk Kontrol Navigasi ---
        const triggerVibration = (duration = 1) => {
            // Durasinya 1ms adalah getaran "tap" yang sangat halus
            if (window.navigator.vibrate) {
                window.navigator.vibrate(duration);
            }
        };

        // Terapkan getaran pada semua tombol/link di dalam header/nav
        document.querySelectorAll('header nav a, header nav button').forEach(button => {
            button.addEventListener('click', () => triggerVibration());
        });


        // --- Utilitas Tambahan ---
        // Atur tahun saat ini di footer.
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    });
})();