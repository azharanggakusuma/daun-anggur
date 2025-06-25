document.addEventListener("DOMContentLoaded", function () {
  // --- DOM Elements ---
  const uploadForm = document.getElementById("uploadForm");
  const submitButton = document.getElementById("submitButton");
  const buttonText = document.getElementById("buttonText");
  const buttonSpinner = document.getElementById("buttonSpinner");

  const tabFile = document.getElementById("tab-file");
  const tabCamera = document.getElementById("tab-camera");
  const paneFile = document.getElementById("pane-file");
  const paneCamera = document.getElementById("pane-camera");

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  const videoFeed = document.getElementById("video-feed");
  const captureButton = document.getElementById("capture-button");
  const switchCameraButton = document.getElementById("switch-camera-button");
  const cameraPermissionPrompt = document.getElementById("camera-permission-prompt");

  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const imagePreviewImg = document.getElementById("image-preview-img");
  const imagePreviewFilename = document.getElementById("image-preview-filename");
  const imagePreviewSize = document.getElementById("image-preview-size");
  const imagePreviewDimensions = document.getElementById("image-preview-dimensions");
  const removeImageButton = document.getElementById("remove-image-button");

  const toast = document.getElementById("toast");
  const toastIcon = document.getElementById("toast-icon");
  const toastMessage = document.getElementById("toast-message");

  const cropModal = document.getElementById("cropModal");
  const cropperImage = document.getElementById("cropperImage");
  const cancelCrop = document.getElementById("cancelCrop");
  const confirmCrop = document.getElementById("confirmCrop");
  const uploadOverlay = document.getElementById("uploadOverlay");

  let selectedFile = null;
  let croppedBlob = null;
  let cropper = null;
  let toastTimeout;
  let activeTab = "file";
  let videoStream = null;
  let availableCameras = [];
  let currentCameraIndex = 0;

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const RESIZE_WIDTH = 800;

  function formatBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB"];
    if (bytes === 0) return "0 Bytes";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  function showNotification(message, type = "error") {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.className = `toast toast-visible toast-${type}`;
    toastIcon.className = `fa-solid ${
      type === "success" ? "fa-circle-check" : "fa-circle-exclamation"
    }`;
    toastTimeout = setTimeout(() => toast.classList.remove("toast-visible"), 4000);
  }

  function switchTabs(targetTab) {
    if (activeTab === targetTab) return;
    activeTab = targetTab;
    resetToInitialState();

    tabFile.classList.toggle("active", targetTab === "file");
    tabCamera.classList.toggle("active", targetTab === "camera");

    if (targetTab === "camera") {
      getAvailableCameras().then(() => {
        startCamera(
          availableCameras.length > 0 ? availableCameras[currentCameraIndex].deviceId : undefined
        );
      });
    }
  }

  function resetToInitialState() {
    selectedFile = null;
    croppedBlob = null;
    fileInput.value = "";

    imagePreviewContainer.classList.add("hidden");
    imagePreviewImg.src = "";

    if (activeTab === "file") {
      paneFile.classList.remove("hidden");
      paneCamera.classList.add("hidden");
      stopCamera();
    } else {
      paneFile.classList.add("hidden");
      paneCamera.classList.remove("hidden");
      startCamera();
    }

    submitButton.disabled = true;
    submitButton.classList.remove("animate-subtle-pulse");
  }

  function displayImagePreview(blob, filename = "image.jpg") {
    const objectURL = URL.createObjectURL(blob);
    imagePreviewImg.src = objectURL;
    imagePreviewFilename.textContent = filename;
    imagePreviewSize.textContent = formatBytes(blob.size);
    imagePreviewDimensions.textContent = "Memuat...";

    const img = new Image();
    img.onload = function () {
      imagePreviewDimensions.textContent = `${this.naturalWidth} x ${this.naturalHeight}px`;
      URL.revokeObjectURL(this.src);
    };
    img.src = objectURL;

    imagePreviewContainer.classList.remove("hidden");
    paneFile.classList.add("hidden");
    paneCamera.classList.add("hidden");

    submitButton.disabled = false;
    submitButton.classList.add("animate-subtle-pulse");
  }

  function openCropper(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      cropperImage.src = e.target.result;
      cropModal.classList.remove("hidden");

      if (cropper) cropper.destroy();
      cropper = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
      });
    };
    reader.readAsDataURL(file);
  }

  function resizeImage(blob, callback) {
    const img = new Image();
    img.onload = function () {
      const scale = RESIZE_WIDTH / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = RESIZE_WIDTH;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((resizedBlob) => callback(resizedBlob), "image/jpeg", 0.9);
    };
    img.src = URL.createObjectURL(blob);
  }

  function handleFileSelection(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showNotification("Format file tidak valid.", "error");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showNotification(`Ukuran file melebihi ${formatBytes(MAX_FILE_SIZE)}.`, "error");
      return;
    }

    selectedFile = file;
    openCropper(file);
  }

  confirmCrop.addEventListener("click", () => {
    cropModal.classList.add("hidden");
    cropper.getCroppedCanvas().toBlob((blob) => {
      if (blob.size > MAX_FILE_SIZE) {
        resizeImage(blob, (resized) => {
          croppedBlob = resized;
          displayImagePreview(resized, selectedFile.name);
        });
      } else {
        croppedBlob = blob;
        displayImagePreview(blob, selectedFile.name);
      }
    }, "image/jpeg", 0.95);
  });

  cancelCrop.addEventListener("click", () => {
    cropModal.classList.add("hidden");
    cropper?.destroy();
    cropper = null;
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dropzone-active");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dropzone-active");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dropzone-active");
    if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) handleFileSelection(fileInput.files[0]);
  });

  removeImageButton.addEventListener("click", resetToInitialState);

  tabFile.addEventListener("click", () => switchTabs("file"));
  tabCamera.addEventListener("click", () => switchTabs("camera"));

  uploadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!croppedBlob) {
      showNotification("Tidak ada gambar yang dipilih.", "error");
      return;
    }

    buttonText.textContent = "Menganalisis...";
    buttonSpinner.classList.remove("hidden");
    submitButton.disabled = true;
    uploadOverlay.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", croppedBlob, "image.jpg");

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => (res.ok ? res.json() : res.json().then((err) => Promise.reject(err))))
      .then((data) => {
        if (data.success) {
          window.location.href = data.redirect_url;
        } else {
          throw new Error(data.error || "Terjadi kesalahan");
        }
      })
      .catch((err) => {
        showNotification(err.message || "Upload gagal", "error");
        buttonText.textContent = "Mulai Analisis";
        buttonSpinner.classList.add("hidden");
        submitButton.disabled = false;
        uploadOverlay.classList.add("hidden");
      });
  });

  // --- Kamera ---
  async function getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      availableCameras = devices.filter((d) => d.kind === "videoinput");
      switchCameraButton.classList.toggle("hidden", availableCameras.length <= 1);
    } catch (err) {
      console.error(err);
    }
  }

  async function startCamera(deviceId = undefined) {
    stopCamera();
    cameraPermissionPrompt.classList.add("hidden");
    try {
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: "environment",
        },
      };
      videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoFeed.srcObject = videoStream;
    } catch (err) {
      cameraPermissionPrompt.classList.remove("hidden");
    }
  }

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      videoFeed.srcObject = null;
    }
  }

  function switchCamera() {
    if (availableCameras.length > 1) {
      currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      startCamera(availableCameras[currentCameraIndex].deviceId);
    }
  }

  captureButton.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoFeed.videoWidth;
    canvas.height = videoFeed.videoHeight;
    canvas.getContext("2d").drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => handleFileSelection(blob), "image/jpeg", 0.95);
  });

  switchCameraButton.addEventListener("click", switchCamera);
  window.addEventListener("paste", (event) => {
    if (event.clipboardData?.files.length) {
      const file = event.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelection(file);
      }
    }
  });

  switchTabs("file");
});
