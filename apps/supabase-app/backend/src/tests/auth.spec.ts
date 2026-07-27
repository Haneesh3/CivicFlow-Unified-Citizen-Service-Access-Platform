import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth routes', () => {
  it('returns 400 when signup payload is invalid', async () => {
    const response = await request(app).post('/api/auth/signup').send({ email: 'invalid' });
    expect(response.status).toBe(400);
  });
});
