'use strict';

const ClientModel = require('../models/client.model');

async function getAll() {
  return ClientModel.findAll();
}

async function getById(id) {
  const client = await ClientModel.findById(id);
  if (!client) {
    const err = new Error('Client not found');
    err.statusCode = 404;
    throw err;
  }
  return client;
}

async function create(data) {
  return ClientModel.create(data);
}

async function update(id, fields) {
  await getById(id);
  return ClientModel.update(id, fields);
}

async function remove(id) {
  await getById(id);
  await ClientModel.remove(id);
}

module.exports = { getAll, getById, create, update, remove };
