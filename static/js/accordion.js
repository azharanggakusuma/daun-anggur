document.addEventListener('DOMContentLoaded', () => {
    const accordions = document.querySelectorAll('.accordion-item');

    accordions.forEach(accordion => {
        accordion.addEventListener('toggle', (event) => {
            // Hanya jalankan jika accordion baru saja dibuka
            if (event.target.open) {
                accordions.forEach(otherAccordion => {
                    // Tutup semua accordion lain yang bukan target
                    if (otherAccordion !== event.target) {
                        otherAccordion.open = false;
                    }
                });
            }
        });
    });
});