'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const writerController = require('../controllers/writer.controller');

const router = Router();

// Demo route — verifies JWT from Core and returns the decoded user payload.
// Accessible to all authenticated roles (admin, team, client).
router.get('/protected', authenticate, checkRole('admin', 'team', 'client'), writerController.protectedRoute);

module.exports = router;
