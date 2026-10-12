const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { mapOrder } = require('../utils/mappers');
const { restoreStock } = require('../utils/orderStock');
const { loadOrderItems } = require('./orderController');
const { ORDER_STATUSES } = require('../utils/constants');
const { parseId, validateStatus } = require('../utils/validators');

const ORDER_LIST_SQL = `
  SELECT o.*, u.email AS account_email, u.name AS account_name,
         (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id`;

const dayKey = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// GET /api/admin/stats
exports.stats = async (req, res) => {
  const [[products]] = await pool.execute('SELECT COUNT(*) AS c FROM products');
  const [[lowStock]] = await pool.execute('SELECT COUNT(*) AS c FROM products WHERE stock <= 5');
  const [[customers]] = await pool.execute("SELECT COUNT(*) AS c FROM users WHERE role = 'USER'");
  const [[orders]] = await pool.execute('SELECT COUNT(*) AS c FROM orders');
  const [[revenue]] = await pool.execute(
    "SELECT COALESCE(SUM(total), 0) AS r FROM orders WHERE status <> 'CANCELLED'"
  );
  const [statusRows] = await pool.execute('SELECT status, COUNT(*) AS c FROM orders GROUP BY status');
  const [recentRows] = await pool.execute(`${ORDER_LIST_SQL} ORDER BY o.created_at DESC, o.id DESC LIMIT 5`);
  const [recentActivity] = await pool.execute(
    'SELECT created_at FROM orders WHERE created_at >= (UTC_TIMESTAMP() - INTERVAL 8 DAY)'
  );

  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  statusRows.forEach((r) => {
    ordersByStatus[r.status] = Number(r.c);
  });

  // Orders per day for the last 7 days (today included), including days with zero orders.
  const activity = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    activity.push({ date: dayKey(date), orders: 0 });
  }
  recentActivity.forEach((row) => {
    const bucket = activity.find((a) => a.date === dayKey(row.created_at));
    if (bucket) bucket.orders += 1;
  });

  res.json({
    success: true,
    data: {
      totalProducts: Number(products.c),
      lowStockProducts: Number(lowStock.c),
      totalCustomers: Number(customers.c),
      totalOrders: Number(orders.c),
      totalRevenue: Number(revenue.r),
      ordersByStatus,
      activity,
      recentOrders: recentRows.map(mapOrder),
    },
  });
};

// GET /api/admin/orders?status=PLACED
exports.listOrders = async (req, res) => {
  const status = String(req.query.status || '').toUpperCase();
  const params = [];
  let sql = ORDER_LIST_SQL;
  if (status) {
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Unknown order status.');
    sql += ' WHERE o.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY o.created_at DESC, o.id DESC';
  const [rows] = await pool.execute(sql, params);
  res.json({ success: true, data: rows.map(mapOrder) });
};

// GET /api/admin/orders/:id
exports.getOrder = async (req, res) => {
  const id = parseId(req.params.id, 'order id');
  const [rows] = await pool.execute(`${ORDER_LIST_SQL} WHERE o.id = ?`, [id]);
  if (!rows.length) throw new HttpError(404, 'Order not found.');
  res.json({ success: true, data: { ...mapOrder(rows[0]), items: await loadOrderItems(id) } });
};

// PATCH /api/admin/orders/:id/status  { status }
// Cancelling an order puts its stock back. A cancelled order cannot be re-opened.
exports.updateOrderStatus = async (req, res) => {
  const id = parseId(req.params.id, 'order id');
  const { value, errors } = validateStatus(req.body);
  if (errors) throw new HttpError(400, 'Invalid status.', errors);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new HttpError(404, 'Order not found.');
    const current = rows[0].status;

    if (current !== value.status) {
      if (current === 'CANCELLED') {
        throw new HttpError(409, 'A cancelled order cannot be changed.');
      }
      if (value.status === 'CANCELLED') await restoreStock(conn, id);
      await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [value.status, id]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  const [updated] = await pool.execute(`${ORDER_LIST_SQL} WHERE o.id = ?`, [id]);
  res.json({ success: true, data: { ...mapOrder(updated[0]), items: await loadOrderItems(id) } });
};
