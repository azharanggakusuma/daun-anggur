document.addEventListener('DOMContentLoaded', () => {
    const tourKey = 'grapecheck_tour_completed';

    // Cek apakah tur sudah pernah ditampilkan
    if (localStorage.getItem(tourKey)) {
        return;
    }

    const steps = [
        {
            element: '#uploader-section',
            title: 'Selamat Datang di GrapeCheck!',
            content: 'Ini adalah area utama. Cukup unggah foto daun anggur Anda di sini untuk memulai analisis.'
        },
        {
            element: 'a[href="/riwayat"]',
            title: 'Riwayat Analisis',
            content: 'Semua hasil analisis Anda akan tersimpan di sini agar mudah diakses kembali.'
        },
        {
            element: '#theme-toggle',
            title: 'Ganti Tema',
            content: 'Anda bisa mengganti tampilan antara mode terang dan gelap di sini agar nyaman di mata.'
        },
        {
            element: 'a[href="/penyakit"]',
            title: 'Info Penyakit',
            content: 'Pelajari berbagai jenis penyakit yang dapat dideteksi oleh aplikasi ini.'
        },
        {
            element: 'a[href="/tips"]',
            title: 'Tips & Trik',
            content: 'Temukan panduan dan tips bermanfaat untuk merawat tanaman anggur Anda.'
        }
    ];

    let currentStep = 0;

    function createTourElement(step) {
        const targetElement = document.querySelector(step.element);
        if (!targetElement) return;

        // Buat overlay
        const overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        
        // Buat tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tour-tooltip';
        tooltip.innerHTML = `
            <h3 class="tour-title">${step.title}</h3>
            <p class="tour-content">${step.content}</p>
            <div class="tour-nav">
                <span class="tour-counter">${currentStep + 1} / ${steps.length}</span>
                <div>
                    <button class="tour-skip-btn">Lewati</button>
                    <button class="tour-next-btn">Lanjut</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(tooltip);

        // Posisikan tooltip
        const targetRect = targetElement.getBoundingClientRect();
        tooltip.style.left = `${targetRect.left + (targetRect.width / 2)}px`;
        
        if (window.innerWidth < 640 && step.element.startsWith('a[href')) {
            // Untuk nav mobile, posisikan di atas
            tooltip.style.top = `${targetRect.top - 10}px`;
            tooltip.style.transform = 'translate(-50%, -100%)';
        } else {
            // Posisi default
            tooltip.style.top = `${targetRect.bottom + 10}px`;
            tooltip.style.transform = 'translateX(-50%)';
        }

        targetElement.classList.add('tour-highlight');

        tooltip.querySelector('.tour-next-btn').addEventListener('click', nextStep);
        tooltip.querySelector('.tour-skip-btn').addEventListener('click', endTour);
        overlay.addEventListener('click', endTour);
    }

    function cleanupTour() {
        document.querySelectorAll('.tour-overlay, .tour-tooltip').forEach(el => el.remove());
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    }

    function nextStep() {
        cleanupTour();
        currentStep++;
        if (currentStep < steps.length) {
            createTourElement(steps[currentStep]);
        } else {
            endTour();
        }
    }

    function endTour() {
        cleanupTour();
        localStorage.setItem(tourKey, 'true');
    }

    // Mulai tur setelah sedikit jeda
    setTimeout(() => {
        createTourElement(steps[0]);
    }, 1000);
});