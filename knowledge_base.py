# -*- coding: utf-8 -*-

"""
Basis Pengetahuan untuk Aplikasi GrapeCheck.
File ini berisi semua data statis yang digunakan oleh aplikasi,
termasuk informasi detail penyakit dan tips perawatan untuk chatbot.
"""

# Data Detail Penyakit Anggur
disease_info = {
    'Sehat': {
        'description': 'Daun tidak menunjukkan tanda-tanda visual penyakit atau kekurangan nutrisi. Ini menandakan kesehatan tanaman yang baik dan praktik perawatan yang efektif.',
        'symptoms': ['Warna daun hijau merata dan cerah.', 'Tidak ada bercak, lubang, atau perubahan warna.', 'Bentuk dan ukuran daun normal.'],
        'triggers': ['Nutrisi seimbang.', 'Penyiraman konsisten.', 'Sirkulasi udara memadai.'],
        'action': ['Pertahankan praktik perawatan yang sudah baik.', 'Lanjutkan pemantauan rutin untuk deteksi dini.', 'Lakukan pemupukan lanjutan sesuai fase pertumbuhan.'],
        'color': 'green', 'risk_level': 'Aman', 'risk_color': 'green'
    },
    'Busuk': {
        'description': 'Juga dikenal sebagai "Black Rot", penyakit ini disebabkan oleh jamur Guignardia bidwellii dan dapat merusak daun, batang, hingga buah anggur.',
        'symptoms': ['Bercak kecil keputihan/kuning pada daun.', 'Bercak membesar menjadi coklat kemerahan dengan tepi hitam.', 'Titik-titik hitam kecil (piknidia) muncul di tengah bercak.'],
        'triggers': ['Cuaca hangat dan lembab.', 'Kelembapan pada daun > 6 jam.', 'Sisa tanaman terinfeksi dari musim lalu.'],
        'action': ['Segera musnahkan semua bagian tanaman yang terinfeksi.', 'Aplikasikan fungisida yang efektif untuk Black Rot.', 'Lakukan pemangkasan untuk meningkatkan sirkulasi udara.'],
        'color': 'red', 'risk_level': 'Tinggi', 'risk_color': 'red'
    },
    'Esca': {
        'description': 'Penyakit kayu kompleks yang disebabkan oleh beberapa jenis jamur patogen. Penyakit ini menyerang sistem vaskular tanaman dan seringkali kronis.',
        'symptoms': ['Corak "garis harimau" (tiger stripes) pada daun.', 'Daun terlihat layu tiba-tiba di siang hari.', 'Dalam kasus akut, seluruh tanaman bisa mati cepat.'],
        'triggers': ['Luka pemangkasan yang besar dan tidak terlindungi.', 'Tanaman anggur yang sudah tua dan rentan stres.', 'Kondisi cuaca ekstrem (kekeringan & hujan lebat).'],
        'action': ['Pangkas bagian kayu yang terinfeksi jauh di bawah area bergejala.', 'Gunakan cat pelindung luka pangkas.', 'Fokus utama pada pencegahan dan sanitasi.'],
        'color': 'orange', 'risk_level': 'Sangat Tinggi', 'risk_color': 'red'
    },
    'Hawar': {
        'description': 'Disebabkan oleh bakteri Xanthomonas ampelina. Penyakit ini dapat menyebabkan kerusakan signifikan pada daun dan pucuk muda tanaman anggur.',
        'symptoms': ['Bercak kecil kebasahan (water-soaked) pada daun.', 'Bercak membesar dan nekrotik (jaringan mati).', 'Pucuk mengalami retakan dan kanker berwarna hitam.'],
        'triggers': ['Kelembapan tinggi dan suhu sejuk.', 'Percikan air hujan atau irigasi sprinkler.', 'Sirkulasi udara yang buruk di antara tajuk.'],
        'action': ['Gunakan semprotan bakterisida berbasis tembaga.', 'Hindari irigasi dari atas yang membasahi daun.', 'Pangkas bagian yang terinfeksi saat cuaca kering.'],
        'color': 'yellow', 'risk_level': 'Sedang', 'risk_color': 'yellow'
    },
    'Negative': {
        'description': 'Gambar yang diunggah tidak dapat diidentifikasi sebagai daun anggur atau kualitasnya tidak cukup untuk analisis.',
        'tips': ['Gunakan Latar Belakang Polos: Posisikan daun di atas permukaan kontras seperti kertas putih.', 'Fokus yang Tajam: Pastikan kamera fokus pada daun, bukan pada latar belakang.', 'Pencahayaan Merata: Hindari bayangan tajam atau cahaya yang terlalu terang (overexposure).', 'Resolusi yang Cukup: Gunakan gambar dengan resolusi yang baik untuk detail yang lebih jelas.'],
        'action': [], 'symptoms': [], 'triggers': [], 'color': 'zinc'
    }
}

# Data Tips Perawatan untuk Chatbot
tips_data = [
    { "title": "Pencegahan Jamur", "summary": "Pastikan sirkulasi udara yang baik dengan pemangkasan rutin dan hindari genangan air di sekitar akar untuk menekan pertumbuhan jamur.", "keywords": ["jamur", "cegah", "hujan"] },
    { "title": "Pemupukan", "summary": "Gunakan pupuk NPK seimbang pada fase vegetatif dan tingkatkan Kalium (K) saat memasuki fase pembuahan untuk hasil yang maksimal.", "keywords": ["pupuk", "pemupukan", "nutrisi"] },
    { "title": "Penyiraman", "summary": "Lakukan penyiraman di pagi hari untuk memberi waktu daun mengering sebelum malam, mengurangi risiko penyakit akibat kelembapan.", "keywords": ["siram", "air", "menyiram"] },
    { "title": "Sanitasi Kebun", "summary": "Bersihkan daun dan ranting yang gugur secara teratur. Sisa tanaman dapat menjadi tempat berkembang biak bagi hama dan penyakit.", "keywords": ["bersih", "sanitasi", "kebun"] }
]