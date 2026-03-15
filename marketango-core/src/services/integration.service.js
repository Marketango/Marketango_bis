'use strict';

const IntegrationModel = require('../models/integration.model');
const ClientService = require('./client.service');

async function getByClient(clientId) {
  await ClientService.getById(clientId);
  return IntegrationModel.findByClient(clientId);
}

async function create(clientId, data) {
  await ClientService.getById(clientId);
  return IntegrationModel.create({ clientId, ...data });
}

module.exports = { getByClient, create };
