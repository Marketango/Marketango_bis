'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('../config');
const logger = require('./utils/logger');
const { pool } = require('./database/connection');

const PORT = config.server.port;

async function start() {
  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`Marketango Core API running on port ${PORT} [${config.server.env}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
