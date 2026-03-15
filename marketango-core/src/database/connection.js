'use strict';

const mysql = require('mysql2/promise');
const config = require('../../config');
const logger = require('../utils/logger');

const pool = mysql.createPool(config.db);

pool.on('connection', () => {
  logger.debug('New MySQL connection established');
});

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
