'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config');
const { error } = require('../utils/response');

/**
 * authMiddleware — verifica el JWT emitido por el Core localmente.
 * No realiza ninguna petición HTTP al Core; la firma se valida de forma
 * matemática usando la JWT_SECRET compartida. Esto elimina latencia y
 * evita sobrecargar el Core con cada request.
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
