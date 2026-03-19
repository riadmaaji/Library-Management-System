import styles from './Card.module.css';

const paddingClass = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

/**
 * @param {object} props
 * @param {import('react').ReactNode} [props.children]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {import('react').ReactNode} [props.actions]
 * @param {'sm'|'md'|'lg'} [props.padding='md']
 * @param {boolean} [props.hover=false]
 * @param {string} [props.className]
 * @param {import('react').HTMLAttributes<HTMLDivElement>} props
 */
export function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 'md',
  hover = false,
  className = '',
  ...rest
}) {
  const pad = paddingClass[padding] ?? styles.paddingMd;
  const rootClass = [styles.root, pad, hover ? styles.interactive : '', className].filter(Boolean).join(' ');

  const hasHeader = title != null || subtitle != null || actions != null;

  return (
    <div className={rootClass} {...rest}>
      {hasHeader ? (
        <div className={styles.header}>
          <div className={styles.titles}>
            {title != null ? <h2 className={styles.title}>{title}</h2> : null}
            {subtitle != null ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions != null ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
