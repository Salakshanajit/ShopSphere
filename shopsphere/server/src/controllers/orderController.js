const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { mapOrder, mapOrderItem } = require('../utils/mappers');
const { toCents, fromCents } = require('../utils/money');
const { restoreStock } = require('../utils/orderStock');
const { parseId, validateCheckout } = require('../utils/validators');

async function loadOrderItems(orderId) {
  const [rows] = await pool.execute(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.unit_price, oi.quantity, oi.line_total, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id`,
    [orderId]
  );
  return rows.map(mapOrderItem);
}

// Only returns the order when it belongs to the given user.
async function loadOrderForUser(orderId, userId) {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [
    orderId,
    userId,
  ]);
  if (!rows.length) return null;
  return { ...mapOrder(rows[0]), items: await loadOrderItems(orderId) };
}

// POST /api/orders  { fullName, phone, address }
// Demo checkout: no payment is taken. Everything happens inside ONE transaction, so a
// failure at any step leaves the stock and the order tables exactly as they were.
exports.create = async (req, res) => {
  const { value, errors } = validateCheckout(req.body);
  if (errors) throw new HttpError(400, 'Please correct the highlighted fields.', errors);

  const conn = await pool.getConnection();
  let orderId;
  try {
    await conn.beginTransaction();

    // Lock the cart rows and product rows so nobody else can change stock meanwhile.
    const [cartRows] = await conn.execute(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY p.id
          FOR UPDATE`,
      [req.user.id]
    );
    if (!cartRows.length) throw new HttpError(400, 'Your cart is empty.', null, 'EMPTY_CART');

    // Prices come from the database, never from the browser.
    let totalCents = 0;
    for (const row of cartRows) {
      if (row.stock < row.quantity) {
        const message =
          row.stock === 0
            ? `"${row.name}" is out of stock. Please remove it from your cart.`
            : `Only ${row.stock} unit(s) of "${row.name}" are available. Please reduce the quantity in your cart.`;
        throw new HttpError(409, message, null, 'INSUFFICIENT_STOCK');
      }
      totalCents += toCents(row.price) * row.quantity;
    }

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, customer_name, phone, address, total, status)
       VALUES (?, ?, ?, ?, ?, 'PLACED')`,
      [req.user.id, value.fullName, value.phone, value.address, fromCents(totalCents).toFixed(2)]
    );
    orderId = orderResult.insertId;

    for (const row of cartRows) {
      const lineCents = toCents(row.price) * row.quantity;
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          row.product_id,
          row.name,
          Number(row.price).toFixed(2),
          row.quantity,
          fromCents(lineCents).toFixed(2),
        ]
      );
      const [stockResult] = await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [row.quantity, row.product_id, row.quantity]
      );
      if (stockResult.affectedRows !== 1) {
        throw new HttpError(409, `"${row.name}" just went out of stock. Please review your cart.`, null, 'INSUFFICIENT_STOCK');
      }
    }

    await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  res.status(201).json({ success: true, data: await loadOrderForUser(orderId, req.user.id) });
};

// GET /api/orders  - only the logged-in user's own orders
exports.list = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT o.*,
            (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows.map(mapOrder) });
};

// GET /api/orders/:id  - 404 for orders that belong to somebody else
exports.getById = async (req, res) => {
  const order = await loadOrderForUser(parseId(req.params.id, 'order id'), req.user.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ success: true, data: order });
};

// POST /api/orders/:id/cancel  - a customer may cancel their own order while it is PLACED
exports.cancel = async (req, res) => {
  const id = parseId(req.params.id, 'order id');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, req.user.id]
    );
    if (!rows.length) throw new HttpError(404, 'Order not found.');
    if (rows[0].status !== 'PLACED') {
      throw new HttpError(409, 'Only orders with status PLACED can be cancelled.');
    }
    await restoreStock(conn, id);
    await conn.execute("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
  res.json({ success: true, data: await loadOrderForUser(id, req.user.id) });
};

exports.loadOrderItems = loadOrderItems;
