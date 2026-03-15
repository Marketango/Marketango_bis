'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config');
const { error } = require('../utils/response');

/**
 * authenticate — valida el JWT emitido por el Core localmente.
 * La firma se verifica con el JWT_SECRET compartido entre Core y
 * todos los servicios del ecosistema (writer, hosting, ads, etc.).
 *
 * Inyecta en req.user: { id, role, email }
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired', 401);
    }
    return error(res, 'Invalid token', 401);
  }
}

module.exports = { authenticate };
