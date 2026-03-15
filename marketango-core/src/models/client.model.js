'use strict';

const { query } = require('../database/connection');

async function findAll() {
  return query('SELECT * FROM clients ORDER BY created_at DESC');
}

async function findById(id) {
  const rows = await query('SELECT * FROM clients WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function create({ name, domain, industry, status = 'active' }) {
  const result = await query(
    'INSERT INTO clients (name, domain, industry, status) VALUES (?, ?, ?, ?)',
    [name, domain || null, industry || null, status],
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const allowed = ['name', 'domain', 'industry', 'status'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (keys.length === 0) return findById(id);

  const setParts = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  await query(`UPDATE clients SET ${setParts} WHERE id = ?`, [...values, id]);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM clients WHERE id = ?', [id]);
}

module.exports = { findAll, findById, create, update, remove };
