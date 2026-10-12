const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { toCents, fromCents } = require('../utils/money');
const { parseId, validateCartAdd, validateCartQuantity } = require('../utils/validators');

// Builds the cart JSON for a user. Prices always come from the products table.
async function buildCart(userId) {
  const [rows] = await pool.execute(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock, p.category
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ?
      ORDER BY ci.id`,
    [userId]
  );

  let subtotalCents = 0;
  let itemCount = 0;
  const items = rows.map((row) => {
    const lineCents = toCents(row.price) * row.quantity;
    subtotalCents += lineCents;
    itemCount += row.quantity;
    return {
      productId: row.product_id,
      name: row.name,
      category: row.category,
      imageUrl: row.image_url || '',
      price: Number(row.price),
      stock: Number(row.stock),
      quantity: row.quantity,
      lineTotal: fromCents(lineCents),
      // true when stock dropped below the quantity in the cart
      exceedsStock: row.quantity > row.stock,
    };
  });

  return { items, itemCount, subtotal: fromCents(subtotalCents), total: fromCents(subtotalCents) };
}

async function getProduct(productId) {
  const [rows] = await pool.execute('SELECT id, name, stock FROM products WHERE id = ?', [productId]);
  if (!rows.length) throw new HttpError(404, 'Product not found.');
  return rows[0];
}

function assertStock(product, wanted) {
  if (product.stock === 0) {
    throw new HttpError(409, `"${product.name}" is out of stock.`, null, 'INSUFFICIENT_STOCK');
  }
  if (wanted > product.stock) {
    throw new HttpError(
      409,
      `Only ${product.stock} unit(s) of "${product.name}" are available.`,
      null,
      'INSUFFICIENT_STOCK'
    );
  }
}

// GET /api/cart
exports.getCart = async (req, res) => {
  res.json({ success: true, data: await buildCart(req.user.id) });
};

// POST /api/cart  { productId, quantity }  - adds to the quantity already in the cart
exports.addItem = async (req, res) => {
  const { value, errors } = validateCartAdd(req.body);
  if (errors) throw new HttpError(400, 'Invalid cart request.', errors);

  const product = await getProduct(value.productId);
  const [existing] = await pool.execute(
    'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
    [req.user.id, value.productId]
  );
  const newQuantity = (existing[0] ? existing[0].quantity : 0) + value.quantity;
  assertStock(product, newQuantity);

  await pool.execute(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
    [req.user.id, value.productId, newQuantity]
  );
  res.status(201).json({ success: true, data: await buildCart(req.user.id) });
};

// PUT /api/cart/:productId  { quantity }  - sets an exact quantity
exports.updateItem = async (req, res) => {
  const productId = parseId(req.params.productId, 'product id');
  const { value, errors } = validateCartQuantity(req.body);
  if (errors) throw new HttpError(400, 'Invalid quantity.', errors);

  const [existing] = await pool.execute(
    'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?',
    [req.user.id, productId]
  );
  if (!existing.length) throw new HttpError(404, 'That product is not in your cart.');

  assertStock(await getProduct(productId), value.quantity);
  await pool.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [
    value.quantity,
    req.user.id,
    productId,
  ]);
  res.json({ success: true, data: await buildCart(req.user.id) });
};

// DELETE /api/cart/:productId
exports.removeItem = async (req, res) => {
  const productId = parseId(req.params.productId, 'product id');
  await pool.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [
    req.user.id,
    productId,
  ]);
  res.json({ success: true, data: await buildCart(req.user.id) });
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.json({ success: true, data: await buildCart(req.user.id) });
};
