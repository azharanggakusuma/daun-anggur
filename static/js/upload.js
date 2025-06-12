document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("uploadForm");
    const submitButton = document.getElementById("submitButton");
    const buttonText = document.getElementById("buttonText");
    const buttonSpinner = document.getElementById("buttonSpinner");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const uploadPlaceholder = document.getElementById("uploadPlaceholder");
    const imagePreview = document.getElementById("imagePreview");
    const alertBox = document.getElementById("alert-box");
    const alertMessage = document.getElementById("alert-message");

    let selectedFile = null;

    /**
     * Menampilkan notifikasi kesalahan.
     * @param {string} message - Pesan kesalahan yang akan ditampilkan.
     */
    function showAlert(message) {
        alertMessage.textContent = message;
        alertBox.classList.remove("hidden");
    }

    /**
     * Menyembunyikan notifikasi kesalahan.
     */
    function hideAlert() {
        alertBox.classList.add("hidden");
    }

    /**
     * Menampilkan pratinjau gambar yang dipilih oleh pengguna.
     * @param {File} file - Objek file gambar.
     */
    function displayImagePreview(file) {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
            showAlert("Format file tidak didukung. Harap pilih file JPG, PNG, atau JPEG.");
            resetDropzone();
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showAlert("Ukuran file terlalu besar. Maksimal 10MB.");
            resetDropzone();
            return;
        }

        hideAlert();
        selectedFile = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            uploadPlaceholder.classList.add("opacity-0", "hidden");
            imagePreview.innerHTML = `<img src="${e.target.result}" style="max-height: 160px; object-fit: cover;" class="rounded-lg mx-auto border border-secondary shadow-sm"><p class="text-sm text-muted mt-3 font-semibold truncate">${file.name}</p>`;
            imagePreview.classList.remove("hidden");
            setTimeout(() => imagePreview.classList.remove("opacity-0"), 50);
            submitButton.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Mengembalikan dropzone ke keadaan semula.
     */
    function resetDropzone() {
        uploadPlaceholder.classList.remove("hidden");
        setTimeout(() => uploadPlaceholder.classList.remove("opacity-0"), 50);
        imagePreview.classList.add("opacity-0", "hidden");
        imagePreview.innerHTML = "";
        fileInput.value = "";
        submitButton.disabled = true;
        selectedFile = null;
    }

    if (uploadForm) {
        /**
         * PENINGKATAN: Fungsi terpusat untuk menangani kegagalan unggah.
         * @param {string} errorMessage - Pesan error yang akan ditampilkan.
         */
        function handleUploadFailure(errorMessage) {
            showAlert(errorMessage);
            buttonText.textContent = "Mulai Analisis";
            buttonSpinner.classList.add("hidden");
            resetDropzone(); // Reset UI, termasuk file preview dan tombol
        }

        uploadForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!selectedFile) {
                showAlert("Tidak ada file yang dipilih. Harap unggah sebuah gambar.");
                return;
            }

            buttonText.textContent = "Menganalisis...";
            buttonSpinner.classList.remove("hidden");
            submitButton.disabled = true;

            const formData = new FormData();
            formData.append('file', selectedFile, selectedFile.name);

            // --- PENINGKATAN: Tambahkan AbortController untuk timeout ---
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout 30 detik

            fetch("/upload", {
                method: "POST",
                body: formData,
                signal: controller.signal, // Kaitkan sinyal dengan fetch
            })
            .then((response) => {
                clearTimeout(timeoutId); // Hapus timeout jika respons diterima
                
                // --- PENINGKATAN: Penanganan error server yang lebih baik ---
                if (!response.ok) {
                    // Coba baca sebagai JSON, jika gagal, lempar error umum
                    return response.json()
                        .then(err => { throw err; })
                        .catch(() => { throw new Error(`Server merespons dengan status ${response.status}`); });
                }
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    window.location.href = data.redirect_url;
                } else {
                    // Gunakan fungsi terpusat untuk menangani kegagalan
                    handleUploadFailure(data.error || "Terjadi kesalahan saat mengunggah file.");
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error("Error:", error);

                let message;
                if (error.name === 'AbortError') {
                    message = "Proses unggah terlalu lama. Periksa koneksi Anda dan coba lagi.";
                } else if (error.error) {
                    message = error.error;
                } else {
                    message = "Tidak dapat terhubung ke server atau terjadi kesalahan.";
                }
                // Gunakan fungsi terpusat untuk menangani kegagalan
                handleUploadFailure(message);
            });
        });
    }

    if (dropzone) {
        // Event listener untuk drag-and-drop
        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ["dragenter", "dragover"].forEach((eventName) => {
            dropzone.addEventListener(eventName, () =>
                dropzone.classList.add("dropzone-active")
            );
        });
        ["dragleave", "drop"].forEach((eventName) => {
            dropzone.addEventListener(eventName, () =>
                dropzone.classList.remove("dropzone-active")
            );
        });

        dropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files.length) {
                displayImagePreview(e.dataTransfer.files[0]);
            }
        });

        // Event listener untuk input file
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length) {
                displayImagePreview(fileInput.files[0]);
            } else {
                resetDropzone();
            }
        });
    }
});
