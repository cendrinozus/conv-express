-- Script d'initialisation de la base de données Convoyage Express
-- MySQL 5.7+ / MariaDB 10.3+

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS convoyage_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur de l'application
CREATE USER IF NOT EXISTS 'convoyage_user'@'localhost'
    IDENTIFIED BY 'convoyage_pass';

-- Donner les droits nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
    ON convoyage_db.* TO 'convoyage_user'@'localhost';

FLUSH PRIVILEGES;

USE convoyage_db;

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'convoyeur', 'client') DEFAULT 'client',
    actif BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table colis
CREATE TABLE IF NOT EXISTS colis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_tracking VARCHAR(20) UNIQUE NOT NULL,
    expediteur_nom VARCHAR(100) NOT NULL,
    expediteur_telephone VARCHAR(20) NOT NULL,
    expediteur_adresse VARCHAR(200),
    destinataire_nom VARCHAR(100) NOT NULL,
    destinataire_telephone VARCHAR(20) NOT NULL,
    destinataire_adresse VARCHAR(200),
    description VARCHAR(255),
    poids FLOAT NOT NULL,
    destination VARCHAR(100) NOT NULL,
    origine VARCHAR(100) NOT NULL,
    statut ENUM('recu', 'en_transit', 'arrive', 'livre') DEFAULT 'recu',
    convoyeur_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (convoyeur_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_tracking (numero_tracking),
    INDEX idx_statut (statut),
    INDEX idx_convoyeur (convoyeur_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table factures
CREATE TABLE IF NOT EXISTS factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_facture VARCHAR(30) UNIQUE NOT NULL,
    colis_id INT NOT NULL,
    poids FLOAT NOT NULL,
    tarif_kg FLOAT NOT NULL,
    montant_total FLOAT NOT NULL,
    devise VARCHAR(10) DEFAULT 'FCFA',
    mode_paiement ENUM('depart', 'destination') DEFAULT 'destination',
    statut_paiement ENUM('non_paye', 'paye') DEFAULT 'non_paye',
    date_paiement DATETIME,
    paye_par VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (colis_id) REFERENCES colis(id) ON DELETE CASCADE,
    INDEX idx_numero (numero_facture),
    INDEX idx_statut_paiement (statut_paiement),
    INDEX idx_colis (colis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données de test
-- Mot de passe: admin123 (haché avec werkzeug)
INSERT IGNORE INTO users (nom, prenom, email, telephone, password_hash, role) VALUES
('Administrateur', 'Système', 'admin@convoyage.com', '+228 90 00 00 01',
 'pbkdf2:sha256:600000$abc123$hashvalue_change_this', 'admin'),
('Kofi', 'Agbeko', 'kofi@convoyage.com', '+228 91 11 22 33',
 'pbkdf2:sha256:600000$abc123$hashvalue_change_this', 'convoyeur');

-- Note: Les mots de passe seront générés correctement au premier démarrage de Flask
SELECT 'Base de données initialisée avec succès!' AS message;
