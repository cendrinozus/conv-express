from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from app.models.database import db
from app.routes.auth import auth_bp
from app.routes.colis import colis_bp
from app.routes.factures import factures_bp
from app.routes.paiements import paiements_bp
from app.routes.dashboard import dashboard_bp
from app.routes.parametres import parametres_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    app.register_blueprint(auth_bp,       url_prefix='/api/auth')
    app.register_blueprint(colis_bp,      url_prefix='/api/colis')
    app.register_blueprint(factures_bp,   url_prefix='/api/factures')
    app.register_blueprint(paiements_bp,  url_prefix='/api/paiements')
    app.register_blueprint(dashboard_bp,  url_prefix='/api/dashboard')
    app.register_blueprint(parametres_bp, url_prefix='/api/parametres')

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

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
