// Puts the stock of every product in an order back (used when an order is cancelled).
// Must be called with a connection that is inside a transaction.
async function restoreStock(conn, orderId) {
  await conn.execute(
    `UPDATE products p
       JOIN order_items oi ON oi.product_id = p.id
        SET p.stock = p.stock + oi.quantity
      WHERE oi.order_id = ?`,
    [orderId]
  );
}

module.exports = { restoreStock };
