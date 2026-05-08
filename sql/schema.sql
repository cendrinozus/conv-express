-- ============================================================
-- Convoyage Express — Init DB (aligné sur les modèles SQLAlchemy)
-- ============================================================

CREATE DATABASE IF NOT EXISTS convoyage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE convoyage_db;

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(100)  NOT NULL,
    prenom       VARCHAR(100),
    email        VARCHAR(150)  UNIQUE NOT NULL,
    telephone    VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role         ENUM('admin', 'convoyeur', 'client') NOT NULL DEFAULT 'client',
    actif        BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table colis (structure dénormalisée — expéditeur/destinataire en colonnes directes)
CREATE TABLE IF NOT EXISTS colis (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    numero_tracking        VARCHAR(20)  UNIQUE NOT NULL,
    expediteur_nom         VARCHAR(100) NOT NULL,
    expediteur_telephone   VARCHAR(20)  NOT NULL,
    expediteur_adresse     VARCHAR(200),
    destinataire_nom       VARCHAR(100) NOT NULL,
    destinataire_telephone VARCHAR(20)  NOT NULL,
    destinataire_adresse   VARCHAR(200),
    description            VARCHAR(255),
    poids                  FLOAT        NOT NULL,
    destination            VARCHAR(100) NOT NULL,
    origine                VARCHAR(100) NOT NULL,
    statut                 ENUM('recu', 'en_transit', 'arrive', 'livre') DEFAULT 'recu',
    convoyeur_id           INT          NOT NULL,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (convoyeur_id) REFERENCES users(id)
);

-- Table factures
CREATE TABLE IF NOT EXISTS factures (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    numero_facture  VARCHAR(20)  UNIQUE NOT NULL,
    colis_id        INT          NOT NULL,
    poids           FLOAT        NOT NULL,
    tarif_kg        FLOAT        NOT NULL,
    montant_total   FLOAT        NOT NULL,
    devise          VARCHAR(10)  DEFAULT 'FCFA',
    mode_paiement   ENUM('depart', 'destination') DEFAULT 'destination',
    statut_paiement ENUM('non_paye', 'paye')      DEFAULT 'non_paye',
    date_paiement   TIMESTAMP    NULL,
    paye_par        VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (colis_id) REFERENCES colis(id)
);

-- Table parametres
CREATE TABLE IF NOT EXISTS parametres (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    cle    VARCHAR(50)  UNIQUE NOT NULL,
    valeur VARCHAR(200) NOT NULL
);

-- ============================================================
-- Données initiales
-- ============================================================

-- Convoyeur de démonstration (mot de passe: Conv@2024)
INSERT INTO users (nom, prenom, email, password_hash, telephone, role) VALUES
('Koffi', 'Mensah', 'convoyeur@convoyage.tg',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBDJ3GqKjEzpCxkJX1UWfCWW',
 '+228 91 23 45 67', 'convoyeur');
-- Note: admin@convoyage.com (mdp: admin123) est créé automatiquement par app.py au démarrage
