import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/shop';
import { formatDate, formatPrice } from '../utils/format';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    orderApi
      .list()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="container page">
      <h1>My orders</h1>

      {loading && <Loader label="Loading your orders..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState icon="📦" title="No orders yet" text="When you place an order it will show up here so you can track it.">
          <Link to="/" className="btn btn-primary">
            Start shopping
          </Link>
        </EmptyState>
      )}
      {!loading && !error && orders.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Your orders</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">
                    <strong>#{order.id}</strong>
                  </td>
                  <td data-label="Date">{formatDate(order.createdAt)}</td>
                  <td data-label="Items">{order.itemCount}</td>
                  <td data-label="Total">{formatPrice(order.total)}</td>
                  <td data-label="Status">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="table-actions">
                    <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm">
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
