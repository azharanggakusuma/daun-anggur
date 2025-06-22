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
import google.generativeai as genai 
from config import Config
from knowledge_base import disease_info, tips_data
import json

# --- Inisialisasi Aplikasi Flask ---
app = Flask(__name__)
app.config.from_object(Config)

# --- Memastikan Direktori Upload Ada ---
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# --- Memuat Model ---
try:
    model = load_model('model/model_daun_anggur.h5')
    class_names = ['Busuk', 'Esca', 'Hawar', 'Negative', 'Sehat']
except (IOError, OSError) as e:
    print(f"Error: Gagal memuat file model 'model/model_daun_anggur.h5'. {e}")
    model = None

# --- PENYESUAIAN UTAMA DI SINI: Instruksi Sistem untuk Gemini ---
try:
    if app.config['GEMINI_API_KEY']:
        genai.configure(api_key=app.config['GEMINI_API_KEY'])

    knowledge_base_text = (
        "Ini adalah basis pengetahuan internalmu. Gunakan ini sebagai sumber kebenaran utama untuk menjawab pertanyaan spesifik tentang penyakit dan tips.\n\n"
        "=== Informasi Penyakit ===\n"
        f"{json.dumps(disease_info, indent=2, ensure_ascii=False)}\n\n"
        "=== Tips Perawatan ===\n"
        f"{json.dumps(tips_data, indent=2, ensure_ascii=False)}\n"
    )
    
    # --- PENYEMPURNAAN INSTRUKSI SISTEM ---
    system_instruction = (
        "Kamu adalah Asisten AI GrapeCheck, seorang ahli tanaman anggur yang ramah dan sangat membantu. "
        "Tugas utamamu adalah menjawab pertanyaan seputar budidaya, penyakit, dan perawatan tanaman anggur berdasarkan basis pengetahuan yang diberikan. "
        "Selalu jawab dengan gaya percakapan yang bersahabat dan mudah dimengerti. "
        "Jika ada pertanyaan yang sama sekali tidak berhubungan dengan tanaman, pertanian, atau botani, tolak dengan sopan dan kembalikan percakapan ke topik anggur. "
        "Kamu memiliki ingatan dari percakapan sebelumnya, gunakan itu untuk memberikan jawaban yang kontekstual. "
        "Jika ditanya siapa yang membuatmu, jawab kamu dikembangkan oleh Azharangga Kusuma. "
        
        # --- Instruksi Formatting yang Lebih Detail ---
        "Selalu gunakan format **Markdown** untuk menstrukturkan jawabanmu agar mudah dibaca. "
        "Gunakan **teks tebal** untuk istilah-istilah penting (seperti nama penyakit atau jenis pupuk). "
        "Untuk daftar seperti gejala atau rekomendasi, selalu gunakan daftar poin dengan tanda hubung ('-'). "
        "Pecah jawaban yang panjang menjadi beberapa paragraf singkat untuk keterbacaan maksimal. "
        "Contoh format jawaban:\n\nTentu, ini gejala untuk **Busuk (Black Rot)**:\n- Bercak kecil keputihan/kuning pada daun.\n- Bercak membesar menjadi coklat kemerahan dengan tepi hitam.\n- Muncul titik-titik hitam kecil di tengah bercak.\n\n"
        
        "Jangan pernah menyebutkan bahwa kamu diberi basis pengetahuan dalam format JSON, anggap saja itu pengetahuan internalmu.\n\n"
        f"--- BASIS PENGETAHUAN INTERNAL ---\n{knowledge_base_text}"
    )

    gemini_model = genai.GenerativeModel(
        model_name='gemini-1.5-flash',
        system_instruction=system_instruction
    )
    print("Model Gemini cerdas berhasil dikonfigurasi dengan instruksi yang disempurnakan.")
except Exception as e:
    print(f"Error saat mengkonfigurasi Gemini: {e}")
    gemini_model = None
# --- AKHIR PENYESUAIAN ---


@app.context_processor
def inject_global_data():
    """Menyuntikkan variabel ke semua template."""
    return dict(disease_info=disease_info, tips_data=tips_data)

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

@app.errorhandler(413)
def request_entity_too_large(error):
    """Menangani error ketika file yang diunggah terlalu besar."""
    return jsonify({'error': 'Ukuran file melebihi batas maksimal (10MB).'}), 413

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
    
@app.route('/chat_ai', methods=['POST'])
def chat_ai():
    if not gemini_model:
        return jsonify({'error': 'Model AI tidak terkonfigurasi dengan benar.'}), 500

    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'Pesan tidak ditemukan'}), 400
    
    user_message = data['message']
    history = data.get('history', [])

    try:
        chat_session = gemini_model.start_chat(history=history)
        response = chat_session.send_message(user_message)
        return jsonify({'response': response.text})
        
    except Exception as e:
        print(f"Error dari Gemini API: {e}")
        return jsonify({'error': 'Gagal berkomunikasi dengan Asisten AI.'}), 503

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

@app.route('/history/<filename>', methods=['DELETE'])
def delete_history_item(filename):
    """Menghapus satu item riwayat dan file gambarnya."""
    # Keamanan: Pastikan filename aman dan tidak mengandung path traversal
    safe_filename = secure_filename(filename)
    if safe_filename != filename:
        return jsonify({'status': 'error', 'message': 'Nama file tidak valid.'}), 400

    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        
        # Hapus file jika ada
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'status': 'success', 'message': f'File {safe_filename} berhasil dihapus.'}), 200
        else:
            # Jika file tidak ada, mungkin sudah dihapus sebelumnya. Anggap sukses.
            return jsonify({'status': 'success', 'message': f'File {safe_filename} tidak ditemukan, riwayat tetap dihapus.'}), 200
            
    except Exception as e:
        print(f"Error saat menghapus file {safe_filename}: {e}")
        return jsonify({'status': 'error', 'message': 'Gagal menghapus file di server.'}), 500

@app.route('/history', methods=['DELETE'])
def delete_all_history_items():
    """Menghapus semua item riwayat dan file gambar terkait."""
    data = request.get_json()
    if not data or 'filenames' not in data:
        return jsonify({'status': 'error', 'message': 'Data filenames tidak ada.'}), 400

    filenames = data['filenames']
    if not isinstance(filenames, list):
        return jsonify({'status': 'error', 'message': 'Data filenames harus berupa list.'}), 400

    deleted_files = []
    failed_files = []

    for filename in filenames:
        safe_filename = secure_filename(filename)
        if safe_filename != filename:
            failed_files.append({'filename': filename, 'reason': 'Nama file tidak valid'})
            continue
        
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_files.append(safe_filename)
        except Exception as e:
            print(f"Error saat menghapus file {safe_filename}: {e}")
            failed_files.append({'filename': safe_filename, 'reason': str(e)})

    return jsonify({
        'status': 'success', 
        'message': 'Proses penghapusan selesai.',
        'deleted_count': len(deleted_files),
        'failed_count': len(failed_files),
        'failed_files': failed_files
    }), 200

# --- Menjalankan Aplikasi ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)