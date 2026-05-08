from app.models.database import db
from datetime import datetime
import uuid

class Colis(db.Model):
    __tablename__ = 'colis'

    id = db.Column(db.Integer, primary_key=True)
    numero_tracking = db.Column(db.String(20), unique=True, nullable=False)
    
    # Expéditeur
    expediteur_nom = db.Column(db.String(100), nullable=False)
    expediteur_telephone = db.Column(db.String(20), nullable=False)
    expediteur_adresse = db.Column(db.String(200), nullable=True)
    
    # Destinataire
    destinataire_nom = db.Column(db.String(100), nullable=False)
    destinataire_telephone = db.Column(db.String(20), nullable=False)
    destinataire_adresse = db.Column(db.String(200), nullable=True)
    
    # Colis
    description = db.Column(db.String(255), nullable=True)
    poids = db.Column(db.Float, nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    origine = db.Column(db.String(100), nullable=False)
    
    # Statut
    statut = db.Column(db.Enum('recu', 'en_transit', 'arrive', 'livre'), default='recu')
    
    # Relations
    convoyeur_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    facture = db.relationship('Facture', backref='colis', uselist=False)

    @staticmethod
    def generate_tracking():
        prefix = "CVG"
        unique = str(uuid.uuid4()).replace('-', '').upper()[:8]
        return f"{prefix}{unique}"

    def to_dict(self):
        return {
            'id': self.id,
            'numero_tracking': self.numero_tracking,
            'expediteur_nom': self.expediteur_nom,
            'expediteur_telephone': self.expediteur_telephone,
            'expediteur_adresse': self.expediteur_adresse,
            'destinataire_nom': self.destinataire_nom,
            'destinataire_telephone': self.destinataire_telephone,
            'destinataire_adresse': self.destinataire_adresse,
            'description': self.description,
            'poids': self.poids,
            'destination': self.destination,
            'origine': self.origine,
            'statut': self.statut,
            'convoyeur_id': self.convoyeur_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'facture': self.facture.to_dict() if self.facture else None
        }
