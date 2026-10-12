import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderApi } from '../services/shop';
import { formatPrice } from '../utils/format';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SafeImage from '../components/SafeImage';

function validate(values) {
  const errors = {};
  const digits = values.phone.replace(/\D/g, '');
  if (values.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(values.phone.trim()) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Enter a valid phone number (7 to 15 digits).';
  }
  if (values.address.trim().length < 10) errors.address = 'Enter your full delivery address (at least 10 characters).';
  return errors;
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, itemCount, total, loading, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: user?.name || '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading && items.length === 0) return <Loader label="Loading your cart..." />;

  if (items.length === 0) {
    return (
      <div className="container page">
        <EmptyState icon="🛒" title="Nothing to check out" text="Your cart is empty. Add some products first.">
          <Link to="/" className="btn btn-primary">
            Browse products
          </Link>
        </EmptyState>
      </div>
    );
  }

  const hasStockProblem = items.some((item) => item.exceedsStock || item.stock === 0);

  const change = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      // Only contact details are sent. Prices and totals are calculated by the server.
      const order = await orderApi.create({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
      });
      toast.success(`Order #${order.id} placed successfully!`);
      navigate(`/order-confirmation/${order.id}`, { replace: true });
      refresh(); // the server emptied the cart; update the badge in the navbar
    } catch (error) {
      setFormError(error.message);
      if (error.errors) setErrors(error.errors);
      if (error.code === 'INSUFFICIENT_STOCK' || error.code === 'EMPTY_CART') await refresh();
      setSubmitting(false);
    }
  }

  const field = (name, label, input) => (
    <div className={`form-group ${errors[name] ? 'has-error' : ''}`}>
      <label htmlFor={`co-${name}`}>{label}</label>
      {input}
      {errors[name] && (
        <p className="field-error" id={`co-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  const common = (name) => ({
    id: `co-${name}`,
    value: values[name],
    onChange: change(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `co-${name}-error` : undefined,
  });

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <div className="alert alert-info">
        <strong>Demo checkout.</strong> No real payment is taken - placing the order just records it in the database.
      </div>

      <div className="cart-layout">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h2>Delivery details</h2>
          {formError && (
            <div className="alert alert-error" role="alert">
              {formError}
            </div>
          )}
          {field('fullName', 'Full name', <input type="text" autoComplete="name" {...common('fullName')} />)}
          {field('phone', 'Phone number', <input type="tel" autoComplete="tel" placeholder="e.g. +91 98765 43210" {...common('phone')} />)}
          {field(
            'address',
            'Delivery address',
            <textarea rows={4} autoComplete="street-address" placeholder="House number, street, city, postal code" {...common('address')} />
          )}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting || hasStockProblem}>
            {submitting ? 'Placing order...' : `Place demo order · ${formatPrice(total)}`}
          </button>
          {hasStockProblem && (
            <p className="field-error">
              Some items are unavailable in the quantity you chose. <Link to="/cart">Review your cart</Link>.
            </p>
          )}
        </form>

        <aside className="card summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {items.map((item) => (
              <li key={item.productId}>
                <SafeImage src={item.imageUrl} alt="" />
                <span className="summary-item-name">
                  {item.name}
                  <span className="muted"> × {item.quantity}</span>
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary-rows">
            <div>
              <dt>Items ({itemCount})</dt>
              <dd>{formatPrice(total)}</dd>
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
          <Link to="/cart" className="btn btn-link btn-block">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
