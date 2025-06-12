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

  function showAlert(message) {
    alertMessage.textContent = message;
    alertBox.classList.remove("hidden");
  }

  function hideAlert() {
    alertBox.classList.add("hidden");
  }

  function displayImagePreview(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showAlert(
        "Format file tidak didukung. Harap pilih file JPG, PNG, atau JPEG."
      );
      fileInput.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showAlert("Ukuran file terlalu besar. Maksimal 10MB.");
      fileInput.value = "";
      return;
    }

    hideAlert();
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadPlaceholder.classList.add("hidden");
      imagePreview.innerHTML = `<img src="${e.target.result}" style="max-height: 160px; object-fit: cover;" class="rounded-lg mx-auto border border-gray-200 shadow-sm"><p class="text-sm text-gray-600 mt-3 font-semibold truncate">${file.name}</p>`;
      imagePreview.classList.remove("hidden");
      submitButton.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  function resetDropzone() {
    uploadPlaceholder.classList.remove("hidden");
    imagePreview.classList.add("hidden");
    imagePreview.innerHTML = "";
    fileInput.value = "";
    submitButton.disabled = true;
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (fileInput.files.length === 0) {
        showAlert("Tidak ada file yang dipilih. Harap unggah sebuah gambar.");
        return;
      }

      buttonText.textContent = "Menganalisis...";
      buttonSpinner.classList.remove("hidden");
      submitButton.disabled = true;

      const formData = new FormData(this);

      fetch("/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((err) => {
              throw err;
            });
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            window.location.href = data.redirect_url;
          } else {
            showAlert(data.error || "Terjadi kesalahan saat mengunggah file.");
            buttonText.textContent = "Mulai Analisis";
            buttonSpinner.classList.add("hidden");
            if (fileInput.files.length > 0) {
              submitButton.disabled = false;
            }
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showAlert(
            error.error || "Tidak dapat terhubung ke server. Silakan coba lagi."
          );
          buttonText.textContent = "Mulai Analisis";
          buttonSpinner.classList.add("hidden");
          if (fileInput.files.length > 0) {
            submitButton.disabled = false;
          }
        });
    });
  }

  if (dropzone) {
    dropzone.addEventListener("click", () => fileInput.click());

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
        fileInput.files = e.dataTransfer.files;
        displayImagePreview(fileInput.files[0]);
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
