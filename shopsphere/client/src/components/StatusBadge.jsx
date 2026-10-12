import { STATUS_LABELS } from '../utils/format';

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${String(status).toLowerCase()}`}>{STATUS_LABELS[status] || status}</span>;
}
