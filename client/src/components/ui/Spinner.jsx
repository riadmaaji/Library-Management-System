import styles from './Spinner.module.css';

const sizeClass = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 * @param {string} [props['aria-label']]
 * @param {boolean} [props['aria-hidden']]
 */
export function Spinner({ size = 'md', className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) {
  const rootClass = [styles.root, sizeClass[size] ?? sizeClass.md, className].filter(Boolean).join(' ');

  if (ariaHidden) {
    return <span className={rootClass} aria-hidden />;
  }

  return <span className={rootClass} role="status" aria-label={ariaLabel ?? 'Loading'} />;
}
