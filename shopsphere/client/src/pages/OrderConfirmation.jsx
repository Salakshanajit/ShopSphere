import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../services/shop';
import { formatDateTime, formatPrice } from '../utils/format';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setOrder(null);
    setError('');
    orderApi
      .get(id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.status === 404 ? 'We could not find that order.' : err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container page">
        <ErrorMessage message={error} />
        <Link to="/orders" className="btn btn-primary">
          Go to my orders
        </Link>
      </div>
    );
  }
  if (!order) return <Loader label="Loading your order..." />;

  return (
    <div className="container page narrow">
      <div className="card confirmation">
        <div className="confirmation-icon" aria-hidden="true">
          ✓
        </div>
        <h1>Thank you, your order is placed!</h1>
        <p className="muted">
          This was a demo checkout, so no payment was taken. Your order has been saved and an administrator can now process it.
        </p>
        <p className="order-id">
          Order ID <strong>#{order.id}</strong>
        </p>

        <dl className="detail-list">
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={order.status} />
            </dd>
          </div>
          <div>
            <dt>Placed on</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div>
            <dt>Deliver to</dt>
            <dd>
              {order.customerName}, {order.phone}
              <br />
              {order.address}
            </dd>
          </div>
        </dl>

        <h2>Items</h2>
        <ul className="plain-list">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.productName} <span className="muted">× {item.quantity}</span>
              </span>
              <span>{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
          <li className="plain-total">
            <strong>Total</strong>
            <strong>{formatPrice(order.total)}</strong>
          </li>
        </ul>

        <div className="button-row">
          <Link to={`/orders/${order.id}`} className="btn btn-primary">
            Track this order
          </Link>
          <Link to="/" className="btn btn-secondary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
