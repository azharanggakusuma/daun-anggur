/**
 * Fungsi ini menyembunyikan animasi preloader.
 * Fungsi akan dipanggil setelah halaman selesai dimuat.
 */
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Jeda singkat ditambahkan untuk memastikan transisi berjalan mulus.
        setTimeout(() => {
            preloader.classList.add('preloader-hidden');
        }, 200);
    }
}

/**
 * Fungsi ini menampilkan animasi preloader.
 * Fungsi akan dipanggil sesaat sebelum pengguna menavigasi ke halaman baru.
 */
function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.remove('preloader-hidden');
    }
}

// 1. Sembunyikan preloader saat halaman baru siap ditampilkan.
//    Event 'load' menunggu semua sumber daya (gambar, dll.) dimuat sepenuhnya.
window.addEventListener('load', hidePreloader);

// 2. Tampilkan preloader saat halaman akan ditinggalkan.
//    Ini terjadi ketika pengguna mengklik tautan untuk menavigasi ke halaman lain.
window.addEventListener('beforeunload', showPreloader);

// 3. Penanganan untuk browser yang menggunakan cache back/forward (bfcache).
//    Saat halaman dipulihkan dari bfcache, event 'load' mungkin tidak terpicu.
//    'pageshow' akan terpicu, dan jika event.persisted bernilai true, itu berarti halaman berasal dari cache.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Sembunyikan preloader segera karena halaman sudah dimuat dari cache.
        hidePreloader();
    }
});