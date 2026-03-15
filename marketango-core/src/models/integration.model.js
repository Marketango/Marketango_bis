'use strict';

const { query } = require('../database/connection');

async function findByClient(clientId) {
  return query(
    'SELECT id, client_id, service, account_id, metadata, created_at FROM integrations WHERE client_id = ? ORDER BY created_at DESC',
    [clientId],
  );
}

async function findById(id) {
  const rows = await query(
    'SELECT id, client_id, service, account_id, metadata, created_at FROM integrations WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

async function create({ clientId, service, accountId, accessToken, refreshToken, metadata }) {
  const result = await query(
    'INSERT INTO integrations (client_id, service, account_id, access_token, refresh_token, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    [clientId, service, accountId || null, accessToken || null, refreshToken || null, metadata ? JSON.stringify(metadata) : null],
  );
  return findById(result.insertId);
}

module.exports = { findByClient, findById, create };
