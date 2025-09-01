import request from 'supertest';
import app from '../index';

describe('Health Endpoint', () => {
  it('should return 200 OK with correct JSON payload', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});