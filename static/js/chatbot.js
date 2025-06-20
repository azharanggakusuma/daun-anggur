document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const mainContentWrapper = document.getElementById('main-content-wrapper');
    const fab = document.getElementById('chat-fab');
    const closeButton = document.getElementById('chat-close-button');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    if (!fab || !mainContentWrapper) return;

    // --- STATE MANAGEMENT ---
    let isOpen = false;
    let conversationContext = null; // Untuk mengingat topik penyakit
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
                    addBotMessage("Halo! Saya Asisten AI GrapeCheck. Tanya saya tentang penyakit atau tips perawatan anggur.", ["Info Penyakit Busuk", "Tips Pemupukan"]);
                }, 1200);
            }, 500);
        } else {
            conversationContext = null; // Reset konteks saat chat ditutup
        }
    };
    
    // --- Fungsi Pesan & Quick Reply ---
    const addMessage = (text, sender, replies = []) => {
        // Hapus quick replies yang lama sebelum menambah pesan baru
        const oldReplies = messagesContainer.querySelector('.quick-replies-container');
        if (oldReplies) oldReplies.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        messagesContainer.insertBefore(messageDiv, typingIndicator);

        if (replies.length > 0) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'quick-replies-container';
            replies.forEach(replyText => {
                const button = document.createElement('button');
                button.className = 'quick-reply-button';
                button.textContent = replyText;
                repliesContainer.appendChild(button);
            });
            messagesContainer.insertBefore(repliesContainer, typingIndicator);
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const processAndRespond = (userInput) => {
        if (!userInput.trim()) return;
        addUserMessage(userInput);
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const response = getSmarterResponse(userInput);
            addBotMessage(response.text, response.replies);
        }, 1500);
    };

    const addBotMessage = (text, replies) => addMessage(text, 'bot', replies);
    const addUserMessage = (text) => addMessage(text, 'user');
    const showTypingIndicator = () => typingIndicator.classList.remove('hidden');
    const hideTypingIndicator = () => typingIndicator.classList.add('hidden');

    // --- LOGIKA CHATBOT PINTAR (v4) ---
    const getSmarterResponse = (userInput) => {
        const text = userInput.toLowerCase().trim();
        let response = { text: "Maaf, saya belum mengerti. Coba tanyakan hal lain tentang penyakit atau perawatan anggur.", replies: ["Daftar Penyakit", "Tips Perawatan"] };
        
        // Kata Kunci & Topik
        const diseases = { 'busuk': 'Busuk', 'esca': 'Esca', 'hawar': 'Hawar' };
        const topics = { 'gejala': 'symptoms', 'penanganan': 'action', 'rekomendasi': 'action', 'mengatasi': 'action', 'pemicu': 'triggers', 'penyebab': 'triggers', 'deskripsi': 'description', 'info': 'description' };
        
        let foundDisease = Object.keys(diseases).find(d => text.includes(d));
        let foundTopic = Object.keys(topics).find(t => text.includes(t));
        
        // 1. Menangani pertanyaan tentang Penyakit
        if (foundDisease) {
            const diseaseName = diseases[foundDisease];
            conversationContext = diseaseName; // SET KONTEKS
            const topicKey = foundTopic ? topics[foundTopic] : 'description';
            const diseaseData = CHATBOT_DISEASE_KNOWLEDGE[diseaseName][topicKey];
            
            response.text = Array.isArray(diseaseData) ? `Berikut ${foundTopic || 'info'} untuk ${diseaseName}:\n- ${diseaseData.join('\n- ')}` : diseaseData;
            response.replies = [`Gejala ${diseaseName}`, `Penanganan ${diseaseName}`, `Penyebab ${diseaseName}`];
            return response;
        }

        // 2. Menangani pertanyaan KONTEKSTUAL (jika tidak ada nama penyakit di input)
        if (foundTopic && conversationContext) {
            const topicKey = topics[foundTopic];
            const diseaseData = CHATBOT_DISEASE_KNOWLEDGE[conversationContext][topicKey];
            response.text = Array.isArray(diseaseData) ? `Tentu, ini ${foundTopic} untuk ${conversationContext}:\n- ${diseaseData.join('\n- ')}` : diseaseData;
            response.replies = [`Gejala ${conversationContext}`, `Penanganan ${conversationContext}`];
            return response;
        }

        // 3. Menangani pertanyaan tentang Tips Perawatan
        const foundTip = CHATBOT_TIPS_KNOWLEDGE.find(tip => tip.keywords.some(k => text.includes(k)));
        if (foundTip) {
            response.text = `Berikut tips tentang ${foundTip.title}:\n${foundTip.summary}`;
            response.replies = ["Tips Pemupukan", "Tips Penyiraman", "Info Penyakit"];
            return response;
        }

        // 4. Perintah Umum
        if (text.includes('daftar penyakit')) {
            response.text = "Tentu, saya bisa memberi info tentang: Busuk, Esca, dan Hawar. Penyakit mana yang ingin Anda ketahui?";
            response.replies = ["Info Busuk", "Info Esca", "Info Hawar"];
            return response;
        }
        if (text.includes('tips perawatan')) {
            response.text = "Saya punya beberapa tips perawatan umum: Pencegahan Jamur, Pemupukan, Penyiraman, dan Sanitasi Kebun. Mau tahu yang mana?";
            response.replies = ["Tips Jamur", "Tips Pupuk", "Tips Siram"];
            return response;
        }

        return response; // Return default response
    };

    // --- Event Listeners ---
    fab.addEventListener('click', toggleChat);
    closeButton.addEventListener('click', toggleChat);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        processAndRespond(input.value);
        input.value = '';
    });

    messagesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply-button')) {
            processAndRespond(e.target.textContent);
        }
    });
});