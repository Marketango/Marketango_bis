'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const ClientController = require('../controllers/client.controller');
const IntegrationController = require('../controllers/integration.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

const router = Router();

router.use(authenticate);

router.get('/', checkRole('admin', 'team'), ClientController.getAll);

router.post(
  '/',
  checkRole('admin'),
  [body('name').notEmpty().trim(), body('domain').optional().isFQDN(), body('industry').optional().trim()],
  validate,
  ClientController.create,
);

router.get('/:id', checkRole('admin', 'team'), [param('id').isInt({ min: 1 })], validate, ClientController.getById);

router.put(
  '/:id',
  checkRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().notEmpty().trim(),
    body('domain').optional().isFQDN(),
    body('industry').optional().trim(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  ClientController.update,
);

router.delete(
  '/:id',
  checkRole('admin'),
  [param('id').isInt({ min: 1 })],
  validate,
  ClientController.remove,
);

// Integrations nested under clients
router.get(
  '/:id/integrations',
  checkRole('admin', 'team'),
  [param('id').isInt({ min: 1 })],
  validate,
  IntegrationController.getByClient,
);

router.post(
  '/:id/integrations',
  checkRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('service').notEmpty().trim(),
    body('accountId').optional().trim(),
    body('accessToken').optional(),
    body('refreshToken').optional(),
    body('metadata').optional().isObject(),
  ],
  validate,
  IntegrationController.create,
);

module.exports = router;
