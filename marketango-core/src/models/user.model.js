'use strict';

const { query } = require('../database/connection');

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(
    'SELECT id, email, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

async function findAll() {
  return query('SELECT id, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC');
}

async function create({ email, passwordHash, role = 'team' }) {
  const result = await query(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    [email, passwordHash, role],
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const allowed = ['role', 'status'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (keys.length === 0) return findById(id);

  const setParts = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  await query(`UPDATE users SET ${setParts} WHERE id = ?`, [...values, id]);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = { findByEmail, findById, findAll, create, update, remove };
