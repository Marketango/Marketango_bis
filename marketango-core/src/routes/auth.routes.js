'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'team', 'client']),
  ],
  validate,
  AuthController.register,
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  AuthController.login,
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  AuthController.refresh,
);

router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
