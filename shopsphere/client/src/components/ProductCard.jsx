import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import useAddToCart from '../hooks/useAddToCart';
import { formatPrice } from '../utils/format';
import SafeImage from './SafeImage';
import Stars from './Stars';
import StockLabel from './StockLabel';

export default function ProductCard({ product }) {
  const { getQuantity } = useCart();
  const { addToCart, busyId } = useAddToCart();

  const inCart = getQuantity(product.id);
  const soldOut = product.stock <= 0;
  const maxedOut = !soldOut && inCart >= product.stock;

  let buttonLabel = 'Add to cart';
  if (soldOut) buttonLabel = 'Out of stock';
  else if (maxedOut) buttonLabel = 'Max in cart';
  else if (busyId === product.id) buttonLabel = 'Adding...';

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <SafeImage src={product.imageUrl} alt={product.name} className="product-image" />
        {soldOut && <span className="product-flag">Sold out</span>}
      </Link>
      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          <Stars rating={product.rating} />
          <StockLabel stock={product.stock} />
        </div>
        <div className="product-footer">
          <span className="price">{formatPrice(product.price)}</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={soldOut || maxedOut || busyId === product.id}
            onClick={() => addToCart(product, 1)}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
