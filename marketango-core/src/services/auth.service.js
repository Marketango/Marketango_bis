'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const UserModel = require('../models/user.model');

const BCRYPT_ROUNDS = 12;

function signAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

async function register(email, password, role = 'team') {
  const existing = await UserModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return UserModel.create({ email, passwordHash, role });
}

async function login(email, password) {
  const user = await UserModel.findByEmail(email);
  if (!user || user.status === 'inactive') {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

async function refresh(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const user = await UserModel.findById(decoded.id);
  if (!user || user.status === 'inactive') {
    const err = new Error('User not found or inactive');
    err.statusCode = 401;
    throw err;
  }

  return { accessToken: signAccessToken(user) };
}

module.exports = { register, login, refresh };
