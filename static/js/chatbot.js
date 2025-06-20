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
                        addBotMessage(welcomeText, ["Info Penyakit Busuk", "Tips Pemupukan"]);
                        conversationHistory.push({ role: 'model', parts: [{ text: welcomeText }] });
                    }, 1200);
                }, 500);
            }
        }
    };

    // +++ PENAMBAHAN BARU: Fungsi untuk menangani Markdown +++
    const renderMarkdown = (text) => {
        // 1. Ubah **teks tebal** menjadi <strong>
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 2. Proses item daftar yang diawali dengan '-' atau '*'
        const lines = html.split('\n');
        let inList = false;
        const processedLines = lines.map(line => {
            const trimmedLine = line.trim();
            // Cek apakah baris ini adalah item daftar
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                const listItemContent = trimmedLine.substring(2); // Ambil teks setelah '- '
                const listItem = `<li>${listItemContent}</li>`;
                // Jika kita belum berada di dalam <ul>, mulai satu
                if (!inList) {
                    inList = true;
                    return `<ul>${listItem}`;
                }
                return listItem;
            } else {
                // Jika baris ini bukan item daftar dan kita sebelumnya di dalam <ul>, tutup <ul>
                if (inList) {
                    inList = false;
                    return `</ul>${line}`; // Kembalikan tag penutup dan baris saat ini
                }
                return line; // Kembalikan baris seperti biasa
            }
        });

        // Gabungkan kembali semua baris yang telah diproses
        html = processedLines.join('\n');
        
        // 3. Jika pesan diakhiri dengan daftar, pastikan tag <ul> ditutup
        if (inList) {
            html += '</ul>';
        }

        // 4. Ganti sisa baris baru dengan <br> untuk paragraf
        return html.replace(/\n/g, '<br>');
    };


    // --- Fungsi Pesan & Quick Reply (Dengan Modifikasi Kecil) ---
    const addMessage = (text, sender, replies = []) => {
        const oldReplies = messagesContainer.querySelector('.quick-replies-container');
        if (oldReplies) oldReplies.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        // +++ MODIFIKASI DI SINI +++
        if (sender === 'bot') {
            // Gunakan renderMarkdown untuk pesan dari bot agar formatnya rapi
            messageDiv.innerHTML = renderMarkdown(text);
        } else {
            // Untuk pesan dari pengguna, gunakan textContent agar lebih aman
            messageDiv.textContent = text;
        }
        // +++ AKHIR MODIFIKASI +++

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

    // --- FUNGSI STATIS DENGAN DATA YANG DIPERKAYA ---
    const getStaticResponse = (userInput) => {
        const text = userInput.toLowerCase().trim();
        let response = { text: "Maaf, saya belum mengerti. Coba tanyakan hal lain tentang penyakit atau perawatan anggur.", replies: ["Daftar Penyakit", "Tips Perawatan"] };

        // Definisikan pengetahuan statis dengan keyword yang lebih kaya
        const staticKnowledge = {
            diseases: { 'busuk': 'Busuk', 'esca': 'Esca', 'hawar': 'Hawar' },
            topics: {
                'gejala': 'symptoms', 'ciri-ciri': 'symptoms', 'tandanya': 'symptoms', 'seperti apa': 'symptoms',
                'penanganan': 'action', 'rekomendasi': 'action', 'mengatasi': 'action', 'solusi': 'action', 'obatnya': 'action', 'caranya': 'action',
                'pemicu': 'triggers', 'penyebab': 'triggers', 'kenapa bisa': 'triggers', 'asalnya': 'triggers',
                'deskripsi': 'description', 'info': 'description', 'tentang': 'description', 'adalah': 'description', 'apa itu': 'description'
            },
            meta: {
                creator: {
                    keywords: ['pembuat', 'buat kamu', 'developer', 'pencipta', 'dibuat oleh', 'siapa yang buat', 'azharangga kusuma', 'azhar'],
                    text: "Saya adalah Asisten AI GrapeCheck. Saya dikembangkan oleh **Azharangga Kusuma** untuk membantu para petani dan penghobi anggur seperti Anda.",
                    replies: ["Kamu bisa apa saja?", "Info Penyakit"]
                },
                thanks: {
                    keywords: ['terima kasih', 'makasih', 'thanks', 'terimakasih'],
                    text: "Sama-sama! Senang jika saya bisa membantu. Apakah ada hal lain yang ingin Anda tanyakan?",
                    replies: ["Daftar Penyakit", "Tips Perawatan"]
                },
                capability: {
                    keywords: ['bisa apa', 'kemampuanmu', 'fiturmu', 'apa yang bisa kamu lakukan'],
                    text: "Tentu! Saya bisa membantu Anda dengan beberapa hal:\n- Memberikan informasi detail tentang penyakit (gejala, penyebab, penanganan).\n- Menawarkan tips umum perawatan tanaman anggur.",
                    replies: ["Info Penyakit Busuk", "Tips Pemupukan", "Penyebab Esca"]
                },
                reset: {
                    keywords: ['kembali', 'bukan ini', 'menu utama', 'batal'],
                    text: "Baik, ada lagi yang bisa saya bantu?",
                    replies: ["Daftar Penyakit", "Tips Perawatan"]
                },
                listDiseases: {
                    keywords: ['daftar penyakit', 'semua penyakit'],
                    text: "Tentu, saya bisa memberi info tentang: **Busuk**, **Esca**, dan **Hawar**. Penyakit mana yang ingin Anda ketahui lebih dulu?",
                    replies: ["Info Busuk", "Info Esca", "Info Hawar"]
                },
                listTips: {
                    keywords: ['tips perawatan', 'semua tips'],
                    text: "Saya punya beberapa tips perawatan umum: **Pencegahan Jamur**, **Pemupukan**, **Penyiraman**, dan **Sanitasi Kebun**. Mau tahu yang mana?",
                    replies: ["Pencegahan Jamur", "Pemupukan", "Penyiraman"]
                }
            }
        };

        // 1. Cek Pertanyaan Meta (tentang bot, sapaan, dll)
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