// End-to-end API tests. They need MySQL running and the database created (npm run db:init).
//   npm test
// The tests create their own temporary users/products and delete them again afterwards.
// If the database is not reachable the whole file is skipped with a clear message.
const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const PASSWORD = 'TestPass123';
const state = {
  server: null,
  base: '',
  pool: null,
  skip: '',
  userEmail: `test.user.${suffix}@example.com`,
  otherEmail: `test.other.${suffix}@example.com`,
  adminEmail: `test.admin.${suffix}@example.com`,
  userToken: '',
  otherToken: '',
  adminToken: '',
  productId: null,
  orderId: null,
};

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${state.base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json, data: json.data };
}

test.before(async () => {
  try {
    env.assertConfig();
    state.pool = require('../src/config/db');
    await state.pool.query('SELECT 1 FROM products LIMIT 1');
  } catch (err) {
    state.skip = `Database not ready (${err.code || err.message}). Start MySQL and run "npm run db:init".`;
    return;
  }
  const app = require('../src/app');
  await new Promise((resolve) => {
    state.server = app.listen(0, resolve);
  });
  state.base = `http://127.0.0.1:${state.server.address().port}/api`;

  // Create an admin directly in the database (there is no public admin registration).
  const hash = await bcrypt.hash(PASSWORD, 4);
  await state.pool.execute("INSERT INTO users (name, email, password_hash, role) VALUES ('Test Admin', ?, ?, 'ADMIN')", [
    state.adminEmail,
    hash,
  ]);
});

test.after(async () => {
  if (state.pool && !state.skip) {
    const emails = [state.userEmail, state.otherEmail, state.adminEmail];
    const [users] = await state.pool.query('SELECT id FROM users WHERE email IN (?)', [emails]);
    const ids = users.map((u) => u.id);
    if (ids.length) {
      await state.pool.query('DELETE FROM orders WHERE user_id IN (?)', [ids]);
      await state.pool.query('DELETE FROM users WHERE id IN (?)', [ids]);
    }
    if (state.productId) await state.pool.execute('DELETE FROM products WHERE id = ?', [state.productId]);
  }
  if (state.server) await new Promise((resolve) => state.server.close(resolve));
  if (state.pool) await state.pool.end();
});

const guard = (name, fn) =>
  test(name, async (t) => {
    if (state.skip) return t.skip(state.skip);
    return fn(t);
  });

guard('health check reports a connected database', async () => {
  const res = await api('GET', '/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.database, 'connected');
});

guard('register creates a USER and rejects duplicates and weak passwords', async () => {
  const created = await api('POST', '/auth/register', { body: { name: 'Test User', email: state.userEmail, password: PASSWORD } });
  assert.equal(created.status, 201);
  assert.equal(created.data.user.role, 'USER');
  assert.ok(created.data.token);
  state.userToken = created.data.token;

  const duplicate = await api('POST', '/auth/register', { body: { name: 'Test User', email: state.userEmail, password: PASSWORD } });
  assert.equal(duplicate.status, 409);

  const weak = await api('POST', '/auth/register', { body: { name: 'X', email: 'bad', password: '1' } });
  assert.equal(weak.status, 400);
  assert.ok(weak.body.errors.password);

  const other = await api('POST', '/auth/register', { body: { name: 'Other User', email: state.otherEmail, password: PASSWORD } });
  state.otherToken = other.data.token;
});

guard('register ignores a role sent by the client and stores a bcrypt hash', async () => {
  const [rows] = await state.pool.execute('SELECT role, password_hash FROM users WHERE email = ?', [state.userEmail]);
  assert.equal(rows[0].role, 'USER');
  assert.notEqual(rows[0].password_hash, PASSWORD);
  assert.match(rows[0].password_hash, /^\$2[aby]\$/);
});

guard('login works with the right password only; /me needs a valid token', async () => {
  const wrong = await api('POST', '/auth/login', { body: { email: state.userEmail, password: 'WrongPass999' } });
  assert.equal(wrong.status, 401);

  const ok = await api('POST', '/auth/login', { body: { email: state.userEmail, password: PASSWORD } });
  assert.equal(ok.status, 200);
  const me = await api('GET', '/auth/me', { token: ok.data.token });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, state.userEmail);

  assert.equal((await api('GET', '/auth/me')).status, 401);
  assert.equal((await api('GET', '/auth/me', { token: 'not.a.token' })).status, 401);

  const admin = await api('POST', '/auth/login', { body: { email: state.adminEmail, password: PASSWORD } });
  assert.equal(admin.data.user.role, 'ADMIN');
  state.adminToken = admin.data.token;
});

