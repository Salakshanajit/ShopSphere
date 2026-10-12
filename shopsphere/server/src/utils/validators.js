// Server-side validation. Every function returns { value, errors }.
// "errors" is null when the input is valid, otherwise an object { field: message }.
const HttpError = require('./httpError');
const { ORDER_STATUSES } = require('./constants');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|\/)[^\s]+$/i;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// Converts a value to a number, or NaN when it is empty / not numeric.
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

const result = (value, errors) => ({
  value,
  errors: Object.keys(errors).length ? errors : null,
});

function parseId(raw, label = 'id') {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid ${label}.`);
  }
  return id;
}

function validateRegister(body = {}) {
  const errors = {};
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }
  if (!EMAIL_RE.test(email) || email.length > 255) {
    errors.email = 'Enter a valid email address.';
  }
  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (Buffer.byteLength(password) > 72) {
    errors.password = 'Password must be 72 bytes or fewer.';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }
  return result({ name, email, password }, errors);
}

function validateLogin(body = {}) {
  const errors = {};
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return result({ email, password }, errors);
}

function validateProduct(body = {}) {
  const errors = {};
  const name = text(body.name);
  const description = text(body.description);
  const category = text(body.category);
  const imageUrl = text(body.imageUrl);
  const price = toNumber(body.price);
  const stock = toNumber(body.stock);
  const hasRating = !(body.rating === undefined || body.rating === null || body.rating === '');
  const rating = hasRating ? toNumber(body.rating) : 0;

  if (name.length < 2 || name.length > 150) {
    errors.name = 'Name must be between 2 and 150 characters.';
  }
  if (description.length < 10 || description.length > 2000) {
    errors.description = 'Description must be between 10 and 2000 characters.';
  }
  if (category.length < 2 || category.length > 60) {
    errors.category = 'Category must be between 2 and 60 characters.';
  }
  if (!Number.isFinite(price) || price <= 0 || price > 9999999.99) {
    errors.price = 'Price must be a number greater than 0.';
  } else if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) {
    errors.price = 'Price can have at most 2 decimal places.';
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
    errors.stock = 'Stock must be a whole number from 0 to 1,000,000.';
  }
  if (imageUrl && (imageUrl.length > 500 || !URL_RE.test(imageUrl))) {
    errors.imageUrl = 'Image URL must start with http://, https:// or / and be under 500 characters.';
  }
  if (hasRating && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    errors.rating = 'Rating must be a number between 0 and 5.';
  }

  return result(
    {
      name,
      description,
      category,
      imageUrl,
      price: Math.round(price * 100) / 100,
      stock,
      rating: Math.round(rating * 10) / 10,
    },
    errors
  );
}

function validateCartAdd(body = {}) {
  const errors = {};
  const productId = toNumber(body.productId);
  const quantity = body.quantity === undefined ? 1 : toNumber(body.quantity);
  if (!Number.isInteger(productId) || productId <= 0) errors.productId = 'A valid productId is required.';
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    errors.quantity = 'Quantity must be a whole number from 1 to 99.';
  }
  return result({ productId, quantity }, errors);
}

function validateCartQuantity(body = {}) {
  const errors = {};
  const quantity = toNumber(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    errors.quantity = 'Quantity must be a whole number from 1 to 99.';
  }
  return result({ quantity }, errors);
}

function validateCheckout(body = {}) {
  const errors = {};
  const fullName = text(body.fullName);
  const phone = text(body.phone);
  const address = text(body.address);
  const digits = phone.replace(/\D/g, '');

  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = 'Full name must be between 2 and 100 characters.';
  }
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(phone) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Enter a valid phone number (7 to 15 digits).';
  }
  if (address.length < 10 || address.length > 500) {
    errors.address = 'Delivery address must be between 10 and 500 characters.';
  }
  return result({ fullName, phone, address }, errors);
}

function validateStatus(body = {}) {
  const errors = {};
  const status = text(body.status).toUpperCase();
  if (!ORDER_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${ORDER_STATUSES.join(', ')}.`;
  }
  return result({ status }, errors);
}

module.exports = {
  parseId,
  validateRegister,
  validateLogin,
  validateProduct,
  validateCartAdd,
  validateCartQuantity,
  validateCheckout,
  validateStatus,
};
