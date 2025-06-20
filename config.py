import os
import json

class Config:
    """
    Konfigurasi utama aplikasi Flask.
    Menyimpan variabel-variabel penting seperti kunci rahasia dan pengaturan file.
    """
    # Kunci rahasia digunakan untuk mengamankan sesi dan form dari serangan CSRF
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'kunci-rahasia-yang-sangat-aman-dan-sulit-ditebak'

    # --- PERUBAHAN BARU: Kunci API Gemini ---
    # Ganti "YOUR_API_KEY" dengan kunci yang Anda dapatkan dari Google AI Studio
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'AIzaSyA2xQmMsN28r1I4vEhV90_I0mTc81fj5HQ'

    # Konfigurasi untuk folder tempat menyimpan file yang diunggah
    UPLOAD_FOLDER = 'static/uploads'
    
    # Ekstensi file yang diizinkan untuk diunggah
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    
    # Batas maksimal ukuran file yang diunggah (misalnya, 10MB)
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024