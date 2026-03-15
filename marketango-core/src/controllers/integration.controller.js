'use strict';

const IntegrationService = require('../services/integration.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

async function getByClient(req, res) {
  try {
    const integrations = await IntegrationService.getByClient(req.params.id);
    return success(res, { integrations });
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

async function create(req, res) {
  try {
    const integration = await IntegrationService.create(req.params.id, req.body);
    return success(res, { integration }, 201);
  } catch (err) {
    logger.error('Create integration error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

module.exports = { getByClient, create };
