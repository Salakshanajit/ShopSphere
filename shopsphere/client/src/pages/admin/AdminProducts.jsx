import { useEffect, useMemo, useState } from 'react';
import { productApi } from '../../services/shop';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import ProductForm from '../../components/ProductForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import SafeImage from '../../components/SafeImage';
import StockLabel from '../../components/StockLabel';

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new product, product = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    productApi
      .list({ sort: 'newest' })
      .then((data) => {
        if (!cancelled) setProducts(data);
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

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  }, [products, filter]);

  async function handleSave(payload) {
    if (editing && editing.id) {
      const updated = await productApi.update(editing.id, payload);
      setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`"${updated.name}" was updated.`);
    } else {
      const created = await productApi.create(payload);
      setProducts((list) => [created, ...list]);
      toast.success(`"${created.name}" was added.`);
    }
    setEditing(null);
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await productApi.remove(deleting.id);
      setProducts((list) => list.filter((p) => p.id !== deleting.id));
      toast.success(`"${deleting.name}" was deleted.`);
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Products</h1>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
          + Add product
        </button>
      </div>

      {loading && <Loader label="Loading products..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />}

      {!loading && !error && products.length === 0 && (
        <EmptyState icon="📦" title="No products yet" text="Add your first product to start selling.">
          <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
            Add your first product
          </button>
        </EmptyState>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="form-group filter-box">
            <label htmlFor="product-filter" className="sr-only">
              Filter products
            </label>
            <input
              id="product-filter"
              type="search"
              placeholder="Filter by name or category..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>

          {visible.length === 0 ? (
            <p className="muted">No products match "{filter}".</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">All products</caption>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Category</th>
                    <th scope="col">Price</th>
                    <th scope="col">Stock</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
                    <tr key={product.id}>
                      <td data-label="Product">
                        <div className="table-product">
                          <SafeImage src={product.imageUrl} alt="" />
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td data-label="Category">{product.category}</td>
                      <td data-label="Price">{formatPrice(product.price)}</td>
                      <td data-label="Stock">
                        {product.stock} <StockLabel stock={product.stock} />
                      </td>
                      <td className="table-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(product)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setDeleting(product)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editing && (
        <ProductForm product={editing.id ? editing : null} categories={categories} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete product?"
          message={`"${deleting.name}" will be removed from the shop and from all carts. Past orders keep their own copy of the name and price. This cannot be undone.`}
          confirmLabel="Delete product"
          danger
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
