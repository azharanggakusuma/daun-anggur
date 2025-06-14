document.addEventListener('DOMContentLoaded', () => {
    const tourKey = 'grapecheck_tour_completed';

    // Cek apakah tur sudah pernah ditampilkan sebelumnya
    if (localStorage.getItem(tourKey)) {
        return;
    }

    // Konfigurasi Driver.js
    const driver = window.driver.js.driver;

    const driverObj = driver({
      showProgress: true,
      steps: [
        { 
            element: '#uploader-section', 
            popover: { 
                title: 'Selamat Datang di GrapeCheck!', 
                description: 'Ini adalah area utama. Unggah foto daun anggur Anda di sini untuk memulai analisis.',
                side: "top", 
                align: 'center' 
            }
        },
        { 
            element: '#nav-riwayat', 
            popover: { 
                title: 'Riwayat Analisis', 
                description: 'Semua hasil analisis Anda akan tersimpan di sini agar mudah diakses kembali.',
                side: "top", 
                align: 'start'
            }
        },
        { 
            element: '#theme-toggle', 
            popover: { 
                title: 'Ganti Tema', 
                description: 'Ganti tampilan antara mode terang dan gelap agar nyaman di mata.',
                side: "top", 
                align: 'start' 
            }
        },
        { 
            element: '#nav-panduan', 
            popover: { 
                title: 'Panduan & Info', 
                description: 'Pelajari berbagai jenis penyakit serta tips perawatan umum di sini.',
                side: "top", 
                align: 'end' 
            }
        },
        { 
            element: '#nav-tentang', 
            popover: { 
                title: 'Tentang Aplikasi', 
                description: 'Cari tahu lebih lanjut tentang misi dan teknologi di balik aplikasi ini.',
                side: "top", 
                align: 'end' 
            }
        },
      ],
      onDestroyed: () => {
        // Tandai bahwa tur telah selesai
        localStorage.setItem(tourKey, 'true');
      },
    });

    // Mulai tur setelah preloader selesai (beri jeda 1 detik)
    setTimeout(() => {
        driverObj.drive();
    }, 1000);
});