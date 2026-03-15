'use strict';

require('dotenv').config();

const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  server: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },
};

const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
