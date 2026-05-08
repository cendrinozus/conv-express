from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from app.utils import current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.database import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    user = User.query.filter_by(email=email, actif=True).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401
    
    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role, 'nom': user.nom})
    return jsonify({'token': token, 'user': user.to_dict()}), 200

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    current = current_user()
    if current['role'] not in ['admin', 'convoyeur']:
        return jsonify({'message': 'Accès refusé'}), 403
    
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email déjà utilisé'}), 400
    
    user = User(
        nom=data['nom'],
        prenom=data.get('prenom', ''),
        email=data['email'],
        telephone=data.get('telephone', ''),
        password_hash=generate_password_hash(data['password']),
        role=data.get('role', 'client')
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Utilisateur créé', 'user': user.to_dict()}), 201

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current = current_user()
    user = User.query.get(current['id'])
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    current = current_user()
    if current['role'] != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current = current_user()
    if current['role'] != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    for field in ['nom', 'prenom', 'telephone', 'role', 'actif']:
        if field in data:
            setattr(user, field, data[field])
    if 'password' in data and data['password']:
        user.password_hash = generate_password_hash(data['password'])
    db.session.commit()
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current = current_user()
    user = User.query.get(current['id'])
    data = request.get_json()
    if not check_password_hash(user.password_hash, data['old_password']):
        return jsonify({'message': 'Ancien mot de passe incorrect'}), 400
    user.password_hash = generate_password_hash(data['new_password'])
    db.session.commit()
    return jsonify({'message': 'Mot de passe modifié'}), 200
