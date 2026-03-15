'use strict';

const UserService = require('../services/user.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

async function getAll(req, res) {
  try {
    const users = await UserService.getAll();
    return success(res, { users });
  } catch (err) {
    logger.error('Get users error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

async function update(req, res) {
  try {
    const user = await UserService.update(req.params.id, req.body);
    return success(res, { user });
  } catch (err) {
    logger.error('Update user error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

async function remove(req, res) {
  try {
    await UserService.remove(req.params.id);
    return success(res, { message: 'User deleted' });
  } catch (err) {
    logger.error('Delete user error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

module.exports = { getAll, update, remove };
