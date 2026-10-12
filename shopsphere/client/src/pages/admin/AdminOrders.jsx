import { useEffect, useState } from 'react';
import { adminApi } from '../../services/shop';
import { useToast } from '../../context/ToastContext';
import { ORDER_STATUSES, STATUS_LABELS, formatDateTime, formatPrice } from '../../utils/format';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    adminApi
      .orders(statusFilter)
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
  }, [statusFilter, reloadKey]);

  async function changeStatus(order, status) {
    setUpdatingId(order.id);
    try {
      const updated = await adminApi.updateStatus(order.id, status);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      if (detail && detail.id === order.id) setDetail(updated);
      toast.success(`Order #${order.id} is now ${STATUS_LABELS[updated.status]}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
      setPendingCancel(null);
    }
  }

  function handleSelect(order, status) {
    if (status === order.status) return;
    if (status === 'CANCELLED') setPendingCancel(order); // confirm first
    else changeStatus(order, status);
  }

  async function openDetail(order) {
    setDetail({ ...order, items: null });
    setDetailLoading(true);
    try {
      setDetail(await adminApi.order(order.id));
    } catch (err) {
      toast.error(err.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Orders</h1>
        <div className="toolbar-controls">
          <label htmlFor="status-filter">Status</label>
          <select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loader label="Loading orders..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon="📭"
          title={statusFilter ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} orders` : 'No orders yet'}
          text={statusFilter ? 'Try another status filter.' : 'Orders will appear here as soon as customers check out.'}
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Customer orders</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Date</th>
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
                    <div className="muted small">{order.itemCount} item(s)</div>
                  </td>
                  <td data-label="Customer">
                    {order.customerName}
                    <div className="muted small">{order.accountEmail}</div>
                  </td>
                  <td data-label="Date">{formatDateTime(order.createdAt)}</td>
                  <td data-label="Total">{formatPrice(order.total)}</td>
                  <td data-label="Status">
                    {order.status === 'CANCELLED' ? (
                      <StatusBadge status="CANCELLED" />
                    ) : (
                      <>
                        <label htmlFor={`status-${order.id}`} className="sr-only">
                          Status of order {order.id}
                        </label>
                        <select
                          id={`status-${order.id}`}
                          className="status-select"
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(event) => handleSelect(order, event.target.value)}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDetail(order)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal title={`Order #${detail.id}`} onClose={() => setDetail(null)} wide>
          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>
            </div>
            <div>
              <dt>Placed on</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>
                {detail.customerName} ({detail.accountEmail})
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{detail.phone}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd className="pre-line">{detail.address}</dd>
            </div>
          </dl>
          <h3>Items</h3>
          {detailLoading || !detail.items ? (
            <Loader label="Loading items..." />
          ) : (
            <ul className="plain-list">
              {detail.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.productName} <span className="muted">× {item.quantity} @ {formatPrice(item.unitPrice)}</span>
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
              <li className="plain-total">
                <strong>Total</strong>
                <strong>{formatPrice(detail.total)}</strong>
              </li>
            </ul>
          )}
        </Modal>
      )}

      {pendingCancel && (
        <ConfirmDialog
          title="Cancel this order?"
          message={`Order #${pendingCancel.id} will be marked as cancelled and its items will be returned to stock. A cancelled order cannot be changed again.`}
          confirmLabel="Cancel order"
          danger
          busy={updatingId === pendingCancel.id}
          onConfirm={() => changeStatus(pendingCancel, 'CANCELLED')}
          onCancel={() => setPendingCancel(null)}
        />
      )}
    </>
  );
}
