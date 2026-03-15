'use strict';

/**
 * Auth endpoint integration tests.
 * These run against the Express app in-memory (no real DB connection needed
 * because we mock the DB layer).
 */

process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test';
process.env.JWT_SECRET = 'test_secret_for_unit_tests_minimum_32_chars';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock the database connection so tests run without MySQL
jest.mock('../src/database/connection', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[{ '1': 1 }]]),
    on: jest.fn(),
  },
  query: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');
const bcrypt = require('bcrypt');

jest.mock('../src/models/user.model');

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 422 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'short' });
    expect(res.status).toBe(422);
  });

  it('returns 201 on successful registration', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      role: 'team',
      status: 'active',
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'securepassword' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('returns 409 when email is already registered', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'securepassword' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when user does not exist', async () => {
    UserModel.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when password is wrong', async () => {
    UserModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: await bcrypt.hash('correctpassword', 10),
      role: 'team',
      status: 'active',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns tokens on successful login', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    UserModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: hash,
      role: 'admin',
      status: 'active',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.role).toBe('admin');
  });
});

describe('GET /api/v1/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
