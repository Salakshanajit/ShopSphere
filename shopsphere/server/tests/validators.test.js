// Unit tests for the validation rules. They need no database: run with "npm test".
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseId,
  validateRegister,
  validateLogin,
  validateProduct,
  validateCartAdd,
  validateCartQuantity,
  validateCheckout,
  validateStatus,
} = require('../src/utils/validators');

const goodProduct = {
  name: 'Test Lamp',
  description: 'A small desk lamp for testing.',
  price: 499.5,
  category: 'Home',
  imageUrl: '/products/lamp.svg',
  stock: 10,
  rating: 4.5,
};

test('register: accepts valid data and normalises the email', () => {
  const { value, errors } = validateRegister({ name: ' Asha ', email: 'ASHA@Example.com ', password: 'secret123' });
  assert.equal(errors, null);
  assert.equal(value.email, 'asha@example.com');
  assert.equal(value.name, 'Asha');
});

test('register: rejects bad name, email and weak passwords', () => {
  assert.ok(validateRegister({ name: 'A', email: 'a@b.co', password: 'secret123' }).errors.name);
  assert.ok(validateRegister({ name: 'Asha', email: 'not-an-email', password: 'secret123' }).errors.email);
  assert.ok(validateRegister({ name: 'Asha', email: 'a@b.co', password: 'short1' }).errors.password);
  assert.ok(validateRegister({ name: 'Asha', email: 'a@b.co', password: 'onlyletters' }).errors.password);
  assert.ok(validateRegister({ name: 'Asha', email: 'a@b.co', password: '12345678' }).errors.password);
  assert.ok(validateRegister({ name: 'Asha', email: 'a@b.co', password: `a1${'x'.repeat(80)}` }).errors.password);
});

test('register: ignores a role sent by the client', () => {
  const { value } = validateRegister({ name: 'Asha', email: 'a@b.co', password: 'secret123', role: 'ADMIN' });
  assert.equal(value.role, undefined);
});

test('login: requires email and password', () => {
  assert.equal(validateLogin({ email: 'a@b.co', password: 'x' }).errors, null);
  const { errors } = validateLogin({});
  assert.ok(errors.email && errors.password);
});

test('product: accepts valid data', () => {
  const { value, errors } = validateProduct(goodProduct);
  assert.equal(errors, null);
  assert.equal(value.price, 499.5);
  assert.equal(value.stock, 10);
});

test('product: accepts numbers sent as strings (HTML forms)', () => {
  const { errors, value } = validateProduct({ ...goodProduct, price: '12.99', stock: '3', rating: '' });
  assert.equal(errors, null);
  assert.equal(value.price, 12.99);
  assert.equal(value.rating, 0);
});

test('product: rejects invalid price, stock, image URL and rating', () => {
  assert.ok(validateProduct({ ...goodProduct, price: 0 }).errors.price);
  assert.ok(validateProduct({ ...goodProduct, price: -5 }).errors.price);
  assert.ok(validateProduct({ ...goodProduct, price: 10.123 }).errors.price);
  assert.ok(validateProduct({ ...goodProduct, price: '' }).errors.price);
  assert.ok(validateProduct({ ...goodProduct, stock: -1 }).errors.stock);
  assert.ok(validateProduct({ ...goodProduct, stock: 1.5 }).errors.stock);
  assert.ok(validateProduct({ ...goodProduct, stock: '' }).errors.stock);
  assert.ok(validateProduct({ ...goodProduct, imageUrl: 'javascript:alert(1)' }).errors.imageUrl);
  assert.ok(validateProduct({ ...goodProduct, rating: 6 }).errors.rating);
  assert.ok(validateProduct({ ...goodProduct, name: '' }).errors.name);
  assert.ok(validateProduct({ ...goodProduct, description: 'short' }).errors.description);
});

test('product: image URL is optional', () => {
  assert.equal(validateProduct({ ...goodProduct, imageUrl: '' }).errors, null);
});

test('cart: validates product id and quantity', () => {
  assert.equal(validateCartAdd({ productId: 3 }).value.quantity, 1);
  assert.equal(validateCartAdd({ productId: '3', quantity: '2' }).errors, null);
  assert.ok(validateCartAdd({ productId: 'abc', quantity: 1 }).errors.productId);
  assert.ok(validateCartAdd({ productId: 3, quantity: 0 }).errors.quantity);
  assert.ok(validateCartAdd({ productId: 3, quantity: 1.5 }).errors.quantity);
  assert.ok(validateCartAdd({ productId: 3, quantity: 100 }).errors.quantity);
  assert.ok(validateCartQuantity({ quantity: -1 }).errors.quantity);
  assert.equal(validateCartQuantity({ quantity: 4 }).errors, null);
});

test('checkout: validates name, phone and address', () => {
  const good = { fullName: 'Asha Rao', phone: '+91 98765 43210', address: '12 Main Street, Springfield' };
  assert.equal(validateCheckout(good).errors, null);
  assert.ok(validateCheckout({ ...good, phone: 'abc' }).errors.phone);
  assert.ok(validateCheckout({ ...good, phone: '123' }).errors.phone);
  assert.ok(validateCheckout({ ...good, address: 'short' }).errors.address);
  assert.ok(validateCheckout({ ...good, fullName: '' }).errors.fullName);
});

test('order status: only the five known statuses are allowed', () => {
  for (const status of ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
    assert.equal(validateStatus({ status }).errors, null);
  }
  assert.equal(validateStatus({ status: 'shipped' }).value.status, 'SHIPPED');
  assert.ok(validateStatus({ status: 'LOST' }).errors.status);
  assert.ok(validateStatus({}).errors.status);
});

test('parseId: accepts positive integers only', () => {
  assert.equal(parseId('12'), 12);
  assert.throws(() => parseId('0'), { status: 400 });
  assert.throws(() => parseId('-3'), { status: 400 });
  assert.throws(() => parseId('1.5'), { status: 400 });
  assert.throws(() => parseId('abc'), { status: 400 });
});
