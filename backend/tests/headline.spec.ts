import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Express } from 'express';

// Increase default Jest timeout for in-memory MongoDB startup
jest.setTimeout(30000);

let app: Express;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  // Import server after setting env so session store and mongoose use memory server
  const serverModule = await import('../server');
  app = serverModule.default;

  // Ensure mongoose uses the same URI
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Headline endpoints', () => {
  const username = `testuser${Date.now().toString().slice(-4)}`;
  const email = `${username}@example.com`;
  const password = 'Password1';
  let token: string;

  test('registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username, email, password, displayName: 'Tester' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
    token = res.body.data.token;
  });

  test('updates headline for logged in user', async () => {
    const res = await request(app)
      .put('/headline')
      .set('Authorization', `Bearer ${token}`)
      .send({ headline: 'Hello from tests' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('headline', 'Hello from tests');
  });

  test('gets headline for logged in user', async () => {
    const res = await request(app)
      .get('/headline')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('headline', 'Hello from tests');
    expect(res.body.data).toHaveProperty('username', username);
  });
});
