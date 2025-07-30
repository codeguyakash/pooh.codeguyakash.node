const request = require('supertest');
const app = require('../app');

describe('POST /api/v1/auth/login', () => {
  it('✅ should return 200 and token for valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('❌ should return 401 for incorrect password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('AUTH_INVALID_PASSWORD');
  });

  it('❌ should return 401 for non-existent user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nouser@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('AUTH_INVALID_USER');
  });

  it('❌ should return 400 for missing email or password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: '',
      password: '',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('AUTH_MISSING_FIELDS');
  });
});
