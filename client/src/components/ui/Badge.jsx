import styles from './Badge.module.css';

const variantClass = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  info: styles.info,
  neutral: styles.neutral,
};

/**
 * @param {object} props
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} [props.variant='neutral']
 * @param {import('react').ReactNode} [props.children]
 * @param {string} [props.className]
 */
export function Badge({ variant = 'neutral', children, className = '' }) {
  const rootClass = [styles.root, variantClass[variant] ?? styles.neutral, className].filter(Boolean).join(' ');

  return <span className={rootClass}>{children}</span>;
}
