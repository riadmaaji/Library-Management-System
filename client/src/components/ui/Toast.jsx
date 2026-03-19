import styles from './Toast.module.css';

const TYPE_CLASS = {
  success: styles.success,
  error: styles.error,
  info: styles.info,
  warning: styles.warning,
};

export function Toast({ id, message, type, exiting, onDismiss, onExitComplete }) {
  const typeClass = TYPE_CLASS[type] ?? styles.info;

  return (
    <div
      className={`${styles.root} ${typeClass} ${exiting ? styles.exiting : ''}`}
      onAnimationEnd={(event) => {
        if (!exiting || event.target !== event.currentTarget) {
          return;
        }

        onExitComplete(id);
      }}
    >
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>
    </div>
  );
}
