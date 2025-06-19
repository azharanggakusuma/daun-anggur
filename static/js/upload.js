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
    const uploadPlaceholder = document.getElementById("uploadPlaceholder");
    
    // Elemen Kamera
    const videoFeed = document.getElementById("video-feed");
    const captureButton = document.getElementById("capture-button");
    const switchCameraButton = document.getElementById("switch-camera-button");
    const cameraPermissionPrompt = document.getElementById("camera-permission-prompt");
    
    // Elemen Pratinjau
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreviewImg = document.getElementById("image-preview-img");
    const imagePreviewFilename = document.getElementById("image-preview-filename");
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
        stopCamera(); // Hentikan stream yang ada sebelum memulai yang baru
        cameraPermissionPrompt.classList.add('hidden');
        try {
            const constraints = {
                video: { 
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Prioritaskan kamera belakang
                }
            };
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoFeed.srcObject = videoStream;
            videoFeed.classList.remove('hidden');
            captureButton.classList.remove('hidden');
        } catch (err) {
            console.error("Error accessing camera:", err);
            cameraPermissionPrompt.classList.remove('hidden');
            videoFeed.classList.add('hidden');
            captureButton.classList.add('hidden');
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
            if (availableCameras.length > 1) {
                switchCameraButton.classList.remove('hidden');
            } else {
                switchCameraButton.classList.add('hidden');
            }
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
        const context = canvas.getContext('2d');
        context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            selectedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
            stopCamera();
            displayImagePreview(selectedFile);
        }, 'image/jpeg', 0.95);
    }

    // --- Logika Penanganan UI & File ---
    function displayImagePreview(file) {
        if (!file) return;

        const objectURL = URL.createObjectURL(file);
        imagePreviewImg.src = objectURL;
        imagePreviewFilename.textContent = file.name;

        // Sembunyikan input, tampilkan pratinjau
        paneFile.classList.add('hidden');
        paneCamera.classList.add('hidden');
        imagePreviewContainer.classList.remove('hidden');
        
        submitButton.disabled = false;
        showNotification('Gambar berhasil dipilih!', 'success');
    }

    function resetToInitialState() {
        selectedFile = null;
        fileInput.value = "";
        
        // Sembunyikan pratinjau
        imagePreviewContainer.classList.add('hidden');
        imagePreviewImg.src = '';
        
        // Tampilkan pane yang sesuai dengan tab aktif
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
    }

    function switchTabs(targetTab) {
        if (activeTab === targetTab) return;
        activeTab = targetTab;
        resetToInitialState();

        if (targetTab === 'file') {
            tabFile.classList.add('active');
            tabCamera.classList.remove('active');
        } else {
            tabCamera.classList.add('active');
            tabFile.classList.remove('active');
            getAvailableCameras().then(() => {
                startCamera(availableCameras.length > 0 ? availableCameras[currentCameraIndex].deviceId : undefined);
            });
        }
    }
    
    // --- Event Listeners ---
    tabFile.addEventListener('click', () => switchTabs('file'));
    tabCamera.addEventListener('click', () => switchTabs('camera'));

    removeImageButton.addEventListener('click', resetToInitialState);
    
    // Listener untuk upload file
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
            selectedFile = e.dataTransfer.files[0];
            displayImagePreview(selectedFile);
        }
    });
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
            selectedFile = fileInput.files[0];
            displayImagePreview(selectedFile);
        }
    });

    // Listener untuk kamera
    captureButton.addEventListener('click', captureImage);
    switchCameraButton.addEventListener('click', switchCamera);

    // Listener untuk form submit
    uploadForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!selectedFile) {
            showNotification("Tidak ada file yang dipilih.", 'error');
            return;
        }

        buttonText.textContent = "Menganalisis...";
        buttonSpinner.classList.remove("hidden");
        submitButton.disabled = true;

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