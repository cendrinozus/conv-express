from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils import current_user
from app.models.database import db
from app.models.parametre import Parametre

parametres_bp = Blueprint('parametres', __name__)

@parametres_bp.route('/', methods=['GET'])
@jwt_required()
def get_parametres():
    current = current_user()
    if current['role'] != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    rows = Parametre.query.all()
    data = {r.cle: r.valeur for r in rows}
    for cle, valeur in Parametre.DEFAULTS.items():
        data.setdefault(cle, valeur)
    return jsonify(data), 200

@parametres_bp.route('/', methods=['PUT'])
@jwt_required()
def update_parametres():
    current = current_user()
    if current['role'] != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    data = request.get_json()

    if 'tarif_par_kg' in data:
        try:
            tarif = float(data['tarif_par_kg'])
            if tarif <= 0:
                return jsonify({'message': 'Le tarif doit être supérieur à 0'}), 400
            Parametre.set('tarif_par_kg', tarif)
        except (ValueError, TypeError):
            return jsonify({'message': 'Tarif invalide'}), 400

    if 'devise' in data:
        devise = str(data['devise']).strip().upper()
        if not devise:
            return jsonify({'message': 'Devise invalide'}), 400
        Parametre.set('devise', devise)

    db.session.commit()
    return jsonify({'message': 'Paramètres mis à jour avec succès'}), 200