guard('products are public to read but only admins can change them', async () => {
  const list = await api('GET', '/products');
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.data));

  const payload = {
    name: `Test Product ${suffix}`,
    description: 'A product created by the automated tests.',
    price: 19.99,
    category: 'TestCategory',
    imageUrl: '',
    stock: 5,
    rating: 4,
  };
  assert.equal((await api('POST', '/products', { body: payload })).status, 401);
  assert.equal((await api('POST', '/products', { token: state.userToken, body: payload })).status, 403);
  assert.equal((await api('POST', '/products', { token: state.adminToken, body: { ...payload, price: -1 } })).status, 400);

  const created = await api('POST', '/products', { token: state.adminToken, body: payload });
  assert.equal(created.status, 201);
  state.productId = created.data.id;
  assert.equal(created.data.price, 19.99);

  const updated = await api('PUT', `/products/${state.productId}`, { token: state.adminToken, body: { ...payload, price: 20.5 } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.price, 20.5);

  const search = await api('GET', `/products?search=${encodeURIComponent(payload.name)}&sort=price_asc`);
  assert.equal(search.data.length, 1);
  const byCategory = await api('GET', '/products?category=TestCategory');
  assert.ok(byCategory.data.every((p) => p.category === 'TestCategory'));
  assert.equal((await api('GET', '/products/999999999')).status, 404);
});

guard('cart: requires login, enforces stock and quantity rules', async () => {
  assert.equal((await api('GET', '/cart')).status, 401);

  const tooMany = await api('POST', '/cart', { token: state.userToken, body: { productId: state.productId, quantity: 6 } });
  assert.equal(tooMany.status, 409);

  const added = await api('POST', '/cart', { token: state.userToken, body: { productId: state.productId, quantity: 2 } });
  assert.equal(added.status, 201);
  assert.equal(added.data.itemCount, 2);
  assert.equal(added.data.total, 41); // 2 x 20.50, price comes from the database

  const overflow = await api('POST', '/cart', { token: state.userToken, body: { productId: state.productId, quantity: 4 } });
  assert.equal(overflow.status, 409);

  const set = await api('PUT', `/cart/${state.productId}`, { token: state.userToken, body: { quantity: 3 } });
  assert.equal(set.data.itemCount, 3);
  assert.equal((await api('PUT', `/cart/${state.productId}`, { token: state.userToken, body: { quantity: 0 } })).status, 400);
  assert.equal((await api('PUT', `/cart/${state.productId}`, { token: state.userToken, body: { quantity: 99 } })).status, 409);

  // Carts are private: the other user's cart is empty.
  const otherCart = await api('GET', '/cart', { token: state.otherToken });
  assert.equal(otherCart.data.items.length, 0);
});

guard('checkout: validates input, creates the order and reduces stock', async () => {
  const bad = await api('POST', '/orders', { token: state.userToken, body: { fullName: '', phone: 'x', address: 'y' } });
  assert.equal(bad.status, 400);

  const emptyCart = await api('POST', '/orders', {
    token: state.otherToken,
    body: { fullName: 'Other User', phone: '9876543210', address: '1 Test Street, Test City' },
  });
  assert.equal(emptyCart.status, 400);

  const order = await api('POST', '/orders', {
    token: state.userToken,
    body: { fullName: 'Test User', phone: '9876543210', address: '1 Test Street, Test City', total: 1, items: [] },
  });
  assert.equal(order.status, 201);
  state.orderId = order.data.id;
  assert.equal(order.data.status, 'PLACED');
  assert.equal(order.data.total, 61.5); // 3 x 20.50, the "total: 1" sent by the client is ignored
  assert.equal(order.data.items.length, 1);

  const product = await api('GET', `/products/${state.productId}`);
  assert.equal(product.data.stock, 2); // 5 - 3

  const cart = await api('GET', '/cart', { token: state.userToken });
  assert.equal(cart.data.items.length, 0);
});

