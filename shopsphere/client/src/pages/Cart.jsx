import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import SafeImage from '../components/SafeImage';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export default function Cart() {
  const { items, itemCount, subtotal, total, loading, setQuantity, removeItem, clearCart } = useCart();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  async function run(productId, action, successMessage) {
    setBusyId(productId);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && items.length === 0) return <Loader label="Loading your cart..." />;

  if (items.length === 0) {
    return (
      <div className="container page">
        <EmptyState icon="🛒" title="Your cart is empty" text="Looks like you have not added anything yet. Browse our products and find something you like.">
          <Link to="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </EmptyState>
      </div>
    );
  }

  const hasStockProblem = items.some((item) => item.exceedsStock || item.stock === 0);

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Shopping cart</h1>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => run('all', clearCart, 'Your cart was cleared.')}
          disabled={busyId === 'all'}
        >
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <ul className="cart-list" aria-label="Items in your cart">
          {items.map((item) => (
            <li key={item.productId} className={`cart-item ${item.exceedsStock ? 'has-problem' : ''}`}>
              <Link to={`/product/${item.productId}`} className="cart-thumb">
                <SafeImage src={item.imageUrl} alt={item.name} />
              </Link>
              <div className="cart-info">
                <Link to={`/product/${item.productId}`} className="cart-name">
                  {item.name}
                </Link>
                <span className="muted">{formatPrice(item.price)} each</span>
                {item.exceedsStock && (
                  <span className="field-error">
                    {item.stock === 0 ? 'This item is now out of stock.' : `Only ${item.stock} left - please reduce the quantity.`}
                  </span>
                )}
              </div>
              <div className="stepper" role="group" aria-label={`Quantity for ${item.name}`}>
                <button
                  type="button"
                  onClick={() => run(item.productId, () => setQuantity(item.productId, item.quantity - 1))}
                  disabled={item.quantity <= 1 || busyId === item.productId}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  −
                </button>
                <span className="stepper-value" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => run(item.productId, () => setQuantity(item.productId, item.quantity + 1))}
                  disabled={item.quantity >= item.stock || busyId === item.productId}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
              <div className="cart-line-total">{formatPrice(item.lineTotal)}</div>
              <button
                type="button"
                className="btn btn-link btn-danger-text"
                onClick={() => run(item.productId, () => removeItem(item.productId), `${item.name} was removed.`)}
                disabled={busyId === item.productId}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <aside className="card summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl className="summary-rows">
            <div>
              <dt>Items ({itemCount})</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>Free (demo)</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          {hasStockProblem ? (
            <>
              <div className="alert alert-warning">Fix the highlighted items before checking out.</div>
              <button type="button" className="btn btn-primary btn-block" disabled>
                Proceed to checkout
              </button>
            </>
          ) : (
            <Link to="/checkout" className="btn btn-primary btn-block">
              Proceed to checkout
            </Link>
          )}
          <Link to="/" className="btn btn-link btn-block">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
