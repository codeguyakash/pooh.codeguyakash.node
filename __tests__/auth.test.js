const request = require('supertest');
const app = require('../app'); // yeh teri Express app file ka export hona chahiye

describe('POST /api/v1/auth/login', () => {
  it('should login user with valid credentials', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'codeguyakash.dev@gmail.com',
      password: 'Hello@#123',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    expect(response.body.message).toBe('Login Successfully');
  });

  it('should return 404 for non-existing user', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'fakeuser@example.com',
      password: 'irrelevant',
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('should return 401 for wrong password', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'codeguyakash.dev@gmail.com',
      password: 'wrong-password',
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid user credentials');
  });

  it('should return 400 if fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: '',
      password: '',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Please provide email and password');
  });
});
