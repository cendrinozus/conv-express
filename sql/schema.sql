-- ============================================================
-- Système de Gestion de Convoyement de Colis
-- Base de données MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS convoyage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE convoyage_db;

-- Table des utilisateurs (convoyeurs et admins)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('admin', 'convoyeur') NOT NULL DEFAULT 'convoyeur',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des clients
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Togo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des tarifs par tranche de poids
CREATE TABLE tarifs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poids_min DECIMAL(10,2) NOT NULL COMMENT 'kg',
    poids_max DECIMAL(10,2) NOT NULL COMMENT 'kg',
    prix_par_kg DECIMAL(10,2) NOT NULL COMMENT 'FCFA',
    description VARCHAR(255),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des colis
CREATE TABLE colis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_suivi VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    poids DECIMAL(10,2) NOT NULL COMMENT 'en kg',
    dimensions VARCHAR(100) COMMENT 'LxlxH en cm',
    fragile BOOLEAN DEFAULT FALSE,
    ville_depart VARCHAR(100) NOT NULL,
    ville_destination VARCHAR(100) NOT NULL,
    adresse_destination TEXT,
    client_expediteur_id INT NOT NULL,
    nom_destinataire VARCHAR(200) NOT NULL,
    telephone_destinataire VARCHAR(20) NOT NULL,
    convoyeur_id INT NOT NULL,
    statut ENUM('en_attente', 'en_transit', 'arrive', 'livre', 'retourne') DEFAULT 'en_attente',
    date_reception TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_depart TIMESTAMP NULL,
    date_arrivee_prevue DATE NULL,
    date_livraison TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_expediteur_id) REFERENCES clients(id),
    FOREIGN KEY (convoyeur_id) REFERENCES users(id)
);

-- Table des factures
CREATE TABLE factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    colis_id INT NOT NULL,
    client_id INT NOT NULL,
    montant_ht DECIMAL(10,2) NOT NULL,
    taux_tva DECIMAL(5,2) DEFAULT 18.00,
    montant_tva DECIMAL(10,2) NOT NULL,
    montant_ttc DECIMAL(10,2) NOT NULL,
    mode_paiement ENUM('depart', 'destination') NOT NULL DEFAULT 'depart',
    statut ENUM('emise', 'payee', 'annulee') DEFAULT 'emise',
    date_emission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_paiement TIMESTAMP NULL,
    date_echeance DATE NULL,
    notes TEXT,
    pdf_path VARCHAR(500),
    email_envoye BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (colis_id) REFERENCES colis(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Table des paiements
CREATE TABLE paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facture_id INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    mode ENUM('especes', 'mobile_money', 'virement', 'cheque') NOT NULL,
    reference_paiement VARCHAR(100),
    lieu ENUM('depart', 'destination') NOT NULL,
    recu_par INT COMMENT 'ID du convoyeur qui a reçu le paiement',
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (facture_id) REFERENCES factures(id),
    FOREIGN KEY (recu_par) REFERENCES users(id)
);

-- Table des notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('email', 'sms') NOT NULL,
    destinataire VARCHAR(200) NOT NULL,
    sujet VARCHAR(255),
    message TEXT NOT NULL,
    statut ENUM('en_attente', 'envoye', 'echec') DEFAULT 'en_attente',
    reference_id INT,
    reference_type VARCHAR(50),
    tentatives INT DEFAULT 0,
    date_envoi TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Données initiales
-- ============================================================

-- Tarifs par défaut (FCFA)
INSERT INTO tarifs (poids_min, poids_max, prix_par_kg, description) VALUES
(0.00, 1.00, 1500.00, 'Très léger (0-1 kg)'),
(1.01, 5.00, 1200.00, 'Léger (1-5 kg)'),
(5.01, 10.00, 1000.00, 'Moyen (5-10 kg)'),
(10.01, 20.00, 800.00, 'Lourd (10-20 kg)'),
(20.01, 50.00, 600.00, 'Très lourd (20-50 kg)'),
(50.01, 999.99, 500.00, 'Extrêmement lourd (>50 kg)');

-- Admin par défaut (mot de passe: Admin@2024)
INSERT INTO users (nom, prenom, email, mot_de_passe, telephone, role) VALUES
('Admin', 'Système', 'admin@convoyage.tg', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBDJ3GqKjEzpCxkJX1UWfCWW', '+228 90 00 00 00', 'admin');

-- Convoyeur de démonstration (mot de passe: Conv@2024)
INSERT INTO users (nom, prenom, email, mot_de_passe, telephone, role) VALUES
('Koffi', 'Mensah', 'convoyeur@convoyage.tg', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBDJ3GqKjEzpCxkJX1UWfCWW', '+228 91 23 45 67', 'convoyeur');

-- Clients de démonstration
INSERT INTO clients (nom, prenom, email, telephone, adresse, ville) VALUES
('Adzoa', 'Akuété', 'adzoa@example.com', '+228 92 11 22 33', 'Quartier Bé, Rue 12', 'Lomé'),
('Kokou', 'Dossou', 'kokou@example.com', '+228 93 44 55 66', 'Agbalepedogan', 'Lomé'),
('Yawa', 'Fiagbe', 'yawa@example.com', '+228 94 77 88 99', 'Centre-ville', 'Kpalimé');
