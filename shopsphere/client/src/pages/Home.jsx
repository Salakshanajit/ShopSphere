import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../services/shop';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';

const SORT_OPTIONS = [
  ['newest', 'Newest first'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name: A to Z'],
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    productApi
      .categories()
      .then(setCategories)
      .catch(() => {
        /* category chips are optional; the product error below covers server problems */
      });
  }, [reloadKey]);

  // Reload the product list whenever the search, category or sort changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    productApi
      .list({ search, category, sort })
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
  }, [search, category, sort, reloadKey]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const filtering = Boolean(search || category);

  return (
    <>
      {!filtering && (
        <section className="hero">
          <div className="container hero-inner">
            <div>
              <p className="hero-eyebrow">Welcome to ShopSphere</p>
              <h1>Everything you need, delivered to your door.</h1>
              <p className="hero-text">
                Browse electronics, fashion, home essentials, books and more. Create an account, fill your cart and
                place a demo order in minutes.
              </p>
              <a href="#products" className="btn btn-accent btn-lg">
                Start shopping
              </a>
            </div>
            <ul className="hero-points" aria-label="Store highlights">
              <li>🚚 Demo delivery on every order</li>
              <li>🔒 Secure login with hashed passwords</li>
              <li>📦 Track every order status</li>
            </ul>
          </div>
        </section>
      )}

      <div className="container page" id="products">
        <div className="chips" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`chip ${category === '' ? 'active' : ''}`}
            aria-pressed={category === ''}
            onClick={() => updateParam('category', '')}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`chip ${category === item.name ? 'active' : ''}`}
              aria-pressed={category === item.name}
              onClick={() => updateParam('category', item.name)}
            >
              {item.name} <span className="chip-count">{item.productCount}</span>
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div>
            <h2 className="toolbar-title">{search ? `Results for "${search}"` : category || 'All products'}</h2>
            {!loading && !error && (
              <p className="muted" aria-live="polite">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>
          <div className="toolbar-controls">
            {filtering && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setParams({})}>
                Clear filters
              </button>
            )}
            <label htmlFor="sort-select" className="sr-only">
              Sort products
            </label>
            <select id="sort-select" value={sort} onChange={(event) => updateParam('sort', event.target.value === 'newest' ? '' : event.target.value)}>
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <Loader label="Loading products..." />}
        {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
        {!loading && !error && products.length === 0 && (
          <EmptyState
            icon="🔎"
            title="No products found"
            text={filtering ? 'Try a different search word or clear the filters.' : 'The store has no products yet. Please check back soon.'}
          >
            {filtering && (
              <button type="button" className="btn btn-primary" onClick={() => setParams({})}>
                Show all products
              </button>
            )}
          </EmptyState>
        )}
        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
