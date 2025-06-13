# Impor library yang diperlukan
from flask import Flask, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from datetime import datetime
import numpy as np
import os
import pytz
import uuid
from config import Config

# --- Inisialisasi Aplikasi Flask ---
app = Flask(__name__)
app.config.from_object(Config)

# --- Memastikan Direktori Upload Ada ---
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# --- Memuat Model & Data Penyakit ---
try:
    # Memuat model machine learning yang telah dilatih sebelumnya
    model = load_model('model/model_daun_anggur.h5')
    # Daftar nama kelas/label yang sesuai dengan output model
    class_names = ['Busuk', 'Esca', 'Hawar', 'Negative', 'Sehat']
except (IOError, OSError) as e:
    print(f"Error: Gagal memuat file model 'model/model_daun_anggur.h5'. {e}")
    model = None

# Detail informasi untuk setiap penyakit
disease_info = {
    'Sehat': {
        'description': 'Daun tidak menunjukkan tanda-tanda visual penyakit atau kekurangan nutrisi. Ini menandakan kesehatan tanaman yang baik dan praktik perawatan yang efektif.',
        'symptoms': ['Warna daun hijau merata dan cerah, sesuai dengan varietasnya.', 'Tidak ada bercak, lubang, atau perubahan warna yang tidak biasa.', 'Bentuk dan ukuran daun normal, tidak keriput atau kerdil.'],
        'triggers': ['Kondisi ini dipertahankan oleh nutrisi yang seimbang.', 'Penyiraman yang konsisten dan drainase yang baik.', 'Sirkulasi udara yang memadai di sekitar tanaman.'],
        'action': ['Pertahankan praktik perawatan yang sudah baik dan terjadwal.', 'Lanjutkan pemantauan rutin untuk deteksi dini masalah di kemudian hari.', 'Lakukan pemupukan lanjutan sesuai dengan fase pertumbuhan tanaman.'],
        'color': 'green'
    },
    'Busuk': {
        'description': 'Juga dikenal sebagai "Black Rot", penyakit ini disebabkan oleh jamur Guignardia bidwellii dan dapat merusak daun, batang, hingga buah anggur.',
        'symptoms': ['Bercak kecil berwarna keputihan atau kuning pada daun.', 'Bercak membesar dengan cepat, menjadi coklat kemerahan dengan tepi hitam.', 'Pada tahap lanjut, titik-titik hitam kecil (piknidia) muncul di tengah bercak.'],
        'triggers': ['Kondisi cuaca yang hangat dan lembab, terutama di musim semi dan panas.', 'Kelembapan yang bertahan lama pada permukaan daun (lebih dari 6 jam).', 'Sisa-sisa tanaman dari musim sebelumnya yang terinfeksi.'],
        'action': ['Segera buang dan musnahkan semua bagian tanaman yang terinfeksi.', 'Aplikasikan fungisida yang efektif untuk Black Rot, terutama sebelum dan sesudah periode hujan.', 'Lakukan pemangkasan untuk meningkatkan sirkulasi udara dan mempercepat pengeringan daun.'],
        'color': 'red'
    },
    'Esca': {
        'description': 'Penyakit kayu kompleks yang disebabkan oleh beberapa jenis jamur patogen. Penyakit ini menyerang sistem vaskular tanaman dan seringkali kronis.',
        'symptoms': ['Munculnya corak "garis harimau" (tiger stripes) berwarna kuning atau merah di antara tulang daun.', 'Daun bisa terlihat layu secara tiba-tiba di siang hari yang panas.', 'Dalam kasus akut (apoplexy), seluruh bagian tanaman bisa mati dengan cepat.'],
        'triggers': ['Luka pemangkasan yang besar dan tidak terlindungi menjadi jalur masuk jamur.', 'Tanaman anggur yang sudah tua dan lebih rentan terhadap stres.', 'Kondisi cuaca ekstrem, seperti kekeringan yang diikuti hujan lebat.'],
        'action': ['Pangkas bagian kayu yang terinfeksi jauh di bawah area bergejala (minimal 20-30 cm).', 'Gunakan cat pelindung luka pangkas untuk mencegah infeksi baru.', 'Belum ada fungisida yang sepenuhnya kuratif, fokus utama adalah pencegahan dan sanitasi.'],
        'color': 'orange'
    },
    'Hawar': {
        'description': 'Disebabkan oleh bakteri Xanthomonas ampelina. Penyakit ini dapat menyebabkan kerusakan signifikan pada daun dan pucuk muda tanaman anggur.',
        'symptoms': ['Bercak kecil kebasahan (water-soaked) pada daun.', 'Bercak membesar, menjadi nekrotik (jaringan mati), dan seringkali menyebabkan daun robek atau berlubang.', 'Pada pucuk, dapat menyebabkan retakan dan kanker berwarna hitam.'],
        'triggers': ['Kelembapan tinggi dan suhu yang sejuk hingga sedang.', 'Percikan air hujan atau irigasi sprinkler yang menyebarkan bakteri.', 'Sirkulasi udara yang buruk di antara tajuk tanaman.'],
        'action': ['Gunakan semprotan bakterisida berbasis tembaga sesuai anjuran, terutama di awal musim tanam.', 'Hindari irigasi dari atas yang membasahi daun; gunakan irigasi tetes jika memungkinkan.', 'Pangkas dan buang bagian tanaman yang terinfeksi selama periode cuaca kering.'],
        'color': 'yellow'
    },
    'Negative': {
        'description': 'Gambar yang diunggah tidak dapat diidentifikasi sebagai daun anggur atau kualitasnya tidak cukup untuk analisis.',
        'tips': ['Gunakan Latar Belakang Polos: Posisikan daun di atas permukaan kontras seperti kertas putih.', 'Fokus yang Tajam: Pastikan kamera fokus pada daun, bukan pada latar belakang.', 'Pencahayaan Merata: Hindari bayangan tajam atau cahaya yang terlalu terang (overexposure).', 'Resolusi yang Cukup: Gunakan gambar dengan resolusi yang baik untuk detail yang lebih jelas.'],
        'action': [], 'symptoms': [], 'triggers': [], 'color': 'zinc'
    }
}

