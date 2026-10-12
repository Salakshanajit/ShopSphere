import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;

  if (user && !submitting) return <Navigate to={from?.pathname || '/'} replace />;

  const change = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const found = {};
    if (values.name.trim().length < 2) found.name = 'Name must be at least 2 characters.';
    if (!EMAIL_RE.test(values.email.trim())) found.email = 'Enter a valid email address.';
    if (values.password.length < 8) found.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
      found.password = 'Password needs at least one letter and one number.';
    }
    if (values.confirm !== values.password) found.confirm = 'Passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const created = await register(values.name.trim(), values.email.trim(), values.password);
      toast.success(`Account created. Welcome, ${created.name.split(' ')[0]}!`);
      navigate(from ? `${from.pathname}${from.search || ''}` : '/', { replace: true });
    } catch (error) {
      setFormError(error.message);
      if (error.errors) setErrors(error.errors);
      setSubmitting(false);
    }
  }

  const field = (name, label, type, autoComplete, hint) => (
    <div className={`form-group ${errors[name] ? 'has-error' : ''}`}>
      <label htmlFor={`reg-${name}`}>{label}</label>
      <input
        id={`reg-${name}`}
        type={type}
        autoComplete={autoComplete}
        value={values[name]}
        onChange={change(name)}
        aria-invalid={errors[name] ? 'true' : undefined}
        aria-describedby={errors[name] ? `reg-${name}-error` : undefined}
      />
      {hint && !errors[name] && <p className="hint">{hint}</p>}
      {errors[name] && (
        <p className="field-error" id={`reg-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="container page auth-page">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <p className="muted">It only takes a minute.</p>

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {field('name', 'Full name', 'text', 'name')}
          {field('email', 'Email', 'email', 'email')}
          {field('password', 'Password', 'password', 'new-password', 'At least 8 characters with a letter and a number.')}
          {field('confirm', 'Confirm password', 'password', 'new-password')}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
