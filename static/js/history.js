document.addEventListener("DOMContentLoaded", function () {
  const historyContainer = document.getElementById("history-container");
  const emptyHistoryMessage = document.getElementById("empty-history");
  const history = JSON.parse(localStorage.getItem("analysisHistory")) || [];

  if (!historyContainer || !emptyHistoryMessage) return;

  if (history.length === 0) {
    emptyHistoryMessage.classList.remove("hidden");
  } else {
    emptyHistoryMessage.classList.add("hidden");
    const fragment = document.createDocumentFragment();
    history.forEach((item) => {
      const date = new Date(item.timestamp);
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        date
      );
      const formattedTime = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const card = document.createElement("a");
      card.href = `/hasil/${item.filename}`;
      card.className =
        "block p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors duration-200 animate-slide-in-up";
      card.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold text-lg">${item.label}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Keyakinan: ${item.confidence}%</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-semibold">${formattedDate}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">pukul ${formattedTime}</p>
                    </div>
                </div>
            `;
      fragment.appendChild(card);
    });
    historyContainer.appendChild(fragment);
  }
});
