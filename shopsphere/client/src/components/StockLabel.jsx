export default function StockLabel({ stock }) {
  if (stock <= 0) return <span className="stock stock-out">Out of stock</span>;
  if (stock <= 5) return <span className="stock stock-low">Only {stock} left</span>;
  return <span className="stock stock-in">In stock</span>;
}