guard('checkout fails safely when stock is not enough (nothing is changed)', async () => {
  await api('POST', '/cart', { token: state.userToken, body: { productId: state.productId, quantity: 2 } });
  // Someone else buys most of the stock first.
  await state.pool.execute('UPDATE products SET stock = 1 WHERE id = ?', [state.productId]);
  const [before] = await state.pool.execute('SELECT COUNT(*) AS c FROM orders');

  const res = await api('POST', '/orders', {
    token: state.userToken,
    body: { fullName: 'Test User', phone: '9876543210', address: '1 Test Street, Test City' },
  });
  assert.equal(res.status, 409);

  const [after] = await state.pool.execute('SELECT COUNT(*) AS c FROM orders');
  assert.equal(after[0].c, before[0].c);
  const product = await api('GET', `/products/${state.productId}`);
  assert.equal(product.data.stock, 1);

  await api('DELETE', '/cart', { token: state.userToken });
  await state.pool.execute('UPDATE products SET stock = 2 WHERE id = ?', [state.productId]);
});

guard('orders are private to their owner', async () => {
  const mine = await api('GET', '/orders', { token: state.userToken });
  assert.equal(mine.data.length, 1);
  assert.equal((await api('GET', `/orders/${state.orderId}`, { token: state.userToken })).status, 200);

  const others = await api('GET', '/orders', { token: state.otherToken });
  assert.equal(others.data.length, 0);
  assert.equal((await api('GET', `/orders/${state.orderId}`, { token: state.otherToken })).status, 404);
  assert.equal((await api('POST', `/orders/${state.orderId}/cancel`, { token: state.otherToken })).status, 404);
});

guard('admin endpoints reject normal users and anonymous callers', async () => {
  assert.equal((await api('GET', '/admin/orders')).status, 401);
  assert.equal((await api('GET', '/admin/orders', { token: state.userToken })).status, 403);
  assert.equal((await api('GET', '/admin/stats', { token: state.userToken })).status, 403);
  assert.equal(
    (await api('PATCH', `/admin/orders/${state.orderId}/status`, { token: state.userToken, body: { status: 'SHIPPED' } })).status,
    403
  );
});

guard('admin can list orders, see stats and update statuses', async () => {
  const stats = await api('GET', '/admin/stats', { token: state.adminToken });
  assert.equal(stats.status, 200);
  assert.ok(stats.data.totalOrders >= 1);
  assert.equal(stats.data.activity.length, 7);

  const list = await api('GET', '/admin/orders', { token: state.adminToken });
  assert.ok(list.data.some((o) => o.id === state.orderId));

  const invalid = await api('PATCH', `/admin/orders/${state.orderId}/status`, { token: state.adminToken, body: { status: 'LOST' } });
  assert.equal(invalid.status, 400);

  const shipped = await api('PATCH', `/admin/orders/${state.orderId}/status`, { token: state.adminToken, body: { status: 'SHIPPED' } });
  assert.equal(shipped.status, 200);
  assert.equal(shipped.data.status, 'SHIPPED');

  // A customer can only cancel while the order is still PLACED.
  const cancel = await api('POST', `/orders/${state.orderId}/cancel`, { token: state.userToken });
  assert.equal(cancel.status, 409);
});

guard('cancelling an order returns its items to stock and cannot be undone', async () => {
  const cancelled = await api('PATCH', `/admin/orders/${state.orderId}/status`, { token: state.adminToken, body: { status: 'CANCELLED' } });
  assert.equal(cancelled.status, 200);
  const product = await api('GET', `/products/${state.productId}`);
  assert.equal(product.data.stock, 5); // 2 left + 3 restored

  const reopen = await api('PATCH', `/admin/orders/${state.orderId}/status`, { token: state.adminToken, body: { status: 'PLACED' } });
  assert.equal(reopen.status, 409);
});

guard('deleting a product keeps old orders readable', async () => {
  const removed = await api('DELETE', `/products/${state.productId}`, { token: state.adminToken });
  assert.equal(removed.status, 200);
  state.productId = null;
  assert.equal((await api('GET', '/products/999999999')).status, 404);

  const order = await api('GET', `/orders/${state.orderId}`, { token: state.userToken });
  assert.equal(order.status, 200);
  assert.equal(order.data.items[0].productId, null);
  assert.match(order.data.items[0].productName, /Test Product/);
});

guard('unknown routes and bad JSON return JSON errors', async () => {
  const missing = await api('GET', '/does-not-exist');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.success, false);

  const response = await fetch(`${state.base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  assert.equal(response.status, 400);
});
