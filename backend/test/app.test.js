// explicitly set test environment so helpers skip real services
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Backend API basic functionality', () => {
  it('should respond to root with running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/University Housing Server is Running/);
  });

  it('login endpoint should require auth token', async () => {
    const res = await request(app).post('/api/auth/login');
    expect(res.statusCode).toBe(401);
  });

  it('get housings should return array (empty list by default)', async () => {
    const res = await request(app).get('/api/housing');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
