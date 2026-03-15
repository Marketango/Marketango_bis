'use strict';

const { success } = require('../utils/response');

function protectedRoute(req, res) {
  return success(res, {
    message: 'Access granted to Writer module',
    user: req.user,
  });
}

module.exports = { protectedRoute };
