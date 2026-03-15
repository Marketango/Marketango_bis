'use strict';

const config = require('../../config');
const { error } = require('../utils/response');

/**
 * authenticate — valida el JWT llamando al Core (auth.agencia.com).
 *
 * El Core verifica la firma del token Y consulta la DB para confirmar
 * que el usuario existe y está activo. Esto garantiza que cualquier
 * cambio de estado (desactivación, cambio de rol) se refleja de
 * inmediato en todos los servicios sin esperar que expire el JWT.
 *
 * Inyecta en req.user: { id, role, email }
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const response = await fetch(`${config.coreApiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await response.json();

    if (!response.ok) {
      return error(res, body.message || 'Authentication failed', response.status);
    }

    req.user = body.data.user;
    next();
  } catch {
    return error(res, 'Authentication service unavailable', 503);
  }
}

module.exports = { authenticate };
