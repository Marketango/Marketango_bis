'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

const router = Router();

router.use(authenticate, checkRole('admin'));

router.get('/', UserController.getAll);

router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    body('role').optional().isIn(['admin', 'team', 'client']),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  UserController.update,
);

router.delete('/:id', [param('id').isInt({ min: 1 })], validate, UserController.remove);

module.exports = router;
