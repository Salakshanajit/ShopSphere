import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/shop';
import { ORDER_STATUSES, STATUS_LABELS, formatDate, formatPrice } from '../../utils/format';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError('');
    adminApi
      .stats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (error) return <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />;
  if (!stats) return <Loader label="Loading dashboard..." />;

  const maxDaily = Math.max(1, ...stats.activity.map((day) => day.orders));
  const maxStatus = Math.max(1, ...Object.values(stats.ordersByStatus));

  const cards = [
    { label: 'Total products', value: stats.totalProducts, note: `${stats.lowStockProducts} low or out of stock`, to: '/admin/products' },
    { label: 'Total orders', value: stats.totalOrders, note: `${stats.ordersByStatus.PLACED} waiting to be processed`, to: '/admin/orders' },
    { label: 'Revenue', value: formatPrice(stats.totalRevenue), note: 'Excludes cancelled orders' },
    { label: 'Customers', value: stats.totalCustomers, note: 'Registered shopper accounts' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        {cards.map((card) => {
          const body = (
            <>
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
              <span className="stat-note">{card.note}</span>
            </>
          );
          return card.to ? (
            <Link key={card.label} to={card.to} className="stat-card">
              {body}
            </Link>
          ) : (
            <div key={card.label} className="stat-card">
              {body}
            </div>
          );
        })}
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Orders in the last 7 days</h2>
          <div className="bar-chart" role="img" aria-label={`Orders per day: ${stats.activity.map((d) => `${d.date}: ${d.orders}`).join(', ')}`}>
            {stats.activity.map((day) => (
              <div key={day.date} className="bar-col">
                <span className="bar-value">{day.orders}</span>
                <span className="bar" style={{ height: `${(day.orders / maxDaily) * 100}%` }} />
                <span className="bar-label">{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Orders by status</h2>
          <ul className="status-bars">
            {ORDER_STATUSES.map((status) => (
              <li key={status}>
                <span className="status-bar-label">{STATUS_LABELS[status]}</span>
                <span className="status-bar-track">
                  <span className={`status-bar-fill fill-${status.toLowerCase()}`} style={{ width: `${(stats.ordersByStatus[status] / maxStatus) * 100}%` }} />
                </span>
                <span className="status-bar-count">{stats.ordersByStatus[status]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="section-head">
          <h2>Recent orders</h2>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">
            View all orders
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="muted">No orders yet. They will appear here as customers check out.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Most recent orders</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <strong>#{order.id}</strong>
                    </td>
                    <td data-label="Customer">{order.customerName}</td>
                    <td data-label="Date">{formatDate(order.createdAt)}</td>
                    <td data-label="Total">{formatPrice(order.total)}</td>
                    <td data-label="Status">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
