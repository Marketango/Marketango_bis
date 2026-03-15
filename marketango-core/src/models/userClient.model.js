'use strict';

const { query } = require('../database/connection');

async function assign(userId, clientId, role = 'team') {
  await query(
    'INSERT INTO user_clients (user_id, client_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
    [userId, clientId, role],
  );
}

async function findByUser(userId) {
  return query(
    `SELECT c.*, uc.role AS user_role
     FROM clients c
     JOIN user_clients uc ON c.id = uc.client_id
     WHERE uc.user_id = ?`,
    [userId],
  );
}

async function remove(userId, clientId) {
  await query('DELETE FROM user_clients WHERE user_id = ? AND client_id = ?', [userId, clientId]);
}

module.exports = { assign, findByUser, remove };
