import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import styles from './LoginPage.module.css';

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {hidden ? <path d="M4 4 20 20" /> : null}
    </svg>
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  if (loading) {
    return (
      <main className={styles.shell}>
        <div className={styles.backgroundGlow} aria-hidden="true" />
        <Card className={styles.card} padding="lg">
          <div className={styles.loadingState}>
            <Spinner size="lg" aria-label="Checking saved session" />
            <p className={styles.loadingText}>Restoring your saved library session.</p>
          </div>
        </Card>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function validateForm() {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    return nextErrors;
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setFormError('');
    setErrors((current) => ({ ...current, email: undefined }));
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setFormError('');
    setErrors((current) => ({ ...current, password: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message;

      if (error?.response) {
        setFormError(message ?? 'Unable to sign in with those credentials.');
      } else {
        showToast({
          type: 'error',
          message: 'Network error. Please check that the server is running and try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <div className={styles.backgroundLines} aria-hidden="true" />

      <Card
        className={styles.card}
        title="Library MS"
        subtitle="Sign in to continue your catalog workflow."
        padding="lg"
      >
        <div className={styles.content}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {formError ? (
              <div className={styles.errorBanner} role="alert">
                {formError}
              </div>
            ) : null}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              icon={<EmailIcon />}
              required
              disabled={submitting}
            />

            <div className={styles.passwordWrapper}>
              <label className={styles.passwordLabel} htmlFor="login-password">
                Password <span aria-hidden="true">*</span>
              </label>
              <div
                className={[
                  styles.passwordField,
                  errors.password ? styles.passwordFieldError : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles.passwordIcon} aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  className={styles.passwordInput}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={submitting}
                  required
                  aria-invalid={errors.password ? 'true' : undefined}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={submitting}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
              {errors.password ? (
                <p id="login-password-error" className={styles.passwordError} role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Sign In
            </Button>
          </form>

          <div className={styles.note}>
            <span className={styles.noteLabel}>Demo credentials</span>
            <strong>Admin: admin@mozna.com / password</strong>
            <strong>Employee: maaji.riad@mozna.com / password</strong>
          </div>
        </div>
      </Card>
    </main>
  );
}
