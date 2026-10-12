import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productApi } from '../services/shop';
import { useCart } from '../context/CartContext';
import useAddToCart from '../hooks/useAddToCart';
import { formatPrice } from '../utils/format';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import SafeImage from '../components/SafeImage';
import Stars from '../components/Stars';
import StockLabel from '../components/StockLabel';

export default function ProductDetails() {
  const { id } = useParams();
  const { getQuantity } = useCart();
  const { addToCart, busyId } = useAddToCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setNotFound(false);
    productApi
      .get(id)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setQuantity(1);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404 || err.status === 400) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (loading) return <Loader label="Loading product..." />;

  if (notFound) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            🤷
          </div>
          <h1>Product not found</h1>
          <p>This product may have been removed.</p>
          <Link to="/" className="btn btn-primary">
            Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  const inCart = getQuantity(product.id);
  const available = Math.max(product.stock - inCart, 0);
  const soldOut = product.stock <= 0;
  const maxQuantity = Math.max(available, 1);
  const busy = busyId === product.id;

  async function handleAdd() {
    const added = await addToCart(product, quantity);
    if (added) setQuantity(1);
  }

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="details">
        <div className="details-image">
          <SafeImage src={product.imageUrl} alt={product.name} />
        </div>
        <div className="details-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="product-meta">
            <Stars rating={product.rating} />
            <StockLabel stock={product.stock} />
          </div>
          <p className="details-price">{formatPrice(product.price)}</p>
          <p className="details-description">{product.description}</p>

          {soldOut ? (
            <div className="alert alert-warning">This product is currently out of stock.</div>
          ) : (
            <div className="details-actions">
              <div className="quantity-picker">
                <label htmlFor="quantity">Quantity</label>
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(event) => {
                      const next = Math.floor(Number(event.target.value)) || 1;
                      setQuantity(Math.min(Math.max(next, 1), maxQuantity));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <button type="button" className="btn btn-primary btn-lg" disabled={available <= 0 || busy} onClick={handleAdd}>
                {busy ? 'Adding...' : available <= 0 ? 'Maximum already in cart' : 'Add to cart'}
              </button>
            </div>
          )}
          {inCart > 0 && (
            <p className="muted">
              You have {inCart} in your cart. <Link to="/cart">View cart</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
