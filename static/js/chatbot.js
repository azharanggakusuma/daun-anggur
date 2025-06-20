document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const mainContentWrapper = document.getElementById('main-content-wrapper');
    const chatbotContainer = document.getElementById('chatbot-container');
    const fab = document.getElementById('chat-fab');
    const closeButton = document.getElementById('chat-close-button');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    if (!fab || !mainContentWrapper || !chatbotContainer) return;

    // --- State ---
    let isOpen = false;
    let welcomeTimeout;

    // --- Fungsi Tampilan (UI) ---
    const toggleChat = () => {
        isOpen = !isOpen;
        // Menambahkan kelas ke body untuk kontrol global (termasuk main content)
        document.body.classList.toggle('chat-is-open');

        clearTimeout(welcomeTimeout);

        if (isOpen) {
            input.focus();
            welcomeTimeout = setTimeout(() => {
                showTypingIndicator();
                setTimeout(() => {
                    hideTypingIndicator();
                    addBotMessage("Halo! Saya Asisten AI GrapeCheck. Siap membantu Anda memahami penyakit daun anggur.");
                }, 1200);
            }, 500);
        }
    };

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        messagesContainer.insertBefore(messageDiv, typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    const addBotMessage = (text) => addMessage(text, 'bot');
    const addUserMessage = (text) => addMessage(text, 'user');
    const showTypingIndicator = () => typingIndicator.classList.remove('hidden');
    const hideTypingIndicator = () => typingIndicator.classList.add('hidden');

    // --- Logika Inti Chatbot (Sama) ---
    const getResponse = (userInput) => {
        const text = userInput.toLowerCase().trim();
        if (!text) return null;
        if (text.includes('halo') || text.includes('hai')) return "Halo juga! Ada yang bisa saya bantu terkait penyakit daun anggur?";
        
        const keywords = { 'busuk': 'Busuk', 'esca': 'Esca', 'hawar': 'Hawar' };
        const topics = {
            'gejala': 'symptoms', 'penanganan': 'action', 'rekomendasi': 'action', 'cara mengatasi': 'action',
            'pemicu': 'triggers', 'penyebab': 'triggers', 'deskripsi': 'description', 'tentang': 'description', 'info': 'description',
        };
        
        let foundDisease = null;
        for (const key in keywords) { if (text.includes(key)) { foundDisease = keywords[key]; break; } }

        let foundTopic = 'description';
        for (const key in topics) { if (text.includes(key)) { foundTopic = topics[key]; break; } }

        if (foundDisease) {
            const diseaseData = CHATBOT_KNOWLEDGE[foundDisease];
            if (diseaseData && diseaseData[foundTopic]) {
                const info = diseaseData[foundTopic];
                if (Array.isArray(info)) return `Berikut adalah ${foundTopic} untuk penyakit ${foundDisease}:\n- ${info.join('\n- ')}`;
                return info;
            }
        }
        return "Maaf, saya belum mengerti. Coba tanyakan tentang 'gejala busuk', 'penanganan esca', atau 'penyebab hawar'.";
    };

    // --- Event Listeners ---
    fab.addEventListener('click', toggleChat);
    closeButton.addEventListener('click', toggleChat);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = input.value;
        if (!userInput.trim()) return;
        addUserMessage(userInput);
        input.value = '';
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const botResponse = getResponse(userInput);
            addBotMessage(botResponse);
        }, 1500);
    });
});