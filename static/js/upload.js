document.addEventListener("DOMContentLoaded", function () {
    // --- Elemen DOM ---
    const uploadForm = document.getElementById("uploadForm");
    const submitButton = document.getElementById("submitButton");
    const buttonText = document.getElementById("buttonText");
    const buttonSpinner = document.getElementById("buttonSpinner");

    // Elemen Tab
    const tabFile = document.getElementById("tab-file");
    const tabCamera = document.getElementById("tab-camera");
    const paneFile = document.getElementById("pane-file");
    const paneCamera = document.getElementById("pane-camera");
    
    // Elemen Upload File
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    
    // Elemen Kamera
    const videoFeed = document.getElementById("video-feed");
    const captureButton = document.getElementById("capture-button");
    const switchCameraButton = document.getElementById("switch-camera-button");
    const cameraPermissionPrompt = document.getElementById("camera-permission-prompt");
    
    // Elemen Pratinjau
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreviewImg = document.getElementById("image-preview-img");
    const imagePreviewFilename = document.getElementById("image-preview-filename");
    const imagePreviewSize = document.getElementById("image-preview-size");
    const imagePreviewDimensions = document.getElementById("image-preview-dimensions");
    const removeImageButton = document.getElementById("remove-image-button");

    // Notifikasi Toast
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastMessage = document.getElementById("toast-message");
    let toastTimeout;

    // --- State Aplikasi ---
    let selectedFile = null;
    let activeTab = 'file';
    let videoStream = null;
    let availableCameras = [];
    let currentCameraIndex = 0;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; 

    // --- Fungsi Bantuan ---
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // --- Fungsi Notifikasi ---
    function showNotification(message, type = 'error') {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toast.className = `toast toast-visible toast-${type}`;
        toastIcon.className = `fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`;
        toastTimeout = setTimeout(() => {
            toast.classList.remove("toast-visible");
        }, 4000);
    }
    
    // --- Logika Kamera ---
    async function startCamera(deviceId = undefined) {
        stopCamera();
        cameraPermissionPrompt.classList.add('hidden');
        try {
            const constraints = {
                video: { 
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'environment'
                }
            };
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoFeed.srcObject = videoStream;
            videoFeed.style.display = 'block';
            captureButton.style.display = 'flex';
        } catch (err) {
            console.error("Error accessing camera:", err);
            cameraPermissionPrompt.classList.remove('hidden');
            videoFeed.style.display = 'none';
            captureButton.style.display = 'none';
            switchCameraButton.classList.add('hidden');
        }
    }

    function stopCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
            videoFeed.srcObject = null;
        }
    }

    async function getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            availableCameras = devices.filter(device => device.kind === 'videoinput');
            switchCameraButton.classList.toggle('hidden', availableCameras.length <= 1);
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    }

    function switchCamera() {
        if (availableCameras.length > 1) {
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
            startCamera(availableCameras[currentCameraIndex].deviceId);
        }
    }

    function captureImage() {
        const canvas = document.createElement('canvas');
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        canvas.getContext('2d').drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            handleFileSelection(file);
        }, 'image/jpeg', 0.95);
    }

    // --- Logika Penanganan UI & File ---
    function handleFileSelection(file) {
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            showNotification('Format file tidak valid. Harap pilih JPG, JPEG, atau PNG.', 'error');
            fileInput.value = "";
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showNotification(`Ukuran file melebihi batas ${formatBytes(MAX_FILE_SIZE)}.`, 'error');
            fileInput.value = "";
            return;
        }

        selectedFile = file;
        stopCamera();
        displayImagePreview(selectedFile);
    }

    function displayImagePreview(file) {
        const objectURL = URL.createObjectURL(file);
        imagePreviewImg.src = objectURL;
        imagePreviewFilename.textContent = file.name;
        imagePreviewSize.textContent = formatBytes(file.size);
        imagePreviewDimensions.textContent = 'Memuat dimensi...';

        const img = new Image();
        img.onload = function() {
            imagePreviewDimensions.textContent = `Dimensi: ${this.naturalWidth} x ${this.naturalHeight} px`;
            URL.revokeObjectURL(this.src);
        };
        img.src = objectURL;

        paneFile.classList.add('hidden');
        paneCamera.classList.add('hidden');
        imagePreviewContainer.classList.remove('hidden');
        
        submitButton.disabled = false;
        // Tambahkan animasi pulse pada tombol submit
        submitButton.classList.add('animate-subtle-pulse');
        
        showNotification('Gambar berhasil dipilih!', 'success');
    }

    function resetToInitialState() {
        selectedFile = null;
        fileInput.value = "";
        
        imagePreviewContainer.classList.add('hidden');
        imagePreviewImg.src = '';
        
        if (activeTab === 'file') {
            paneFile.classList.remove('hidden');
            paneCamera.classList.add('hidden');
            stopCamera();
        } else {
            paneFile.classList.add('hidden');
            paneCamera.classList.remove('hidden');
            startCamera(availableCameras.length > 0 ? availableCameras[currentCameraIndex].deviceId : undefined);
        }
        submitButton.disabled = true;
        // Hapus animasi pulse dari tombol submit
        submitButton.classList.remove('animate-subtle-pulse');
    }

    function switchTabs(targetTab) {
        if (activeTab === targetTab) return;
        activeTab = targetTab;
        resetToInitialState();

        tabFile.classList.toggle('active', targetTab === 'file');
        tabCamera.classList.toggle('active', targetTab === 'camera');
        
        if (targetTab === 'camera') {
            getAvailableCameras().then(() => {
                startCamera(availableCameras.length > 0 ? availableCameras[currentCameraIndex].deviceId : undefined);
            });
        }
    }

    function handlePaste(event) {
        if (selectedFile) return;
        const items = event.clipboardData?.files;
        if (items && items.length > 0) {
            for (const file of items) {
                if (file.type.startsWith("image/")) {
                    handleFileSelection(file);
                    break;
                }
            }
        }
    }
    
    // --- Event Listeners ---
    window.addEventListener('paste', handlePaste);

    tabFile.addEventListener('click', () => switchTabs('file'));
    tabCamera.addEventListener('click', () => switchTabs('camera'));

    removeImageButton.addEventListener('click', resetToInitialState);
    
    dropzone.addEventListener("dragenter", (e) => e.preventDefault());
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dropzone-active");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dropzone-active"));
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dropzone-active");
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
            handleFileSelection(fileInput.files[0]);
        }
    });

    captureButton.addEventListener('click', captureImage);
    switchCameraButton.addEventListener('click', switchCamera);

    uploadForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!selectedFile) {
            showNotification("Tidak ada file yang dipilih.", 'error');
            return;
        }

        buttonText.textContent = "Menganalisis...";
        buttonSpinner.classList.remove("hidden");
        submitButton.disabled = true;
        // Hentikan animasi pulse saat proses dimulai
        submitButton.classList.remove('animate-subtle-pulse');

        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);

        fetch("/upload", {
            method: "POST",
            body: formData,
        })
        .then(response => response.ok ? response.json() : response.json().then(err => { throw err; }))
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                throw new Error(data.error || "Terjadi kesalahan.");
            }
        })
        .catch(error => {
            showNotification(error.error || "Gagal mengunggah. Periksa koneksi Anda.", 'error');
            buttonText.textContent = "Mulai Analisis";
            buttonSpinner.classList.add("hidden");
            submitButton.disabled = false;
        });
    });

    // Inisialisasi awal
    switchTabs('file');
});