# --- Fungsi Bantuan ---
def allowed_file(filename):
    """Memeriksa apakah ekstensi file diizinkan."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def process_prediction(image_path):
    """Memproses gambar dan mengembalikan hasil prediksi dari model."""
    if not model:
        return "Error", 0, {}
    try:
        # Muat dan proses gambar agar sesuai dengan input model
        img = load_img(image_path, target_size=(224, 224))
        img_array = img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Lakukan prediksi
        predictions = model.predict(img_array)[0]
        predicted_index = np.argmax(predictions)
        predicted_label = class_names[predicted_index]
        confidence = float(predictions[predicted_index]) * 100
        
        # Kumpulkan semua probabilitas
        all_probs = {class_names[i]: float(predictions[i]) * 100 for i in range(len(class_names))}
        return predicted_label, confidence, all_probs
    except Exception as e:
        print(f"Error saat memproses prediksi: {e}")
        return "Negative", 0, {}

# --- Penangan Kesalahan (Error Handlers) ---
@app.errorhandler(413)
def request_entity_too_large(error):
    """Menangani error ketika file yang diunggah terlalu besar."""
    return jsonify({'error': 'Ukuran file melebihi batas maksimal (10MB).'}), 413

# --- Rute Aplikasi ---
@app.route('/')
def index():
    """Menampilkan halaman utama untuk mengunggah gambar."""
    return render_template('index.html')

@app.route('/riwayat')
def riwayat():
    """Menampilkan halaman riwayat analisis."""
    return render_template('riwayat.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Menangani proses unggah file gambar."""
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file yang dikirim.'}), 400
        
    file = request.files['file']
    
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Jenis file tidak valid. Harap unggah file JPG, JPEG, atau PNG.'}), 400
        
    if file:
        # Amankan nama file dan buat nama unik untuk menghindari konflik
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)
        
        # Kembalikan URL untuk halaman hasil
        return jsonify({'success': True, 'redirect_url': url_for('hasil', filename=unique_filename)})
        
    return redirect(url_for('index'))

@app.route('/hasil/<filename>')
def hasil(filename):
    """Menampilkan halaman hasil analisis berdasarkan file gambar."""
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(save_path):
        return "File tidak ditemukan.", 404
        
    # Proses gambar untuk mendapatkan diagnosis
    label, confidence, all_probs = process_prediction(save_path)
    
    # Siapkan data untuk ditampilkan di template
    wib = pytz.timezone('Asia/Jakarta')
    timestamp = datetime.now(wib).isoformat()
    
    result_data = {
        'image': filename,
        'label': label,
        'confidence': confidence,
        'all_probs': all_probs,
        'info': disease_info.get(label, disease_info['Negative']),
        'timestamp': timestamp
    }
    
    return render_template('hasil.html', result=result_data, disease_info=disease_info)

@app.route('/penyakit')
def penyakit():
    """Menampilkan halaman informasi semua penyakit."""
    return render_template('penyakit.html', disease_info=disease_info)

# Route baru untuk menangani feedback dari pengguna
@app.route('/feedback', methods=['POST'])
def feedback():
    """Menerima dan mencatat feedback akurasi dari pengguna."""
    data = request.get_json()
    if not data or 'filename' not in data or 'feedback' not in data:
        return jsonify({'status': 'error', 'message': 'Data tidak lengkap'}), 400
    
    try:
        # Simpan feedback ke dalam sebuah file log sederhana
        with open('feedback.log', 'a') as f:
            f.write(f"{datetime.now().isoformat()},{data['filename']},{data['feedback']}\n")
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Gagal menyimpan feedback: {e}")
        return jsonify({'status': 'error', 'message': 'Gagal menyimpan feedback'}), 500

# --- Menjalankan Aplikasi ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)