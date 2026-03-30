import styles from './Table.module.css';

const SKELETON_ROWS = 5;

function EmptyTableIcon() {
  return (
    <svg
      className={styles.emptyIcon}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 4v16" />
    </svg>
  );
}

/**
 * Generic data table: headers and cells from `columns` and `data`, with loading and empty states.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, render?: (row: object) => import('react').ReactNode }>} [props.columns]
 * @param {object[]} [props.data]
 * @param {string} [props.emptyMessage]
 * @param {boolean} [props.loading]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function Table({
  columns = [],
  data = [],
  emptyMessage = 'Nothing here yet.',
  loading = false,
  ariaLabel,
  className = '',
}) {
  const colCount = Math.max(columns.length, 1);

  const wrapClass = [styles.wrap, className].filter(Boolean).join(' ');

  return (
    <div
      className={wrapClass}
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className={styles.loadingStatus} role="status" aria-live="polite">
          Loading table data.
        </span>
      ) : null}
      <table className={styles.table}>
        <thead className={styles.head}>
          <tr>
            {columns.length > 0 ? (
              columns.map((col) => (
                <th key={col.key} scope="col" className={styles.th}>
                  {col.label}
                </th>
              ))
            ) : (
              <th scope="col" className={styles.th}>
                &nbsp;
              </th>
            )}
          </tr>
        </thead>
        <tbody className={styles.body}>
          {loading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
              <tr key={`loading-${rowIndex}`} className={styles.skeletonRow} aria-hidden>
                {columns.length > 0 ? (
                  columns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      <span className={styles.skeletonBar} />
                    </td>
                  ))
                ) : (
                  <td className={styles.td}>
                    <span className={styles.skeletonBar} />
                  </td>
                )}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={colCount}>
                <div className={styles.emptyInner}>
                  <EmptyTableIcon />
                  <p className={styles.emptyMessage}>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row?.id != null ? String(row.id) : rowIndex}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.td}>
                    {col.render != null ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
