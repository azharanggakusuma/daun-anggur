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
# --- PERUBAHAN DI SINI: Impor basis pengetahuan dari file baru ---
from knowledge_base import disease_info, tips_data

# --- Inisialisasi Aplikasi Flask ---
app = Flask(__name__)
app.config.from_object(Config)

# --- Memastikan Direktori Upload Ada ---
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# --- Memuat Model ---
try:
    # Memuat model machine learning yang telah dilatih sebelumnya
    model = load_model('model/model_daun_anggur.h5')
    # Daftar nama kelas/label yang sesuai dengan output model
    class_names = ['Busuk', 'Esca', 'Hawar', 'Negative', 'Sehat']
except (IOError, OSError) as e:
    print(f"Error: Gagal memuat file model 'model/model_daun_anggur.h5'. {e}")
    model = None

# --- PERUBAHAN DI SINI: Kamus 'disease_info' dan 'tips_data' telah dipindahkan ---
# --- ke 'knowledge_base.py' untuk menjaga file ini tetap bersih. ---

# --- Context Processor yang diperbarui (tidak ada perubahan fungsional) ---
@app.context_processor
def inject_global_data():
    """Menyuntikkan variabel ke semua template."""
    return dict(disease_info=disease_info, tips_data=tips_data)

# --- (Sisa kode app.py tetap sama persis seperti sebelumnya) ---

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
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)
        
        return jsonify({'success': True, 'redirect_url': url_for('hasil', filename=unique_filename)})
        
    return redirect(url_for('index'))

@app.route('/hasil/<filename>')
def hasil(filename):
    """Menampilkan halaman hasil analisis berdasarkan file gambar."""
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(save_path):
        return "File tidak ditemukan.", 404
        
    label, confidence, all_probs = process_prediction(save_path)
    
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
    
    return render_template('hasil.html', result=result_data)

@app.route('/panduan')
def panduan():
    """Menampilkan halaman panduan informasi penyakit dan tips."""
    return render_template('panduan.html')

@app.route('/feedback', methods=['POST'])
def feedback():
    """Menerima dan mencatat feedback akurasi dari pengguna."""
    data = request.get_json()
    if not data or 'filename' not in data or 'feedback' not in data:
        return jsonify({'status': 'error', 'message': 'Data tidak lengkap'}), 400
    
    try:
        with open('feedback.log', 'a') as f:
            f.write(f"{datetime.now().isoformat()},{data['filename']},{data['feedback']}\n")
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Gagal menyimpan feedback: {e}")
        return jsonify({'status': 'error', 'message': 'Gagal menyimpan feedback'}), 500

@app.route('/tentang')
def tentang():
    """Menampilkan halaman Tentang Aplikasi."""
    return render_template('tentang.html')

# --- Menjalankan Aplikasi ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)