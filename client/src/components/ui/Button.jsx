import { Spinner } from './Spinner';
import styles from './Button.module.css';

const variantClass = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  ghost: styles.ghost,
};

const sizeClass = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const spinnerSize = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 * @param {import('react').ReactNode} [props.icon]
 * @param {import('react').ReactNode} [props.children]
 * @param {string} [props.className]
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const rootClass = [
    styles.root,
    variantClass[variant] ?? variantClass.primary,
    sizeClass[size] ?? sizeClass.md,
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={rootClass}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size={spinnerSize[size] ?? 'sm'} aria-hidden={true} />
      ) : icon ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
