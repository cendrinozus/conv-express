import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'convoyage-secret-key-2024-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'mysql+pymysql://convoyage_user:convoyage_pass@localhost/convoyage_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-convoyage-2024')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    TARIF_PAR_KG = float(os.environ.get('TARIF_PAR_KG', '500'))  # FCFA par kg
    DEVISE = os.environ.get('DEVISE', 'FCFA')
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    PDF_FOLDER = os.environ.get('PDF_FOLDER', 'pdfs')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
