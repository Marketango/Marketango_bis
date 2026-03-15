'use strict';

const { Router } = require('express');
const writerRoutes = require('./writer.routes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/writer', writerRoutes);

module.exports = router;
