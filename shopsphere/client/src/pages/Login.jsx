import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const notice = location.state?.message;

  // Already logged in: go straight to the right place.
  if (user && !submitting) return <Navigate to={from?.pathname || (user.role === 'ADMIN' ? '/admin' : '/')} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const found = {};
    if (!EMAIL_RE.test(email.trim())) found.email = 'Enter a valid email address.';
    if (!password) found.password = 'Enter your password.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password);
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      navigate(from ? `${from.pathname}${from.search || ''}` : loggedIn.role === 'ADMIN' ? '/admin' : '/', { replace: true });
    } catch (error) {
      setFormError(error.message);
      if (error.errors) setErrors(error.errors);
      setSubmitting(false);
    }
  }

  return (
    <div className="container page auth-page">
      <div className="card auth-card">
        <h1>Log in</h1>
        <p className="muted">Welcome back! Log in to see your cart and orders.</p>

        {notice && <div className="alert alert-info">{notice}</div>}
        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p className="field-error" id="email-error">
                {errors.email}
              </p>
            )}
          </div>
          <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p className="field-error" id="password-error">
                {errors.password}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          New to ShopSphere? <Link to="/register" state={location.state}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
