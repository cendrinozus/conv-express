from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from app.models.database import db
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PDF_FOLDER'], exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.colis import colis_bp
    from app.routes.factures import factures_bp
    from app.routes.paiements import paiements_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.parametres import parametres_bp

    app.register_blueprint(auth_bp,        url_prefix='/api/auth')
    app.register_blueprint(colis_bp,       url_prefix='/api/colis')
    app.register_blueprint(factures_bp,    url_prefix='/api/factures')
    app.register_blueprint(paiements_bp,   url_prefix='/api/paiements')
    app.register_blueprint(dashboard_bp,   url_prefix='/api/dashboard')
    app.register_blueprint(parametres_bp,  url_prefix='/api/parametres')

    with app.app_context():
        db.create_all()
        from app.models.user import User
        from app.models.parametre import Parametre
        from werkzeug.security import generate_password_hash
        if not User.query.filter_by(email='admin@convoyage.com').first():
            db.session.add(User(
                nom='Administrateur',
                email='admin@convoyage.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            ))
            db.session.commit()
        Parametre.seed_defaults()

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'ConvoyTogo API'}

    return app