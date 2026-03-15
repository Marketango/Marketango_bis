'use strict';

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const clientRoutes = require('./client.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);

module.exports = router;
