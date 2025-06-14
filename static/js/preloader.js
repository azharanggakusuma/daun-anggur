window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Beri sedikit jeda agar transisi tidak terlalu kaku
        setTimeout(() => {
            preloader.classList.add('preloader-hidden');
        }, 200);
    }
});