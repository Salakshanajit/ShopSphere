import { useState } from 'react';
import Modal from './Modal';
import SafeImage from './SafeImage';

const EMPTY = { name: '', description: '', price: '', category: '', imageUrl: '', stock: '', rating: '' };

// Same rules as the server (the server always validates again).
function validate(values) {
  const errors = {};
  const price = Number(values.price);
  const stock = Number(values.stock);
  const rating = Number(values.rating);

  if (values.name.trim().length < 2 || values.name.trim().length > 150) errors.name = 'Name must be 2 to 150 characters.';
  if (values.description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
  if (values.category.trim().length < 2) errors.category = 'Category must be at least 2 characters.';
  if (values.price === '' || !Number.isFinite(price) || price <= 0) errors.price = 'Enter a price greater than 0.';
  else if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) errors.price = 'Use at most 2 decimal places.';
  if (values.stock === '' || !Number.isInteger(stock) || stock < 0) errors.stock = 'Stock must be a whole number (0 or more).';
  if (values.imageUrl.trim() && !/^(https?:\/\/|\/)\S+$/i.test(values.imageUrl.trim())) {
    errors.imageUrl = 'Use a link starting with http://, https:// or /';
  }
  if (values.rating !== '' && (!Number.isFinite(rating) || rating < 0 || rating > 5)) errors.rating = 'Rating must be between 0 and 5.';
  return errors;
}

// Add / edit product dialog. `onSave(payload)` must return a promise and may throw an ApiError.
export default function ProductForm({ product, categories = [], onSave, onCancel }) {
  const [values, setValues] = useState(
    product
      ? {
          name: product.name,
          description: product.description,
          price: String(product.price),
          category: product.category,
          imageUrl: product.imageUrl || '',
          stock: String(product.stock),
          rating: product.rating ? String(product.rating) : '',
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSave({
        name: values.name.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        category: values.category.trim(),
        imageUrl: values.imageUrl.trim(),
        stock: Number(values.stock),
        rating: values.rating === '' ? 0 : Number(values.rating),
      });
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      setFormError(error.message);
      setSaving(false);
    }
  }

  const field = (name, label, input, hint) => (
    <div className={`form-group ${errors[name] ? 'has-error' : ''}`}>
      <label htmlFor={`pf-${name}`}>{label}</label>
      {input}
      {hint && !errors[name] && <p className="hint">{hint}</p>}
      {errors[name] && (
        <p className="field-error" id={`pf-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  const common = (name) => ({
    id: `pf-${name}`,
    value: values[name],
    onChange: change(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `pf-${name}-error` : undefined,
  });

  return (
    <Modal
      title={product ? 'Edit product' : 'Add product'}
      onClose={onCancel}
      wide
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : product ? 'Save changes' : 'Add product'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}
        {field('name', 'Product name', <input type="text" maxLength={150} data-autofocus {...common('name')} />)}
        {field('description', 'Description', <textarea rows={4} maxLength={2000} {...common('description')} />)}
        <div className="form-row">
          {field('price', 'Price', <input type="number" min="0" step="0.01" inputMode="decimal" {...common('price')} />)}
          {field('stock', 'Stock quantity', <input type="number" min="0" step="1" inputMode="numeric" {...common('stock')} />)}
        </div>
        <div className="form-row">
          {field(
            'category',
            'Category',
            <>
              <input type="text" list="category-options" maxLength={60} {...common('category')} />
              <datalist id="category-options">
                {categories.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </>,
            'Pick an existing category or type a new one.'
          )}
          {field('rating', 'Rating (optional)', <input type="number" min="0" max="5" step="0.1" {...common('rating')} />, '0 to 5')}
        </div>
        {field(
          'imageUrl',
          'Image URL',
          <input type="text" placeholder="https://... or /products/name.svg" maxLength={500} {...common('imageUrl')} />,
          'Leave empty to show a placeholder image.'
        )}
        {values.imageUrl.trim() && !errors.imageUrl && (
          <div className="image-preview">
            <SafeImage src={values.imageUrl.trim()} alt="Preview of the product" />
          </div>
        )}
      </form>
    </Modal>
  );
}
