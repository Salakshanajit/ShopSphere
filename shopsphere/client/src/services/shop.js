// Every backend endpoint used by the React app, grouped by feature.
import { request } from './api';

export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),
};

export const productApi = {
  list: ({ search = '', category = '', sort = 'newest' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    return request(`/products?${params.toString()}`);
  },
  categories: () => request('/products/categories'),
  get: (id) => request(`/products/${id}`),
  create: (data) => request('/products', { method: 'POST', body: data }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  get: () => request('/cart'),
  add: (productId, quantity = 1) => request('/cart', { method: 'POST', body: { productId, quantity } }),
  setQuantity: (productId, quantity) => request(`/cart/${productId}`, { method: 'PUT', body: { quantity } }),
  remove: (productId) => request(`/cart/${productId}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' }),
};

export const orderApi = {
  create: (data) => request('/orders', { method: 'POST', body: data }),
  list: () => request('/orders'),
  get: (id) => request(`/orders/${id}`),
  cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
};

export const adminApi = {
  stats: () => request('/admin/stats'),
  orders: (status = '') => request(`/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  order: (id) => request(`/admin/orders/${id}`),
  updateStatus: (id, status) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};
