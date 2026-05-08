# 📦 Convoyage Express — Application de Gestion de Colis

Application web complète pour gérer le convoyement de colis : enregistrement, facturation automatique, paiement, suivi et retrait.

---

## 🏗️ Architecture

```
convoyage/
├── backend/                  # Flask API REST
│   ├── app.py                # Point d'entrée
│   ├── config.py             # Configuration
│   ├── requirements.txt
│   ├── models/
│   │   ├── database.py       # SQLAlchemy init
│   │   ├── user.py           # Modèle utilisateur
│   │   ├── colis.py          # Modèle colis
│   │   └── facture.py        # Modèle facture
│   └── routes/
│       ├── auth.py           # Authentification JWT
│       ├── colis.py          # CRUD colis + tracking
│       ├── factures.py       # Factures + PDF (ReportLab)
│       ├── paiements.py      # Paiement & vérification
│       └── dashboard.py      # Stats & tableau de bord
├── frontend/                 # React 18
│   └── src/
│       ├── context/AuthContext.jsx  # Auth + Axios
│       ├── App.jsx           # Router
│       ├── index.css         # Design system sombre
│       ├── components/
│       │   └── Layout.jsx    # Sidebar responsive
│       └── pages/
│           ├── Login.jsx     # Page de connexion
│           ├── Dashboard.jsx # Stats + graphiques
│           ├── ColisList.jsx # Liste + filtres
│           ├── ColisForm.jsx # Créer/modifier colis
│           ├── FacturesList.jsx
│           ├── FactureDetail.jsx  # Détail + paiement
│           ├── Paiement.jsx  # Paiement par N° facture
│           ├── Tracking.jsx  # Suivi public
│           └── Users.jsx     # Gestion utilisateurs
└── docs/
    ├── apache-convoyage.conf # Config Apache
    ├── database_init.sql     # Init MySQL
    └── deploy.sh             # Script déploiement
```

---

## 🚀 Installation rapide

### Prérequis
- Ubuntu 20.04+ / Debian 11+
- Python 3.8+
- Node.js 18+
- MySQL 5.7+ ou MariaDB 10.3+
- Apache 2.4+

### 1. Cloner et préparer

```bash
git clone <repo> /var/www/convoyage
cd /var/www/convoyage
```

### 2. Base de données MySQL

```bash
mysql -u root -p < docs/database_init.sql
```

### 3. Backend Flask

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Créer le fichier `.env` :
```env
DATABASE_URL=mysql+pymysql://convoyage_user:convoyage_pass@localhost/convoyage_db
SECRET_KEY=votre-cle-secrete-unique
JWT_SECRET_KEY=votre-jwt-key
TARIF_PAR_KG=500
DEVISE=FCFA
```

Lancer :
```bash
python app.py
# API disponible sur http://localhost:5000
```

### 4. Frontend React

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
# Dev sur http://localhost:3000

# Production :
REACT_APP_API_URL=/api npm run build
```

### 5. Apache

```bash
# Activer les modules
sudo a2enmod rewrite proxy proxy_http headers

# Copier la config
sudo cp docs/apache-convoyage.conf /etc/apache2/sites-available/
sudo a2ensite convoyage.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

### Déploiement automatique
```bash
sudo bash deploy.sh
```

---

## 🔐 Comptes par défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@convoyage.com | admin123 |

> ⚠️ **Changez les mots de passe en production !**

---

## 📋 Fonctionnalités

### 👤 Gestion des rôles
- **Admin** : accès complet, gestion utilisateurs
- **Convoyeur** : enregistrement colis, paiements, statuts
- **Client** : (accès futur via portail ou tracking public)

### 📦 Gestion des colis
- Enregistrement avec numéro de tracking auto (CVG + 8 caractères)
- Suivi des statuts : Reçu → En transit → Arrivé → Livré
- Recherche par tracking, nom, destination

### 💰 Facturation
- Calcul automatique : **Poids × Tarif/kg**
- Tarif configurable (défaut: 500 FCFA/kg)
- Génération PDF avec ReportLab (design professionnel)
- Numéro de facture unique (FAC-YYYYMM-XXXXX)

### 💳 Paiement
- Paiement au départ ou à destination
- Vérification par numéro de facture
- Autorisation de retrait après paiement
- Historique des paiements

### 🔍 Suivi public
- Page `/tracking` accessible sans connexion
- Suivi par numéro de tracking
- Timeline visuelle des étapes

---

## 🛠️ API Endpoints

### Auth
```
POST /api/auth/login          Connexion
POST /api/auth/register       Créer utilisateur (admin)
GET  /api/auth/me             Profil courant
GET  /api/auth/users          Liste utilisateurs (admin)
PUT  /api/auth/users/:id      Modifier utilisateur
POST /api/auth/change-password Changer mot de passe
```

### Colis
```
GET    /api/colis/                    Liste (filtres: search, statut)
POST   /api/colis/                    Créer colis + facture auto
GET    /api/colis/:id                 Détail
PUT    /api/colis/:id                 Modifier
PATCH  /api/colis/:id/statut          Changer statut
GET    /api/colis/tracking/:numero    Suivi public
GET    /api/colis/stats               Statistiques
```

### Factures
```
GET  /api/factures/                   Liste
GET  /api/factures/:id                Détail
GET  /api/factures/numero/:num        Par numéro
GET  /api/factures/:id/pdf            Télécharger PDF
```

### Paiements
```
POST /api/paiements/payer/:id         Encaisser paiement
GET  /api/paiements/verifier/:num     Vérifier facture (public)
GET  /api/paiements/stats             Statistiques finances
```

### Dashboard
```
GET /api/dashboard/stats              Stats complètes + activité 7j
```

---

## ⚙️ Configuration

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | mysql+pymysql://... | URL MySQL |
| `SECRET_KEY` | (à définir) | Clé Flask |
| `JWT_SECRET_KEY` | (à définir) | Clé JWT |
| `TARIF_PAR_KG` | 500 | Prix par kilogramme |
| `DEVISE` | FCFA | Devise affichée |

---

## 📱 Responsive

L'interface est fully responsive :
- **Desktop** : sidebar fixe, tableaux complets
- **Mobile** : sidebar en overlay, navigation hamburger

---

## 🔧 Service systemd (production)

```ini
# /etc/systemd/system/convoyage-api.service
[Unit]
Description=Convoyage API
After=network.target mysql.service

[Service]
User=www-data
WorkingDirectory=/var/www/convoyage/backend
EnvironmentFile=/var/www/convoyage/backend/.env
ExecStart=/var/www/convoyage/backend/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now convoyage-api
```
