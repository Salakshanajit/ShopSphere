const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { mapProduct } = require('../utils/mappers');
const { parseId, validateProduct } = require('../utils/validators');

const COLUMNS =
  'id, name, description, price, category, image_url, stock, rating, created_at, updated_at';

// Sorting options are whitelisted so user input never reaches the SQL text.
const SORTS = {
  newest: 'id DESC',
  price_asc: 'price ASC, id ASC',
  price_desc: 'price DESC, id ASC',
  name: 'name ASC',
};

const escapeLike = (value) => value.replace(/[\\%_]/g, (m) => `\\${m}`);

async function findProduct(id) {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM products WHERE id = ?`, [id]);
  return rows[0] ? mapProduct(rows[0]) : null;
}

// GET /api/products?search=&category=&sort=newest|price_asc|price_desc|name
exports.list = async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 100);
  const category = String(req.query.category || '').trim().slice(0, 60);
  const orderBy = SORTS[String(req.query.sort || 'newest')] || SORTS.newest;

  const where = [];
  const params = [];
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    where.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
    params.push(pattern, pattern, pattern);
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }

  const sql =
    `SELECT ${COLUMNS} FROM products` +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ` ORDER BY ${orderBy}`;
  const [rows] = await pool.execute(sql, params);
  res.json({ success: true, data: rows.map(mapProduct) });
};

// GET /api/products/categories
exports.categories = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT category, COUNT(*) AS productCount FROM products GROUP BY category ORDER BY category'
  );
  res.json({
    success: true,
    data: rows.map((r) => ({ name: r.category, productCount: Number(r.productCount) })),
  });
};

// GET /api/products/:id
exports.getById = async (req, res) => {
  const product = await findProduct(parseId(req.params.id, 'product id'));
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ success: true, data: product });
};

// POST /api/products  (admin)
exports.create = async (req, res) => {
  const { value, errors } = validateProduct(req.body);
  if (errors) throw new HttpError(400, 'Please correct the highlighted fields.', errors);

  const [result] = await pool.execute(
    `INSERT INTO products (name, description, price, category, image_url, stock, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      value.name,
      value.description,
      value.price.toFixed(2),
      value.category,
      value.imageUrl || null,
      value.stock,
      value.rating.toFixed(1),
    ]
  );
  res.status(201).json({ success: true, data: await findProduct(result.insertId) });
};

// PUT /api/products/:id  (admin)
exports.update = async (req, res) => {
  const id = parseId(req.params.id, 'product id');
  const { value, errors } = validateProduct(req.body);
  if (errors) throw new HttpError(400, 'Please correct the highlighted fields.', errors);

  if (!(await findProduct(id))) throw new HttpError(404, 'Product not found.');

  await pool.execute(
    `UPDATE products
        SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock = ?, rating = ?
      WHERE id = ?`,
    [
      value.name,
      value.description,
      value.price.toFixed(2),
      value.category,
      value.imageUrl || null,
      value.stock,
      value.rating.toFixed(1),
      id,
    ]
  );
  res.json({ success: true, data: await findProduct(id) });
};

// DELETE /api/products/:id  (admin)
// Cart rows are removed automatically; past order items keep a copy of the name and price.
exports.remove = async (req, res) => {
  const id = parseId(req.params.id, 'product id');
  if (!(await findProduct(id))) throw new HttpError(404, 'Product not found.');
  await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  res.json({ success: true, data: { id }, message: 'Product deleted.' });
};
