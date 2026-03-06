import request from 'supertest';
import app from '../src/app';

describe('Jobs API (public)', () => {
  it('GET /jobs – returns paginated list', async () => {
    const res = await request(app).get('/api/v1/jobs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('limit');
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('GET /jobs – filters by emirate', async () => {
    const res = await request(app).get('/api/v1/jobs?emirate=DUBAI');
    expect(res.status).toBe(200);
    const { items } = res.body.data;
    for (const item of items) {
      expect(item.emirate).toBe('DUBAI');
    }
  });

  it('GET /jobs – filters by workMode', async () => {
    const res = await request(app).get('/api/v1/jobs?workMode=REMOTE');
    expect(res.status).toBe(200);
    const { items } = res.body.data;
    for (const item of items) {
      expect(item.workMode).toBe('REMOTE');
    }
  });

  it('GET /jobs – rejects invalid page', async () => {
    const res = await request(app).get('/api/v1/jobs?page=-1');
    expect(res.status).toBe(422);
  });

  it('GET /jobs/:slug – returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/v1/jobs/non-existent-job-slug');
    expect(res.status).toBe(404);
  });
});

describe('Categories API', () => {
  it('GET /categories – returns tree', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /categories/featured – returns featured', async () => {
    const res = await request(app).get('/api/v1/categories/featured');
    expect(res.status).toBe(200);
  });
});
