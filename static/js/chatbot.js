document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const fab = document.getElementById('chat-fab');
    const widget = document.getElementById('chat-widget');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    if (!fab) return;

    // --- State ---
    let isOpen = false;

    // --- Fungsi Bantuan ---
    const toggleChat = () => {
        isOpen = !isOpen;
        widget.classList.toggle('open');
        fab.classList.toggle('open');
        if (isOpen) {
            input.focus();
            addBotMessage("Halo! Saya Asisten AI GrapeCheck. Apa yang ingin Anda ketahui tentang penyakit daun anggur? Coba tanyakan 'gejala busuk' atau 'penanganan esca'.");
        }
    };

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    const addBotMessage = (text) => {
        addMessage(text, 'bot');
    };

    const addUserMessage = (text) => {
        addMessage(text, 'user');
    };

    // --- Logika Inti Chatbot ---
    const getResponse = (userInput) => {
        const text = userInput.toLowerCase().trim();
        
        if (!text) return null;

        if (text.includes('halo') || text.includes('hai')) {
            return "Halo juga! Ada yang bisa saya bantu terkait penyakit daun anggur?";
        }

        const keywords = {
            'busuk': 'Busuk',
            'esca': 'Esca',
            'hawar': 'Hawar',
        };

        const topics = {
            'gejala': 'symptoms',
            'penanganan': 'action',
            'rekomendasi': 'action',
            'cara mengatasi': 'action',
            'pemicu': 'triggers',
            'penyebab': 'triggers',
            'deskripsi': 'description',
            'tentang': 'description',
            'info': 'description',
        };
        
        let foundDisease = null;
        for (const key in keywords) {
            if (text.includes(key)) {
                foundDisease = keywords[key];
                break;
            }
        }

        let foundTopic = 'description'; // Default topic
        for (const key in topics) {
            if (text.includes(key)) {
                foundTopic = topics[key];
                break;
            }
        }

        if (foundDisease) {
            const diseaseData = CHATBOT_KNOWLEDGE[foundDisease];
            if (diseaseData && diseaseData[foundTopic]) {
                const info = diseaseData[foundTopic];
                if (Array.isArray(info)) {
                    return `Berikut adalah ${foundTopic} untuk penyakit ${foundDisease}:\n- ${info.join('\n- ')}`;
                }
                return info;
            }
        }

        return "Maaf, saya belum mengerti pertanyaan itu. Anda bisa bertanya tentang 'gejala', 'penanganan', atau 'pemicu' untuk penyakit Busuk, Esca, atau Hawar.";
    };

    // --- Event Listeners ---
    fab.addEventListener('click', toggleChat);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = input.value;
        if (!userInput.trim()) return;

        addUserMessage(userInput);
        input.value = '';

        setTimeout(() => {
            const botResponse = getResponse(userInput);
            addBotMessage(botResponse);
        }, 500);
    });
});