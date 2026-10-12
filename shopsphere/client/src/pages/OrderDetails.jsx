import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../services/shop';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatPrice } from '../utils/format';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SafeImage from '../components/SafeImage';

const STEPS = [
  ['PLACED', 'Placed'],
  ['PROCESSING', 'Processing'],
  ['SHIPPED', 'Shipped'],
  ['DELIVERED', 'Delivered'],
];

export default function OrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOrder(null);
    setError('');
    setNotFound(false);
    orderApi
      .get(id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404 || err.status === 400) setNotFound(true);
        else setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleCancel() {
    setCancelling(true);
    try {
      setOrder(await orderApi.cancel(order.id));
      toast.success('Your order was cancelled.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  }

  if (notFound) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            📭
          </div>
          <h1>Order not found</h1>
          <p>This order does not exist, or it does not belong to your account.</p>
          <Link to="/orders" className="btn btn-primary">
            Back to my orders
          </Link>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container page">
        <ErrorMessage message={error} />
      </div>
    );
  }
  if (!order) return <Loader label="Loading order..." />;

  const stepIndex = STEPS.findIndex(([status]) => status === order.status);

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/orders">My orders</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Order #{order.id}</span>
      </nav>

      <div className="page-header">
        <h1>Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      {order.status === 'CANCELLED' ? (
        <div className="alert alert-error">This order was cancelled.</div>
      ) : (
        <ol className="tracker" aria-label="Order progress">
          {STEPS.map(([status, label], index) => (
            <li key={status} className={index <= stepIndex ? 'done' : ''} aria-current={index === stepIndex ? 'step' : undefined}>
              <span className="tracker-dot" aria-hidden="true">
                {index <= stepIndex ? '✓' : index + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="cart-layout">
        <section className="card">
          <h2>Items</h2>
          <ul className="order-items">
            {order.items.map((item) => (
              <li key={item.id}>
                <SafeImage src={item.imageUrl} alt="" />
                <div>
                  <strong>{item.productName}</strong>
                  <span className="muted">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </span>
                </div>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="order-total">
            Total <strong>{formatPrice(order.total)}</strong>
          </p>
        </section>

        <aside className="card summary">
          <h2>Delivery</h2>
          <dl className="detail-list">
            <div>
              <dt>Placed on</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Name</dt>
              <dd>{order.customerName}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd className="pre-line">{order.address}</dd>
            </div>
          </dl>
          {order.status === 'PLACED' && (
            <button type="button" className="btn btn-danger-outline btn-block" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </button>
          )}
        </aside>
      </div>

      {confirmCancel && (
        <ConfirmDialog
          title="Cancel this order?"
          message={`Order #${order.id} will be cancelled and the items will go back into stock. This cannot be undone.`}
          confirmLabel="Yes, cancel order"
          danger
          busy={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </div>
  );
}
