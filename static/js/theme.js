document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Prioritaskan tema tersimpan, jika tidak ada, gunakan preferensi sistem
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(currentTheme);
    // Simpan tema awal ke localStorage jika belum ada
    if (!savedTheme) {
         localStorage.setItem('theme', currentTheme);
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Perbarui warna grafik jika ada di halaman
            if (typeof Chart !== 'undefined' && Chart.instances) {
                Object.values(Chart.instances).forEach(chart => {
                     chart.options.plugins.legend.labels.color = newTheme === 'dark' ? '#d1d5db' : '#475569';
                     chart.data.datasets[0].borderColor = newTheme === 'dark' ? '#0f172a' : '#f8fafc';
                     chart.update();
                });
            }
        });
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});
