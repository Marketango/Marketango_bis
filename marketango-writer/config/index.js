'use strict';

require('dotenv').config();

const config = {
  coreApiUrl: process.env.CORE_API_URL,
  server: {
    port: parseInt(process.env.API_PORT || '4000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },
};

const required = ['CORE_API_URL'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
