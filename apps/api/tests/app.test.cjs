const request = require('../../../node_modules/supertest');
const { app } = require('../dist/src/app.js');

describe('health and docs', () => {
  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('serves swagger', async () => {
    const res = await request(app).get('/api/docs');
    expect([200, 301, 302]).toContain(res.status);
  });
});


