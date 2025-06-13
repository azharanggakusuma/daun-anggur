document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("uploadForm");
    const submitButton = document.getElementById("submitButton");
    const buttonText = document.getElementById("buttonText");
    const buttonSpinner = document.getElementById("buttonSpinner");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const uploadPlaceholder = document.getElementById("uploadPlaceholder");
    const imagePreview = document.getElementById("imagePreview");
    
    // Elemen Toast Baru
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    let toastTimeout;

    let selectedFile = null;

    /**
     * Menampilkan notifikasi toast.
     * @param {string} message - Pesan yang akan ditampilkan.
     */
    function showAlert(message) {
        // Hapus timeout sebelumnya jika ada
        clearTimeout(toastTimeout);

        toastMessage.textContent = message;
        toast.classList.add("toast-visible");

        // Sembunyikan toast setelah 4 detik
        toastTimeout = setTimeout(() => {
            toast.classList.remove("toast-visible");
        }, 4000);
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
        
        selectedFile = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            uploadPlaceholder.classList.add("opacity-0", "hidden");
            
            // Hapus kelas animasi lama jika ada, lalu tambahkan yang baru
            imagePreview.classList.remove('animate-fade-in-zoom');
            imagePreview.innerHTML = `<img src="${e.target.result}" style="max-height: 160px; object-fit: cover;" class="rounded-lg mx-auto border border-secondary shadow-sm"><p class="text-sm text-muted mt-3 font-semibold truncate">${file.name}</p>`;
            
            // Tambahkan kelas animasi
            imagePreview.classList.add('animate-fade-in-zoom');

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
         * Fungsi terpusat untuk menangani kegagalan unggah.
         * @param {string} errorMessage - Pesan error yang akan ditampilkan.
         */
        function handleUploadFailure(errorMessage) {
            showAlert(errorMessage);
            buttonText.textContent = "Mulai Analisis";
            buttonSpinner.classList.add("hidden");
            submitButton.disabled = false; // Aktifkan lagi tombolnya
            // Jangan reset dropzone jika file sudah ada, agar pengguna tidak perlu upload ulang
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

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout 30 detik

            fetch("/upload", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            })
            .then((response) => {
                clearTimeout(timeoutId);
                
                if (!response.ok) {
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
                    handleUploadFailure(data.error || "Terjadi kesalahan saat mengunggah file.");
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error("Error:", error);

                let message;
                if (error.name === 'AbortError') {
                    message = "Proses unggah terlalu lama. Coba lagi.";
                } else if (error.error) {
                    message = error.error;
                } else {
                    message = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";
                }
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