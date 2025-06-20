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
            // Hanya tampilkan pesan selamat datang jika belum ada pesan
            if (messagesContainer.querySelectorAll('.message').length === 0) {
                welcomeTimeout = setTimeout(() => {
                    showTypingIndicator();
                    setTimeout(() => {
                        hideTypingIndicator();
                        addBotMessage("Halo! Saya Asisten AI GrapeCheck. Tanya saya tentang penyakit atau tips perawatan anggur.", ["Info Penyakit Busuk", "Tips Pemupukan"]);
                    }, 1200);
                }, 500);
            }
        } else {
            // Konteks tidak di-reset agar percakapan bisa dilanjutkan nanti
            // conversationContext = null; 
        }
    };
    
    // --- Fungsi Pesan & Quick Reply (diperbarui) ---
    const addMessage = (text, sender, replies = []) => {
        // Hapus quick replies yang lama sebelum menambah pesan baru
        const oldReplies = messagesContainer.querySelector('.quick-replies-container');
        if (oldReplies) oldReplies.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        // Sisipkan pesan sebelum indikator ketik
        messagesContainer.insertBefore(messageDiv, typingIndicator);

        // Jika ada quick replies, buat tombolnya
        if (replies.length > 0 && sender === 'bot') {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'quick-replies-container';
            replies.forEach(replyText => {
                const button = document.createElement('button');
                button.className = 'quick-reply-button';
                button.textContent = replyText;
                repliesContainer.appendChild(button);
            });
            // Sisipkan kontainer tombol setelah pesan bot
            messagesContainer.insertBefore(repliesContainer, typingIndicator);
        }
        // Scroll ke bawah
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

    // --- LOGIKA CHATBOT PINTAR (v5 - Dengan Persona) ---
    const getSmarterResponse = (userInput) => {
        const text = userInput.toLowerCase().trim();
        let response = { text: "Maaf, saya belum mengerti. Coba tanyakan hal lain tentang penyakit atau perawatan anggur.", replies: ["Daftar Penyakit", "Tips Perawatan"] };
        
        // --- PENAMBAHAN BARU: Logika Persona & Interaksi Sosial ---
        // 1. Mengenali pertanyaan tentang pencipta/developer
        const creatorKeywords = ['pembuat', 'buat kamu', 'developer', 'pencipta', 'dibuat oleh'];
        if (creatorKeywords.some(keyword => text.includes(keyword))) {
            response.text = "Saya adalah aplikasi GrapeCheck, sebuah asisten cerdas yang dikembangkan oleh Azharngga Kusuma untuk membantu para petani dan penghobi anggur.";
            response.replies = ["Kamu bisa apa saja?", "Info Penyakit"];
            return response;
        }

        // 2. Merespons ucapan terima kasih
        const thanksKeywords = ['terima kasih', 'makasih', 'thanks', 'terimakasih'];
        if (thanksKeywords.some(keyword => text.includes(keyword))) {
            response.text = "Sama-sama! Senang jika saya bisa membantu. Apakah ada hal lain yang ingin Anda tanyakan?";
            response.replies = ["Daftar Penyakit", "Tips Perawatan"];
            return response;
        }

        // 3. Menjelaskan kemampuan diri sendiri
        const capabilityKeywords = ['bisa apa', 'kemampuanmu', 'fiturmu', 'apa yang bisa kamu lakukan'];
        if (capabilityKeywords.some(keyword => text.includes(keyword))) {
            response.text = "Tentu! Saya bisa membantu Anda dengan beberapa hal:\n- Mengidentifikasi penyakit dari deskripsi gejala.\n- Memberikan informasi detail tentang penyakit (gejala, penyebab, penanganan).\n- Menawarkan tips umum perawatan tanaman anggur.";
            response.replies = ["Info Penyakit Busuk", "Tips Pemupukan", "Penyebab Esca"];
            return response;
        }
        // --- AKHIR PENAMBAHAN ---

        // Kata Kunci & Topik
        const diseases = { 'busuk': 'Busuk', 'esca': 'Esca', 'hawar': 'Hawar' };
        const topics = { 'gejala': 'symptoms', 'penanganan': 'action', 'rekomendasi': 'action', 'mengatasi': 'action', 'pemicu': 'triggers', 'penyebab': 'triggers', 'deskripsi': 'description', 'info': 'description' };
        
        // Logika untuk menebak penyakit dari gejala
        const symptomKeywords = {
            'Busuk': ['keputihan', 'kuning', 'coklat kemerahan', 'tepi hitam', 'titik-titik hitam'],
            'Esca': ['garis harimau', 'tiger stripes', 'layu tiba-tiba'],
            'Hawar': ['kebasahan', 'water-soaked', 'nekrotik', 'retakan', 'kanker']
        };

        for (const diseaseName in symptomKeywords) {
            const keywords = symptomKeywords[diseaseName];
            if (keywords.some(keyword => text.includes(keyword))) {
                conversationContext = diseaseName; 
                response.text = `Gejala yang Anda sebutkan mirip dengan penyakit ${diseaseName}. Apakah Anda ingin informasi lebih lanjut tentang penyakit ini?`;
                response.replies = [`Info ${diseaseName}`, `Penanganan ${diseaseName}`, `Bukan ini`];
                return response;
            }
        }
        
        let foundDisease = Object.keys(diseases).find(d => text.includes(d));
        let foundTopic = Object.keys(topics).find(t => text.includes(t));
        
        // ... (sisa logika untuk menangani penyakit dan tips tetap sama persis) ...
        if (foundDisease) {
            const diseaseName = diseases[foundDisease];
            conversationContext = diseaseName; // SET KONTEKS
            const topicKey = foundTopic ? topics[foundTopic] : 'description';
            const diseaseData = CHATBOT_DISEASE_KNOWLEDGE[diseaseName][topicKey];
            
            response.text = Array.isArray(diseaseData) ? `Berikut ${foundTopic || 'info'} untuk ${diseaseName}:\n- ${diseaseData.join('\n- ')}` : diseaseData;
            response.replies = [`Gejala ${diseaseName}`, `Penanganan ${diseaseName}`, `Penyebab ${diseaseName}`];
            return response;
        }

        if (foundTopic && conversationContext) {
            const topicKey = topics[foundTopic];
            const diseaseData = CHATBOT_DISEASE_KNOWLEDGE[conversationContext][topicKey];
            response.text = Array.isArray(diseaseData) ? `Tentu, ini ${foundTopic} untuk ${conversationContext}:\n- ${diseaseData.join('\n- ')}` : diseaseData;
            response.replies = [`Gejala ${conversationContext}`, `Penanganan ${conversationContext}`, `Kembali`];
            return response;
        }

        const foundTip = CHATBOT_TIPS_KNOWLEDGE.find(tip => tip.keywords.some(k => text.includes(k) || tip.title.toLowerCase().includes(text)));
        if (foundTip) {
            response.text = `Berikut tips tentang ${foundTip.title}:\n${foundTip.summary}`;
            response.replies = ["Tips Pemupukan", "Tips Penyiraman", "Info Penyakit"];
            return response;
        }

        if (text.includes('daftar penyakit') || text.includes('info penyakit')) {
            response.text = "Tentu, saya bisa memberi info tentang: Busuk, Esca, dan Hawar. Penyakit mana yang ingin Anda ketahui?";
            response.replies = ["Info Busuk", "Info Esca", "Info Hawar"];
            return response;
        }
        if (text.includes('tips') && text.includes('perawatan')) {
            response.text = "Saya punya beberapa tips perawatan umum: Pencegahan Jamur, Pemupukan, Penyiraman, dan Sanitasi Kebun. Mau tahu yang mana?";
            response.replies = ["Pencegahan Jamur", "Pemupukan", "Penyiraman"];
            return response;
        }
        if (text.includes('kembali') || text.includes('bukan ini')) {
            conversationContext = null;
            response.text = "Baik, ada lagi yang bisa saya bantu?";
            response.replies = ["Daftar Penyakit", "Tips Perawatan"];
            return response;
        }

        return response; 
    };

    // --- Event Listeners ---
    fab.addEventListener('click', toggleChat);
    closeButton.addEventListener('click', toggleChat);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        processAndRespond(input.value);
        input.value = '';
    });

    // Event listener untuk tombol quick reply (diperbarui)
    messagesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply-button')) {
            processAndRespond(e.target.textContent);
        }
    });
});