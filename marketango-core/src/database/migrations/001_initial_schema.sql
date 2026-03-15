-- Marketango Core — Initial Schema Migration
-- Run with: node scripts/migrate.js

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','team','client') NOT NULL DEFAULT 'team',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_clients (
  user_id INT UNSIGNED NOT NULL,
  client_id INT UNSIGNED NOT NULL,
  role ENUM('admin','team','client') NOT NULL DEFAULT 'team',
  PRIMARY KEY (user_id, client_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id INT UNSIGNED NOT NULL,
  service VARCHAR(100) NOT NULL,
  account_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
