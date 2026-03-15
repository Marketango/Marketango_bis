'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('../config');
const logger = require('./utils/logger');

const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`Marketango Writer API running on port ${PORT} [${config.server.env}]`);
});
