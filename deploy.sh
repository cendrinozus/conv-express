#!/bin/bash
# deploy.sh — Script de déploiement Convoyage Express
# Usage: sudo bash deploy.sh

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="/var/www/convoyage"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

info "=== Déploiement Convoyage Express ==="

# --- Vérification Ubuntu/Debian ---
if ! command -v apt &>/dev/null; then
    error "Ce script requiert un système Ubuntu/Debian"
fi

# --- Mise à jour système ---
info "Mise à jour des paquets..."
apt update -qq

# --- Dépendances ---
info "Installation des dépendances..."
apt install -y -qq \
    python3 python3-pip python3-venv \
    mysql-server \
    apache2 \
    nodejs npm \
    libapache2-mod-proxy-html \
    curl

# --- Node.js 20 si besoin ---
if ! node --version | grep -q "v2[0-9]"; then
    warn "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

info "Node: $(node --version) | npm: $(npm --version)"

# --- Répertoires ---
info "Création des répertoires..."
mkdir -p "$BACKEND_DIR" "$FRONTEND_DIR"

# --- MySQL ---
info "Configuration MySQL..."
systemctl start mysql
mysql -e "CREATE DATABASE IF NOT EXISTS convoyage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'convoyage_user'@'localhost' IDENTIFIED BY 'ConvoyageSecure2024!';"
mysql -e "GRANT ALL PRIVILEGES ON convoyage_db.* TO 'convoyage_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
info "MySQL configuré ✓"

# --- Backend Python ---
info "Configuration du backend Flask..."
cd "$BACKEND_DIR"

# Environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer dépendances
pip install -q --upgrade pip
pip install -q flask flask-sqlalchemy flask-cors flask-jwt-extended pymysql werkzeug reportlab cryptography

# Variables d'environnement
cat > "$BACKEND_DIR/.env" << 'ENVEOF'
DATABASE_URL=mysql+pymysql://convoyage_user:ConvoyageSecure2024!@localhost/convoyage_db
SECRET_KEY=change-this-secret-key-in-production-$(openssl rand -hex 32)
JWT_SECRET_KEY=change-this-jwt-key-$(openssl rand -hex 32)
TARIF_PAR_KG=500
DEVISE=FCFA
ENVEOF

# Service systemd pour Flask
cat > /etc/systemd/system/convoyage-api.service << 'SVCEOF'
[Unit]
Description=Convoyage Express - Flask API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/convoyage/backend
Environment=FLASK_APP=app.py
Environment=FLASK_ENV=production
EnvironmentFile=/var/www/convoyage/backend/.env
ExecStart=/var/www/convoyage/backend/venv/bin/python app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# Démarrer API
python app.py &
sleep 3
kill %1 2>/dev/null || true
deactivate

info "Backend configuré ✓"

# --- Frontend React ---
info "Build du frontend React..."
cd "$FRONTEND_DIR"
npm install --silent
REACT_APP_API_URL=/api npm run build
info "Frontend compilé ✓"

# --- Apache ---
info "Configuration Apache..."
a2enmod rewrite proxy proxy_http headers

# Copier la config
cp "$(dirname "$0")/docs/apache-convoyage.conf" /etc/apache2/sites-available/convoyage.conf

# Pointer vers notre build
sed -i "s|/var/www/convoyage/frontend/build|$FRONTEND_DIR/build|g" \
    /etc/apache2/sites-available/convoyage.conf

a2ensite convoyage.conf
a2dissite 000-default.conf 2>/dev/null || true
apache2ctl configtest
systemctl restart apache2

info "Apache configuré ✓"

# --- Permissions ---
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

# --- Démarrer les services ---
systemctl daemon-reload
systemctl enable convoyage-api
systemctl start convoyage-api

info ""
info "=== Déploiement terminé ! ==="
info "Frontend : http://$(hostname -I | awk '{print $1}')"
info "API      : http://$(hostname -I | awk '{print $1}')/api"
info "Tracking : http://$(hostname -I | awk '{print $1}')/tracking"
info ""
info "Compte admin: admin@convoyage.com / admin123"
warn "⚠ Changez le mot de passe admin après la première connexion !"
