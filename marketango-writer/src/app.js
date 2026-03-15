'use strict';

const express = require('express');
const cors = require('cors');
const config = require('../config');
const { generalLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const logger = require('./utils/logger');
const { error } = require('./utils/response');

const app = express();

// CORS — whitelist from config
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// General rate limiter
app.use(generalLimiter);

// Root
app.get('/', (req, res) => {
  res.json({ service: 'marketango-writer', status: 'ok', api: '/api/v1' });
});

// API routes
app.use('/api/v1', routes);

// 404
app.use((req, res) => {
  return error(res, `Route ${req.method} ${req.path} not found`, 404);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  return error(res, 'Internal server error', 500);
});

module.exports = app;
