import { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void | boolean | Promise<void | boolean>} props.onConfirm
 * @param {string} [props.title]
 * @param {string} [props.ariaLabel]
 * @param {import('react').ReactNode} [props.message]
 * @param {string} [props.confirmText='Confirm']
 * @param {'danger'|'warning'} [props.variant='danger']
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  ariaLabel,
  message,
  confirmText = 'Confirm',
  variant = 'danger',
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmButtonVariant = variant === 'warning' ? 'primary' : 'danger';

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onConfirm();

      if (result !== false) {
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      ariaLabel={ariaLabel ?? title ?? 'Confirmation dialog'}
      size="sm"
    >
      {message != null ? <div className={styles.message}>{message}</div> : null}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={confirmButtonVariant}
          className={variant === 'warning' ? styles.confirmWarning : undefined}
          onClick={handleConfirm}
          loading={isSubmitting}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
