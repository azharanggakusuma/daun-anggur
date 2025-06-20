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

    // --- MANAJEMEN STATE & MEMORI CHATBOT ---
    let isOpen = false;
    let conversationContext = null;
    let welcomeTimeout;
    let conversationHistory = [];

    // --- Fungsi Tampilan (UI) ---
    const toggleChat = () => {
        isOpen = !isOpen;
        document.body.classList.toggle('chat-is-open');

        clearTimeout(welcomeTimeout);
        if (isOpen) {
            input.focus();
            if (messagesContainer.querySelectorAll('.message').length === 0) {
                welcomeTimeout = setTimeout(() => {
                    showTypingIndicator();
                    setTimeout(() => {
                        hideTypingIndicator();
                        const welcomeText = "Halo! Saya Asisten AI GrapeCheck. Tanya saya tentang penyakit atau tips perawatan anggur.";
                        addBotMessage(welcomeText, ["Cara pakai aplikasi", "Info Penyakit Busuk"]);
                        conversationHistory.push({ role: 'model', parts: [{ text: welcomeText }] });
                    }, 1200);
                }, 500);
            }
        }
    };

    const renderMarkdown = (text) => {
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const lines = html.split('\n');
        let inList = false;
        const processedLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                const listItemContent = trimmedLine.substring(2);
                const listItem = `<li>${listItemContent}</li>`;
                if (!inList) {
                    inList = true;
                    return `<ul>${listItem}`;
                }
                return listItem;
            } else {
                if (inList) {
                    inList = false;
                    return `</ul>${line}`;
                }
                return line;
            }
        });
        html = processedLines.join('\n');
        if (inList) {
            html += '</ul>';
        }
        return html.replace(/\n/g, '<br>');
    };

    const addMessage = (text, sender, replies = []) => {
        const oldReplies = messagesContainer.querySelector('.quick-replies-container');
        if (oldReplies) oldReplies.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        if (sender === 'bot') {
            messageDiv.innerHTML = renderMarkdown(text);
        } else {
            messageDiv.textContent = text;
        }

        messagesContainer.insertBefore(messageDiv, typingIndicator);

        if (replies.length > 0 && sender === 'bot') {
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

    const processAndRespond = async (userInput) => {
        if (!userInput.trim()) return;

        addUserMessage(userInput);
        showTypingIndicator();

        try {
            const staticResponse = getStaticResponse(userInput);

            if (staticResponse.text.startsWith("Maaf, saya belum mengerti")) {
                const geminiResponse = await getGeminiResponse(userInput);
                addBotMessage(geminiResponse, []);
                conversationHistory.push({ role: 'model', parts: [{ text: geminiResponse }] });
            } else {
                await new Promise(resolve => setTimeout(resolve, 1200));
                addBotMessage(staticResponse.text, staticResponse.replies);
                conversationHistory.push({ role: 'model', parts: [{ text: staticResponse.text }] });
            }
        } catch (error) {
            console.error("Error processing response:", error);
            addBotMessage("Maaf, terjadi sedikit gangguan. Coba beberapa saat lagi ya.", []);
        } finally {
            hideTypingIndicator();
        }
    };

    const addBotMessage = (text, replies) => addMessage(text, 'bot', replies);

    const addUserMessage = (text) => {
        addMessage(text, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: text }] });
    };

    const showTypingIndicator = () => typingIndicator.classList.remove('hidden');
    const hideTypingIndicator = () => typingIndicator.classList.add('hidden');

    const getGeminiResponse = async (userInput) => {
        try {
            const response = await fetch('/chat_ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    history: conversationHistory.slice(0, -1)
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Gagal mendapat respons dari AI.");
            }
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Gemini Fetch Error:', error);
            return "Waduh, sepertinya saya sedang kesulitan terhubung dengan pusat data. Silakan coba lagi nanti.";
        }
    };

    // --- FUNGSI STATIS DENGAN PENGETAHUAN YANG DIPERKAYA ---
    const getStaticResponse = (userInput) => {
        const text = userInput.toLowerCase().trim();
        let response = { text: "Maaf, saya belum mengerti. Saya akan coba tanyakan ke AI yang lebih pintar. Mohon tunggu...", replies: [] };

        // +++ PERUBAHAN UTAMA DI SINI: Pengetahuan Statis yang Diperkaya +++
        const staticKnowledge = {
            diseases: { 'busuk': 'Busuk', 'esca': 'Esca', 'hawar': 'Hawar' },
            topics: {
                'gejala': 'symptoms', 'ciri-ciri': 'symptoms', 'tandanya': 'symptoms',
                'penanganan': 'action', 'rekomendasi': 'action', 'mengatasi': 'action', 'solusi': 'action', 'obatnya': 'action',
                'pemicu': 'triggers', 'penyebab': 'triggers', 'kenapa bisa': 'triggers',
                'deskripsi': 'description', 'info': 'description', 'tentang': 'description', 'apa itu': 'description'
            },
            // Pengetahuan tentang aplikasi itu sendiri
            meta: {
                creator: {
                    keywords: ['pembuat', 'developer', 'pencipta', 'dibuat oleh', 'azharangga kusuma', 'azhar'],
                    text: "Saya adalah Asisten AI GrapeCheck. Saya dikembangkan oleh **Azharangga Kusuma**.",
                    replies: ["Kemampuan aplikasi", "Info Penyakit"]
                },
                thanks: {
                    keywords: ['terima kasih', 'makasih', 'thanks'],
                    text: "Sama-sama! Senang bisa membantu.",
                    replies: ["Daftar Penyakit", "Tips Perawatan"]
                },
                app_capability: {
                    keywords: ['kemampuan aplikasi', 'bisa apa', 'fitur'],
                    text: "Aplikasi **GrapeCheck** memiliki beberapa kemampuan utama:\n- **Deteksi Penyakit**: Unggah gambar daun anggur untuk dianalisis.\n- **Panduan Lengkap**: Lihat informasi detail penyakit dan tips di halaman Panduan.\n- **Riwayat Analisis**: Semua hasil cek Anda tersimpan di halaman Riwayat.",
                    replies: ["Cara deteksi penyakit", "Lihat halaman Riwayat", "Buka Panduan"]
                },
                how_to_use: {
                    keywords: ['cara pakai', 'cara menggunakan', 'cara deteksi penyakit', 'cara analisis', 'upload gambar'],
                    text: "Caranya sangat mudah!\n1. Di **Halaman Utama**, klik tombol 'Pilih Gambar'.\n2. Pilih foto daun anggur dari galeri Anda.\n3. Aplikasi akan langsung menganalisis dan memberikan hasilnya!",
                    replies: ["Halaman Riwayat", "Daftar Penyakit"]
                },
                history_page: {
                    keywords: ['halaman riwayat', 'lihat riwayat', 'histori'],
                    text: "Halaman **Riwayat** berguna untuk melihat kembali semua hasil analisis yang pernah Anda lakukan. Ini membantu Anda memantau kesehatan tanaman anggur dari waktu ke waktu.",
                    replies: ["Cara deteksi penyakit", "Buka Panduan"]
                },
                guidance_page: {
                    keywords: ['halaman panduan', 'buka panduan', 'semua info'],
                    text: "Di halaman **Panduan**, Anda bisa menemukan semua informasi tentang penyakit dan tips perawatan yang disusun rapi seperti buku saku digital.",
                    replies: ["Daftar Penyakit", "Daftar Tips"]
                },
                listDiseases: {
                    keywords: ['daftar penyakit', 'semua penyakit'],
                    text: "Saya punya data untuk penyakit berikut:\n- **Busuk** (Black Rot)\n- **Esca** (Black Measles)\n- **Hawar** (Leaf Blight)\nPenyakit mana yang ingin Anda ketahui?",
                    replies: ["Info Busuk", "Info Esca", "Info Hawar"]
                },
                listTips: {
                    keywords: ['tips perawatan', 'daftar tips'],
                    text: "Tentu, ini beberapa tips umum yang tersedia:\n- Pencegahan Jamur\n- Pemupukan\n- Penyiraman\n- Sanitasi Kebun\nMau dibacakan yang mana?",
                    replies: ["Tips Pemupukan", "Tips Penyiraman", "Tips Sanitasi"]
                },
                 reset: {
                    keywords: ['kembali', 'menu utama', 'batal'],
                    text: "Baik, kita mulai dari awal. Ada yang bisa saya bantu?",
                    replies: ["Kemampuan aplikasi", "Daftar Penyakit"]
                },
            }
        };

        // 1. Cek Pertanyaan Meta (tentang aplikasi, sapaan, dll)
        for (const key in staticKnowledge.meta) {
            if (staticKnowledge.meta[key].keywords.some(k => text.includes(k))) {
                if(key === 'reset') conversationContext = null;
                return staticKnowledge.meta[key];
            }
        }

        // 2. Cek Pertanyaan Spesifik tentang Penyakit & Topik
        let foundDiseaseName = Object.keys(staticKnowledge.diseases).find(d => text.includes(d)) || null;
        if (foundDiseaseName) foundDiseaseName = staticKnowledge.diseases[foundDiseaseName];
        
        let foundTopicKey = Object.keys(staticKnowledge.topics).find(t => text.includes(t)) || null;
        if (foundTopicKey) foundTopicKey = staticKnowledge.topics[foundTopicKey];

        if (foundDiseaseName) {
            conversationContext = foundDiseaseName;
            const topicToGet = foundTopicKey || 'description';
            const diseaseData = CHATBOT_DISEASE_KNOWLEDGE[foundDiseaseName][topicToGet];
            const topicName = Object.keys(staticKnowledge.topics).find(key => staticKnowledge.topics[key] === topicToGet) || "info";
            response.text = `Tentu, ini ${topicName} untuk penyakit **${foundDiseaseName}**:\n${Array.isArray(diseaseData) ? `- ${diseaseData.join('\n- ')}` : diseaseData}`;
            response.replies = [`Gejala ${foundDiseaseName}`, `Penanganan ${foundDiseaseName}`, `Penyebab ${foundDiseaseName}`];
            return response;
        }

        if (foundTopicKey && conversationContext) {
            const diseaseData = CHATBOT_DISEASE_KNOWLEDGE[conversationContext][foundTopicKey];
            const topicName = Object.keys(staticKnowledge.topics).find(key => staticKnowledge.topics[key] === foundTopicKey) || "info";
            response.text = `Berikut ${topicName} untuk penyakit **${conversationContext}** yang tadi kita bahas:\n${Array.isArray(diseaseData) ? `- ${diseaseData.join('\n- ')}` : diseaseData}`;
            response.replies = [`Gejala ${conversationContext}`, `Penanganan ${conversationContext}`, `Kembali`];
            return response;
        }

        // 3. Cek Pertanyaan tentang Tips
        const foundTip = CHATBOT_TIPS_KNOWLEDGE.find(tip => tip.keywords.some(k => text.includes(k)) || text.includes(tip.title.toLowerCase()));
        if (foundTip) {
            response.text = `Ini tips terkait "**${foundTip.title}**":\n${foundTip.summary}`;
            response.replies = ["Tips Pemupukan", "Tips Penyiraman", "Pencegahan Jamur"];
            return response;
        }

        // Jika tidak ada yang cocok, kembalikan response default untuk memicu AI
        // Modifikasi pesan agar lebih jelas
        response.text = "Maaf, saya belum mengerti. Saya akan coba tanyakan ke AI yang lebih pintar untuk pertanyaan ini.";
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

    messagesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply-button')) {
            processAndRespond(e.target.textContent);
        }
    });
});