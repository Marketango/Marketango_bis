'use strict';

const { error } = require('../utils/response');

/**
 * checkRole — restringe el acceso a rutas según el rol que viene
 * en el payload del JWT emitido por el Core (admin | team | client).
 *
 * Uso: checkRole('admin', 'team')
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
}

module.exports = { checkRole };
