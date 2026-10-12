// Convert database rows (snake_case) to the JSON shape used by the API (camelCase).

const mapProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  category: row.category,
  imageUrl: row.image_url || '',
  stock: Number(row.stock),
  rating: Number(row.rating),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapOrder = (row) => ({
  id: row.id,
  userId: row.user_id,
  status: row.status,
  total: Number(row.total),
  customerName: row.customer_name,
  phone: row.phone,
  address: row.address,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(row.item_count !== undefined ? { itemCount: Number(row.item_count) } : {}),
  ...(row.account_email !== undefined
    ? { accountEmail: row.account_email, accountName: row.account_name }
    : {}),
});

const mapOrderItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  unitPrice: Number(row.unit_price),
  quantity: Number(row.quantity),
  lineTotal: Number(row.line_total),
  imageUrl: row.image_url || '',
});

module.exports = { mapProduct, mapOrder, mapOrderItem };
