from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.utils import current_user
from app.models.database import db
from app.models.colis import Colis
from app.models.facture import Facture
from app.models.parametre import Parametre

colis_bp = Blueprint('colis', __name__)

@colis_bp.route('/', methods=['GET'])
@jwt_required()
def list_colis():
    current = current_user()
    query = Colis.query
    
    if current['role'] == 'convoyeur':
        query = query.filter_by(convoyeur_id=current['id'])
    
    statut = request.args.get('statut')
    if statut:
        query = query.filter_by(statut=statut)
    
    search = request.args.get('search', '')
    if search:
        query = query.filter(
            db.or_(
                Colis.numero_tracking.ilike(f'%{search}%'),
                Colis.expediteur_nom.ilike(f'%{search}%'),
                Colis.destinataire_nom.ilike(f'%{search}%'),
                Colis.destination.ilike(f'%{search}%')
            )
        )
    
    colis = query.order_by(Colis.created_at.desc()).all()
    return jsonify([c.to_dict() for c in colis]), 200

@colis_bp.route('/<int:colis_id>', methods=['GET'])
@jwt_required()
def get_colis(colis_id):
    colis = Colis.query.get_or_404(colis_id)
    return jsonify(colis.to_dict()), 200

@colis_bp.route('/tracking/<string:numero>', methods=['GET'])
def tracking(numero):
    colis = Colis.query.filter_by(numero_tracking=numero).first()
    if not colis:
        return jsonify({'message': 'Colis non trouvé'}), 404
    return jsonify(colis.to_dict()), 200

@colis_bp.route('/', methods=['POST'])
@jwt_required()
def create_colis():
    current = current_user()
    if current['role'] not in ['admin', 'convoyeur']:
        return jsonify({'message': 'Accès refusé'}), 403
    
    data = request.get_json()
    tarif_kg = float(Parametre.get('tarif_par_kg'))
    devise = Parametre.get('devise')
    
    colis = Colis(
        numero_tracking=Colis.generate_tracking(),
        expediteur_nom=data['expediteur_nom'],
        expediteur_telephone=data['expediteur_telephone'],
        expediteur_adresse=data.get('expediteur_adresse', ''),
        destinataire_nom=data['destinataire_nom'],
        destinataire_telephone=data['destinataire_telephone'],
        destinataire_adresse=data.get('destinataire_adresse', ''),
        description=data.get('description', ''),
        poids=float(data['poids']),
        destination=data['destination'],
        origine=data['origine'],
        statut='recu',
        convoyeur_id=current['id']
    )
    db.session.add(colis)
    db.session.flush()
    
    # Créer facture automatiquement
    montant = colis.poids * tarif_kg
    facture = Facture(
        numero_facture=Facture.generate_numero(),
        colis_id=colis.id,
        poids=colis.poids,
        tarif_kg=tarif_kg,
        montant_total=montant,
        devise=devise,
        mode_paiement=data.get('mode_paiement', 'destination'),
        statut_paiement='non_paye'
    )
    db.session.add(facture)
    db.session.commit()
    
    return jsonify(colis.to_dict()), 201

@colis_bp.route('/<int:colis_id>', methods=['PUT'])
@jwt_required()
def update_colis(colis_id):
    current = current_user()
    colis = Colis.query.get_or_404(colis_id)
    
    if current['role'] == 'convoyeur' and colis.convoyeur_id != current['id']:
        return jsonify({'message': 'Accès refusé'}), 403
    
    data = request.get_json()
    for field in ['statut', 'expediteur_nom', 'expediteur_telephone', 'destinataire_nom',
                  'destinataire_telephone', 'description', 'destination', 'origine']:
        if field in data:
            setattr(colis, field, data[field])
    
    db.session.commit()
    return jsonify(colis.to_dict()), 200

@colis_bp.route('/<int:colis_id>/statut', methods=['PATCH'])
@jwt_required()
def update_statut(colis_id):
    current = current_user()
    if current['role'] not in ['admin', 'convoyeur']:
        return jsonify({'message': 'Accès refusé'}), 403
    
    colis = Colis.query.get_or_404(colis_id)
    data = request.get_json()
    colis.statut = data['statut']
    db.session.commit()
    return jsonify(colis.to_dict()), 200

@colis_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    current = current_user()
    query = Colis.query
    if current['role'] == 'convoyeur':
        query = query.filter_by(convoyeur_id=current['id'])
    
    return jsonify({
        'total': query.count(),
        'recu': query.filter_by(statut='recu').count(),
        'en_transit': query.filter_by(statut='en_transit').count(),
        'arrive': query.filter_by(statut='arrive').count(),
        'livre': query.filter_by(statut='livre').count(),
    }), 200
