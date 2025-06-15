document.addEventListener("DOMContentLoaded", function () {
  /**
   * Fungsi untuk menganimasikan angka dari 0 ke nilai akhir.
   * @param {HTMLElement} element - Elemen DOM yang akan dianimasikan.
   * @param {number} finalValue - Nilai angka terakhir yang akan ditampilkan.
   * @param {number} duration - Durasi animasi dalam milidetik.
   */
  function animateCounter(element, finalValue, duration = 1200) { // Durasi disamakan dengan bar
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = progress * finalValue;
      element.textContent = `${currentValue.toFixed(1)}%`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Memastikan nilai akhir akurat
        element.textContent = `${finalValue.toFixed(1)}%`;
      }
    };
    window.requestAnimationFrame(step);
  }

  // Kontrol Skeleton dan Konten Asli
  const skeleton = document.getElementById("result-skeleton");
  const content = document.getElementById("result-content");

  if (skeleton && content) {
    // Tunda penampilan konten asli untuk memberikan efek loading
    setTimeout(() => {
      if (skeleton) skeleton.style.display = "none";
      if (content) content.classList.remove("hidden");

      // ---- PERUBAHAN DI SINI: Logika untuk menganimasikan bar dan teks ----
      const confidenceBar = document.getElementById("confidence-bar");
      if (confidenceBar) {
        const confidenceValue = confidenceBar.getAttribute("data-confidence");
        // Atur style.width untuk memicu transisi CSS yang sudah didefinisikan di HTML
        confidenceBar.style.width = `${confidenceValue}%`;
      }
      
      const confidenceText = document.getElementById("confidence-text");
      if (confidenceText && typeof RESULT_DATA !== "undefined") {
        const finalConfidence = parseFloat(RESULT_DATA.confidence);
        animateCounter(confidenceText, finalConfidence);
      }
    }, 500); // Delay 500ms
  }

  if (typeof RESULT_DATA === "undefined" || !RESULT_DATA) return;

  // --- Sisa kode di result.js tetap sama ---
  // ... (Pemformatan Waktu, Riwayat, Kontrol Tab, Chart, dll) ...

  // --- Pemformatan Waktu ---
  const date = new Date(RESULT_DATA.timestamp);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  const formattedTimestamp = new Intl.DateTimeFormat("id-ID", options).format(
    date
  );
  const timestampDisplay = document.getElementById("timestamp-display");
  if (timestampDisplay)
    timestampDisplay.textContent = `Dianalisis pada ${formattedTimestamp}`;

  // --- Simpan ke Riwayat ---
  function saveToHistory() {
    if (RESULT_DATA.label === "Negative") return;
    let history = JSON.parse(localStorage.getItem("analysisHistory")) || [];
    if (history.some((item) => item.filename === RESULT_DATA.image)) return;
    history.unshift({
      filename: RESULT_DATA.image,
      label: RESULT_DATA.label,
      confidence: RESULT_DATA.confidence.toFixed(1),
      timestamp: new Date().toISOString(),
    });
    if (history.length > 15) history = history.slice(0, 15);
    localStorage.setItem("analysisHistory", JSON.stringify(history));
  }
  if (RESULT_DATA.label !== "Negative") saveToHistory();

  // --- KONTROL TAB ---
  const tabContainer = document.getElementById("tab-buttons");
  if (tabContainer) {
    const tabButtons = tabContainer.querySelectorAll(".tab-button");
    const tabPanes = document
      .getElementById("tab-content")
      .querySelectorAll(".tab-pane");
    const animateListItems = (pane) => {
      pane.querySelectorAll(".stagger-list li").forEach((item, index) => {
        item.classList.remove("animate-stagger-in");
        void item.offsetWidth; // Trigger reflow
        item.classList.add("animate-stagger-in");
        item.style.animationDelay = `${index * 80}ms`;
      });
    };
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab");
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabPanes.forEach((pane) => pane.classList.add("hidden"));
        button.classList.add("active");
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.remove("hidden");
          animateListItems(targetPane);
        }
      });
    });
    const initialActivePane = document.querySelector(".tab-pane:not(.hidden)");
    if (initialActivePane) animateListItems(initialActivePane);
  }

  // --- Inisialisasi Chart Distribusi Probabilitas ---
  const probChartCanvas = document.getElementById("probChart");
  if (probChartCanvas && RESULT_DATA.label !== "Negative") {
    const labels = Object.keys(RESULT_DATA.all_probs);
    const dataValues = Object.values(RESULT_DATA.all_probs);
    const colorMap = {
      red: "#ef4444",
      orange: "#f97316",
      yellow: "#eab308",
      green: "#22c55e",
      zinc: "#71717a",
    };
    const backgroundColors = labels.map(
      (label) => colorMap[(DISEASE_INFO[label] || {}).color || "zinc"]
    );

    new Chart(probChartCanvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: document.documentElement.classList.contains("dark")
              ? "#0f172a"
              : "#f8fafc",
            borderWidth: 4,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: document.documentElement.classList.contains("dark")
                ? "#d1d5db"
                : "#475569",
              padding: 20,
              font: { family: "'Inter', sans-serif", size: 14, weight: "500" },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.label}: ${context.parsed.toFixed(2)}%`,
            },
          },
        },
      },
    });
  }

  // --- Fungsi Salin Laporan ke Clipboard ---
  const copyButton = document.getElementById("copyButton");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      const { label, confidence, info } = RESULT_DATA;
      const formatList = (title, list) =>
        list && list.length
          ? `${title}:\n${list.map((item) => `• ${item}`).join("\n")}\n\n`
          : "";
      const formatNumberedList = (title, list) =>
        list && list.length
          ? `${title}:\n${list
              .map((item, index) => `${index + 1}. ${item}`)
              .join("\n")}\n\n`
          : "";

      const reportText = `--- Laporan Analisis Daun Anggur ---\nTanggal: ${formattedTimestamp}\n\nDIAGNOSIS: ${label} (Tingkat Keyakinan: ${confidence.toFixed(
        2
      )}%)\n\nDESKRIPSI:\n${info.description}\n\n${formatList(
        "GEJALA UMUM",
        info.symptoms
      )}${formatList("FAKTOR PEMICU", info.triggers)}${formatNumberedList(
        "REKOMENDASI TINDAKAN",
        info.action
      )}----------------------------------`;

      navigator.clipboard.writeText(reportText.trim()).then(() => {
        const copyButtonText = document.getElementById("copyButtonText");
        const copyIcon = document.getElementById("copyIcon");
        copyButtonText.innerText = "Tersalin!";
        copyIcon.className = "fa-solid fa-check";
        copyButton.disabled = true;
        setTimeout(() => {
          copyButtonText.innerText = "Salin Laporan";
          copyIcon.className = "fa-regular fa-copy";
          copyButton.disabled = false;
        }, 2500);
      });
    });
  }

  // --- Logika untuk Tombol Bagikan ---
  const shareButton = document.getElementById("shareButton");
  if (shareButton && navigator.share) {
    shareButton.addEventListener("click", async () => {
      const shareData = {
        title: `Hasil Analisis Daun Anggur - ${RESULT_DATA.label}`,
        text: `Hasil analisis daun anggur saya adalah "${
          RESULT_DATA.label
        }" dengan keyakinan ${RESULT_DATA.confidence.toFixed(
          1
        )}%. Lihat laporannya di GrapeCheck.`,
        url: window.location.href,
      };
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Gagal membagikan:", err);
      }
    });
  } else if (shareButton) {
    shareButton.disabled = true;
    shareButton.title =
      "Fitur 'Bagikan' hanya tersedia di browser mobile dan koneksi HTTPS.";
    shareButton.classList.add("opacity-50", "cursor-not-allowed");
  }

  // --- Logika untuk Tombol Feedback ---
  const feedbackSection = document.getElementById("feedback-section");
  if (feedbackSection) {
    const btnCorrect = document.getElementById("feedback-correct");
    const btnIncorrect = document.getElementById("feedback-incorrect");
    const thanksMsg = document.getElementById("feedback-thanks");

    const setFeedbackSubmittedState = () => {
      btnCorrect.disabled = true;
      btnIncorrect.disabled = true;
      btnCorrect.classList.add("opacity-50", "cursor-not-allowed");
      btnIncorrect.classList.add("opacity-50", "cursor-not-allowed");
      thanksMsg.classList.remove("hidden");
    };

    const handleFeedback = (feedbackValue) => {
      fetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: RESULT_DATA.image,
          feedback: feedbackValue,
        }),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error("Gagal mengirim feedback ke server");
          return response.json();
        })
        .then((data) => {
          if (data.status === "success") {
            let feedbackHistory =
              JSON.parse(localStorage.getItem("feedbackHistory")) || {};
            feedbackHistory[RESULT_DATA.image] = feedbackValue;
            localStorage.setItem(
              "feedbackHistory",
              JSON.stringify(feedbackHistory)
            );
            setFeedbackSubmittedState();
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    };

    const checkInitialFeedbackState = () => {
      let feedbackHistory =
        JSON.parse(localStorage.getItem("feedbackHistory")) || {};
      if (feedbackHistory[RESULT_DATA.image]) {
        setFeedbackSubmittedState();
      }
    };

    btnCorrect.addEventListener("click", () => handleFeedback("correct"));
    btnIncorrect.addEventListener("click", () => handleFeedback("incorrect"));

    checkInitialFeedbackState();
  }

  // --- Fungsi Unduh Laporan sebagai PDF ---
  const downloadButton = document.getElementById("downloadButton");
  if (downloadButton) {
    downloadButton.addEventListener("click", function () {
      const { label, confidence, info, all_probs } = RESULT_DATA;
      const downloadButtonText = document.getElementById("downloadButtonText");
      downloadButtonText.innerText = "Membuat...";
      downloadButton.disabled = true;

      setTimeout(() => {
        try {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF("p", "mm", "a4");
          const primaryColor = "#166534";
          const textColor = "#334155";
          const lightTextColor = "#64748b";
          const margin = 15;
          const pageWidth = pdf.internal.pageSize.getWidth();
          const usableWidth = pageWidth - 2 * margin;
          let yPosition = 0;
          const colorMap = {
            green: "#16a34a",
            red: "#dc2626",
            orange: "#f97316",
            yellow: "#eab308",
            zinc: "#71717a",
          };
          const diagnosisColor = colorMap[info.color] || "#71717a";

          const addHeader = () => {
            pdf.setFillColor(primaryColor);
            pdf.rect(0, 0, pageWidth, 25, "F");
            pdf.setFontSize(16);
            pdf.setTextColor("#FFFFFF");
            pdf.setFont(undefined, "bold");
            pdf.text("Laporan Analisis GrapeCheck", margin, 16);
            yPosition = 35;
          };

          const addFooter = (pageNumber, pageCount) => {
            pdf.setFontSize(8);
            pdf.setTextColor(lightTextColor);
            pdf.setLineWidth(0.2);
            pdf.line(margin, 280, pageWidth - margin, 280);
            pdf.text(
              `Halaman ${pageNumber} dari ${pageCount}`,
              pageWidth - margin,
              285,
              { align: "right" }
            );
            pdf.text("© GrapeCheck", margin, 285);
          };

          const checkPageBreak = () => {
            if (yPosition > 260) {
              pdf.addPage();
              addHeader();
            }
          };

          const addSection = (title, content, options = {}) => {
            checkPageBreak();
            pdf.setFontSize(options.size || 12);
            pdf.setFont(undefined, options.style || "bold");
            pdf.setTextColor(options.color || primaryColor);
            pdf.text(title, margin, yPosition);
            yPosition += 6;
            if (content) {
              pdf.setFontSize(10);
              pdf.setFont(undefined, "normal");
              pdf.setTextColor(textColor);
              const lines = pdf.splitTextToSize(content, usableWidth);
              pdf.text(lines, margin, yPosition);
              yPosition += lines.length * 4 + 8;
            }
          };

          const addList = (title, list, isNumbered) => {
            if (!list || list.length === 0) return;
            addSection(title, null);
            pdf.setFontSize(10);
            pdf.setFont(undefined, "normal");
            pdf.setTextColor(textColor);
            list.forEach((item, index) => {
              checkPageBreak();
              const prefix = isNumbered ? `${index + 1}. ` : "• ";
              const lines = pdf.splitTextToSize(item, usableWidth - 5);
              pdf.text(prefix, margin, yPosition);
              pdf.text(lines, margin + 5, yPosition);
              yPosition += lines.length * 4 + 2;
            });
            yPosition += 6;
          };

          addHeader();

          pdf.setFontSize(9);
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(lightTextColor);
          pdf.text(formattedTimestamp, margin, yPosition);
          yPosition += 10;

          pdf.setFillColor(diagnosisColor);
          pdf.roundedRect(margin, yPosition, usableWidth, 12, 3, 3, "F");
          pdf.setFontSize(14);
          pdf.setFont(undefined, "bold");
          pdf.setTextColor("#FFFFFF");
          pdf.text(
            `DIAGNOSIS: ${label.toUpperCase()}`,
            margin + 5,
            yPosition + 8
          );
          yPosition += 18;

          pdf.setFontSize(10);
          pdf.setTextColor(textColor);
          pdf.text(
            `Tingkat Keyakinan: ${confidence.toFixed(2)}%`,
            margin,
            yPosition
          );
          yPosition += 10;

          addSection("Deskripsi", info.description);
          addList("Gejala Umum", info.symptoms, false);
          addList("Faktor Pemicu", info.triggers, false);
          addList("Rekomendasi Tindakan", info.action, true);

          if (label !== "Negative" && all_probs) {
            addList(
              "Distribusi Probabilitas",
              Object.entries(all_probs)
                .sort(([, a], [, b]) => b - a)
                .map(([disease, prob]) => `${disease}: ${prob.toFixed(2)}%`),
              false
            );
          }

          const pageCount = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            addFooter(i, pageCount);
          }

          const safeLabel = label.replace(/ /g, "_");
          const fileDate = new Date().toISOString().split("T")[0];
          const fileName = `Laporan_Analisis_${safeLabel}_${fileDate}.pdf`;
          pdf.save(fileName);
        } catch (error) {
          console.error("Gagal membuat PDF:", error);
          alert("Maaf, terjadi kesalahan saat membuat file PDF.");
        } finally {
          downloadButtonText.innerText = "Unduh PDF";
          downloadButton.disabled = false;
        }
      }, 50);
    });
  }
});