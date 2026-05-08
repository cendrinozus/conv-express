from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.utils import current_user
from app.models.database import db
from app.models.colis import Colis
from app.models.facture import Facture
from sqlalchemy import func
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    current = current_user()
    
    colis_q = Colis.query
    fact_q = db.session.query(Facture).join(Colis)
    
    if current['role'] == 'convoyeur':
        colis_q = colis_q.filter_by(convoyeur_id=current['id'])
        fact_q = fact_q.filter(Colis.convoyeur_id == current['id'])
    
    # Colis
    total_colis = colis_q.count()
    recu = colis_q.filter_by(statut='recu').count()
    en_transit = colis_q.filter_by(statut='en_transit').count()
    arrive = colis_q.filter_by(statut='arrive').count()
    livre = colis_q.filter_by(statut='livre').count()
    
    # Finances
    montant_total = db.session.query(func.sum(Facture.montant_total)).scalar() or 0
    montant_percu = db.session.query(func.sum(Facture.montant_total)).filter(
        Facture.statut_paiement == 'paye').scalar() or 0
    
    # Derniers colis
    derniers = colis_q.order_by(Colis.created_at.desc()).limit(5).all()
    
    # Activité 7 derniers jours
    sept_jours = []
    for i in range(6, -1, -1):
        jour = datetime.utcnow() - timedelta(days=i)
        debut = jour.replace(hour=0, minute=0, second=0, microsecond=0)
        fin = debut + timedelta(days=1)
        count = colis_q.filter(Colis.created_at >= debut, Colis.created_at < fin).count()
        sept_jours.append({'date': debut.strftime('%d/%m'), 'count': count})
    
    return jsonify({
        'colis': {
            'total': total_colis,
            'recu': recu,
            'en_transit': en_transit,
            'arrive': arrive,
            'livre': livre
        },
        'finances': {
            'montant_total': montant_total,
            'montant_percu': montant_percu,
            'montant_en_attente': montant_total - montant_percu
        },
        'derniers_colis': [c.to_dict() for c in derniers],
        'activite_semaine': sept_jours
    }), 200
