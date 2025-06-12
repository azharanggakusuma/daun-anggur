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

    // --- PERBAIKAN: Variabel untuk menyimpan file yang dipilih ---
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
            showAlert(
                "Format file tidak didukung. Harap pilih file JPG, PNG, atau JPEG."
            );
            fileInput.value = ""; // Reset input file
            resetDropzone(); // Pastikan UI kembali ke awal
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showAlert("Ukuran file terlalu besar. Maksimal 10MB.");
            fileInput.value = ""; // Reset input file
            resetDropzone(); // Pastikan UI kembali ke awal
            return;
        }

        hideAlert();
        
        // --- PERBAIKAN: Simpan file yang valid ke variabel ---
        selectedFile = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            uploadPlaceholder.classList.add("opacity-0", "hidden");
            imagePreview.innerHTML = `<img src="${e.target.result}" style="max-height: 160px; object-fit: cover;" class="rounded-lg mx-auto border border-secondary shadow-sm"><p class="text-sm text-muted mt-3 font-semibold truncate">${file.name}</p>`;
            imagePreview.classList.remove("hidden");
            setTimeout(() => imagePreview.classList.remove("opacity-0"), 50); // Efek fade in
            submitButton.disabled = false; // Aktifkan tombol submit
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
        // --- PERBAIKAN: Reset juga variabel file yang disimpan ---
        selectedFile = null;
    }

    if (uploadForm) {
        uploadForm.addEventListener("submit", function (e) {
            e.preventDefault();

            // --- PERBAIKAN: Periksa variabel, bukan input.files ---
            if (!selectedFile) {
                showAlert("Tidak ada file yang dipilih. Harap unggah sebuah gambar.");
                return;
            }

            // Ubah tampilan tombol menjadi loading
            buttonText.textContent = "Menganalisis...";
            buttonSpinner.classList.remove("hidden");
            submitButton.disabled = true;

            // --- PERBAIKAN: Buat FormData secara manual untuk keandalan ---
            const formData = new FormData();
            formData.append('file', selectedFile, selectedFile.name);

            fetch("/upload", {
                method: "POST",
                body: formData,
            })
            .then((response) => {
                if (!response.ok) {
                    // Jika ada error dari server, lempar sebagai promise rejection
                    return response.json().then((err) => {
                        throw err;
                    });
                }
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    // Arahkan ke halaman hasil jika berhasil
                    window.location.href = data.redirect_url;
                } else {
                    // Tampilkan error jika gagal
                    showAlert(data.error || "Terjadi kesalahan saat mengunggah file.");
                    buttonText.textContent = "Mulai Analisis";
                    buttonSpinner.classList.add("hidden");
                    if (selectedFile) {
                        submitButton.disabled = false;
                    }
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                showAlert(
                    error.error || "Tidak dapat terhubung ke server. Silakan coba lagi."
                );
                // Kembalikan tombol ke keadaan semula
                buttonText.textContent = "Mulai Analisis";
                buttonSpinner.classList.add("hidden");
                if (selectedFile) {
                    submitButton.disabled = false;
                }
            });
        });
    }

    if (dropzone) {
        // --- BUG FIX: Hapus event listener klik manual pada dropzone. ---
        // Input file yang transparan sudah menutupi area dropzone, 
        // sehingga klik dari pengguna akan langsung diterima oleh input file secara alami.
        // Event listener tambahan ini menyebabkan event klik kedua yang tidak perlu, 
        // sehingga memunculkan dialog pilih file dua kali.
        // dropzone.addEventListener("click", () => fileInput.click());

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
                // Gunakan file dari event drop secara langsung
                displayImagePreview(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener("change", () => {
            if (fileInput.files.length) {
                displayImagePreview(fileInput.files[0]);
            } else {
                resetDropzone();
            }
        });
    }
});
