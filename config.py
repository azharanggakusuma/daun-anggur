import os

class Config:
    """
    Konfigurasi utama aplikasi Flask.
    """
    # Kunci rahasia untuk keamanan sesi dan form
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'kunci-rahasia-yang-sulit-ditebak'

    # Konfigurasi untuk unggah file
    UPLOAD_FOLDER = 'static/uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    
    # Batas maksimal ukuran file yang diunggah (10MB)
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
