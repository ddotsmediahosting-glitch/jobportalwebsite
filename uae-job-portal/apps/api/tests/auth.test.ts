import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

describe('Auth API', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test#12345';
  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it('POST /auth/register – registers a seeker', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'SEEKER',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('POST /auth/register – rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'SEEKER',
      });

    expect(res.status).toBe(409);
  });

  it('POST /auth/register – rejects weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'weak@example.com',
        password: 'weakpass',
        confirmPassword: 'weakpass',
        role: 'SEEKER',
      });

    expect(res.status).toBe(422);
  });

  it('POST /auth/verify-email – verifies the email', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.emailOtp).toBeTruthy();

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: testEmail, otp: user!.emailOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /auth/login – logs in successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('POST /auth/login – rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('GET /auth/me – returns current user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('GET /auth/me – rejects missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh – rotates tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /auth/logout – invalidates refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });
});
