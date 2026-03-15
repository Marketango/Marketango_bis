#!/usr/bin/env node
'use strict';

require('dotenv').config();

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function migrate() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  });

  try {
    const sqlFile = path.join(__dirname, '../src/database/migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Running migration: 001_initial_schema.sql');
    await connection.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
