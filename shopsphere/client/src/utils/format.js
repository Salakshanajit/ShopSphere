// Formatting helpers. To use another currency, change CURRENCY and LOCALE here (one place only).
const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const priceFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

export const formatPrice = (value) => priceFormatter.format(Number(value) || 0);

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const ORDER_STATUSES = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const STATUS_LABELS = {
  PLACED: 'Placed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
