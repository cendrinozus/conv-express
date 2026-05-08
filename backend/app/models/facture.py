from app.models.database import db
from datetime import datetime
import uuid

class Facture(db.Model):
    __tablename__ = 'factures'

    id = db.Column(db.Integer, primary_key=True)
    numero_facture = db.Column(db.String(20), unique=True, nullable=False)
    colis_id = db.Column(db.Integer, db.ForeignKey('colis.id'), nullable=False)
    
    poids = db.Column(db.Float, nullable=False)
    tarif_kg = db.Column(db.Float, nullable=False)
    montant_total = db.Column(db.Float, nullable=False)
    devise = db.Column(db.String(10), default='FCFA')
    
    mode_paiement = db.Column(db.Enum('depart', 'destination'), default='destination')
    statut_paiement = db.Column(db.Enum('non_paye', 'paye'), default='non_paye')
    
    date_paiement = db.Column(db.DateTime, nullable=True)
    paye_par = db.Column(db.String(100), nullable=True)  # nom du payeur
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def generate_numero():
        prefix = "FAC"
        date_str = datetime.now().strftime('%Y%m')
        unique = str(uuid.uuid4()).replace('-', '').upper()[:5]
        return f"{prefix}-{date_str}-{unique}"

    def to_dict(self):
        return {
            'id': self.id,
            'numero_facture': self.numero_facture,
            'colis_id': self.colis_id,
            'poids': self.poids,
            'tarif_kg': self.tarif_kg,
            'montant_total': self.montant_total,
            'devise': self.devise,
            'mode_paiement': self.mode_paiement,
            'statut_paiement': self.statut_paiement,
            'date_paiement': self.date_paiement.isoformat() if self.date_paiement else None,
            'paye_par': self.paye_par,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
