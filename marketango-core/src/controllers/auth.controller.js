'use strict';

const AuthService = require('../services/auth.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

async function register(req, res) {
  try {
    const { email, password, role } = req.body;
    const user = await AuthService.register(email, password, role);
    return success(res, { user }, 201);
  } catch (err) {
    logger.error('Register error:', err);
    return error(res, err.message, err.statusCode || 500);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return success(res, result);
  } catch (err) {
    logger.warn('Login failed:', { message: err.message });
    return error(res, err.message, err.statusCode || 500);
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refresh(refreshToken);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
}

function logout(req, res) {
  return success(res, { message: 'Logged out successfully' });
}

module.exports = { register, login, refresh, logout };
