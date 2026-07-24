process.env.DB_PATH = ':memory:';

const request = require('supertest');
const createApp = require('../src/app');
const { getDb, closeDb } = require('../src/db/connection');
const { seed } = require('../src/db/seed');

let app;
let agent;

beforeEach(() => {
  seed(getDb());
  app = createApp();
  agent = request.agent(app); // agent keeps the session cookie between calls
});

afterEach(() => {
  closeDb();
});

async function login() {
  return agent
    .post('/api/auth/login')
    .send({ loginName: 'rs2user', password: 'Password' });
}

describe('POST /api/auth/login', () => {
  test('accepts valid credentials and starts a session', async () => {
    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ userId: 1, loginName: 'rs2user' });

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
  });

  test('rejects a wrong password', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ loginName: 'rs2user', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('rejects an unknown user', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ loginName: 'nobody', password: 'Password' });
    expect(res.status).toBe(401);
  });

  test.each([
    {},
    { loginName: 'rs2user' },
    { loginName: '', password: 'Password' },
    { loginName: 'a'.repeat(21), password: 'Password' },
    { loginName: 'rs2user', password: 'a'.repeat(21) },
    { loginName: 42, password: 'Password' },
  ])('returns 400 for malformed payload %p', async (payload) => {
    const res = await agent.post('/api/auth/login').send(payload);
    expect(res.status).toBe(400);
  });

  test('rate-limits repeated failed logins with 429', async () => {
    // Five wrong-password attempts are allowed (each returns 401 and counts).
    for (let i = 0; i < 5; i++) {
      const res = await agent
        .post('/api/auth/login')
        .send({ loginName: 'rs2user', password: 'wrong' });
      expect(res.status).toBe(401);
    }

    const blocked = await agent
      .post('/api/auth/login')
      .send({ loginName: 'rs2user', password: 'wrong' });
    expect(blocked.status).toBe(429);
  });
});

describe('POST /api/auth/logout', () => {
  test('ends the session', async () => {
    await login();
    await agent.post('/api/auth/logout');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});

describe('/api/basket', () => {
  test('rejects unauthenticated access', async () => {
    expect((await agent.get('/api/basket')).status).toBe(401);
    expect((await agent.post('/api/basket').send({})).status).toBe(401);
  });

  test('adds a product and returns it in the basket', async () => {
    await login();

    const add = await agent
      .post('/api/basket')
      .send({ name: 'Hamlet', type: 'Books', quantity: 2 });
    expect(add.status).toBe(201);
    expect(add.body.item).toMatchObject({ name: 'Hamlet', type: 'Books', quantity: 2 });

    const basket = await agent.get('/api/basket');
    expect(basket.status).toBe(200);
    expect(basket.body.items).toHaveLength(1);
  });

  test('returns 400 for an invalid payload', async () => {
    await login();

    const res = await agent
      .post('/api/basket')
      .send({ name: 'abc123', type: 'Books', quantity: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 404 when the product does not exist', async () => {
    await login();

    const res = await agent
      .post('/api/basket')
      .send({ name: 'Nonexistent', type: 'Books', quantity: 1 });
    expect(res.status).toBe(404);
  });

  test('returns 409 when the product was already bought', async () => {
    await login();

    await agent
      .post('/api/basket')
      .send({ name: 'Hamlet', type: 'Books', quantity: 1 });
    const res = await agent
      .post('/api/basket')
      .send({ name: 'Hamlet', type: 'Books', quantity: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already been bought/);
  });
});

describe('DELETE /api/basket/:id', () => {
  test('rejects unauthenticated access', async () => {
    expect((await agent.delete('/api/basket/1')).status).toBe(401);
  });

  test('removes a basket row and returns 204', async () => {
    await login();

    const add = await agent
      .post('/api/basket')
      .send({ name: 'Hamlet', type: 'Books', quantity: 1 });
    const basketId = add.body.item.basketId;

    const res = await agent.delete(`/api/basket/${basketId}`);
    expect(res.status).toBe(204);

    const basket = await agent.get('/api/basket');
    expect(basket.body.items).toHaveLength(0);
  });

  test('returns 404 for an unknown basket row', async () => {
    await login();
    expect((await agent.delete('/api/basket/12345')).status).toBe(404);
  });

  test('returns 400 for a non-numeric id', async () => {
    await login();
    expect((await agent.delete('/api/basket/abc')).status).toBe(400);
  });
});

describe('GET /api/products/suggestions', () => {
  test('rejects unauthenticated access', async () => {
    const res = await agent.get('/api/products/suggestions?name=Ha');
    expect(res.status).toBe(401);
  });

  test('returns prefix matches case-insensitively', async () => {
    await login();

    const res = await agent.get('/api/products/suggestions?name=ha');
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual([{ name: 'Hamlet', type: 'Books' }]);
  });

  test('filters by type when one is given', async () => {
    await login();

    // "D" matches Dune (Books) and Discovery (Music).
    const all = await agent.get('/api/products/suggestions?name=D');
    expect(all.body.suggestions).toHaveLength(2);

    const res = await agent.get('/api/products/suggestions?name=D&type=Music');
    expect(res.body.suggestions).toEqual([{ name: 'Discovery', type: 'Music' }]);
  });

  test('returns an empty list when nothing matches', async () => {
    await login();

    const res = await agent.get('/api/products/suggestions?name=zzz');
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual([]);
  });

  test.each([
    '/api/products/suggestions',                 // missing name
    '/api/products/suggestions?name=abc123',     // digits in prefix
    '/api/products/suggestions?name=Ha&type=Movies', // unknown type
  ])('returns 400 for %s', async (url) => {
    await login();
    expect((await agent.get(url)).status).toBe(400);
  });
});
