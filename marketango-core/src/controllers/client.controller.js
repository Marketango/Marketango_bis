'use strict';

const ClientService = require('../services/client.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

async function getAll(req, res) {
  try {
    const clients = await ClientService.getAll();
    return success(res, { clients });
  } catch (err) {
    logger.error('Get clients error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

async function getById(req, res) {
  try {
    const client = await ClientService.getById(req.params.id);
    return success(res, { client });
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

async function create(req, res) {
  try {
    const client = await ClientService.create(req.body);
    return success(res, { client }, 201);
  } catch (err) {
    logger.error('Create client error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

async function update(req, res) {
  try {
    const client = await ClientService.update(req.params.id, req.body);
    return success(res, { client });
  } catch (err) {
    logger.error('Update client error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

async function remove(req, res) {
  try {
    await ClientService.remove(req.params.id);
    return success(res, { message: 'Client deleted' });
  } catch (err) {
    logger.error('Delete client error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

module.exports = { getAll, getById, create, update, remove };
