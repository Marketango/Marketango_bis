'use strict';

const { error } = require('../utils/response');

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
