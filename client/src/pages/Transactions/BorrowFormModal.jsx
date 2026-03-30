import { useEffect, useMemo, useState } from 'react';
import { borrowBook } from '../../api/services/borrowService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import styles from './BorrowFormModal.module.css';

const DEFAULT_BORROW_DAYS = '14';

function createInitialValues() {
  return {
    customerId: '',
    bookId: '',
    borrowDays: DEFAULT_BORROW_DAYS,
  };
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0] ??
    error?.response?.data?.message ??
    fallbackMessage
  );
}

function isAvailableBook(book) {
  const n = Number(book?.availableCopies);
  return Number.isFinite(n) && n > 0;
}

function validateForm(values) {
  const errors = {};

  if (!values.customerId.trim()) {
    errors.customerId = 'Select a customer.';
  }

  if (!values.bookId.trim()) {
    errors.bookId = 'Select a book with an available copy.';
  }

  const daysRaw = values.borrowDays.trim();
  if (!daysRaw) {
    errors.borrowDays = 'Borrow duration is required.';
  } else if (!/^\d+$/.test(daysRaw)) {
    errors.borrowDays = 'Use a positive whole number of days.';
  } else {
    const n = Number(daysRaw);
    if (!Number.isInteger(n) || n < 1) {
      errors.borrowDays = 'Borrow duration must be a positive integer.';
    }
  }

  return errors;
}

export function BorrowFormModal({
  isOpen,
  onClose,
  onBorrowed,
  customers = [],
  books = [],
  onAddCustomer,
  pendingCustomerId,
  onPendingCustomerIdConsumed,
}) {
  const { showToast } = useToast();
  const [values, setValues] = useState(createInitialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableBooks = useMemo(() => {
    return [...books]
      .filter(isAvailableBook)
      .sort((a, b) => String(a.title ?? '').localeCompare(String(b.title ?? ''), undefined, { sensitivity: 'base' }));
  }, [books]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) =>
      String(a.fullName ?? '').localeCompare(String(b.fullName ?? ''), undefined, { sensitivity: 'base' }),
    );
  }, [customers]);

  const duePreview = useMemo(() => {
    const daysRaw = values.borrowDays.trim();
    if (!/^\d+$/.test(daysRaw)) {
      return null;
    }
    const n = Number(daysRaw);
    if (!Number.isInteger(n) || n < 1) {
      return null;
    }
    const due = new Date();
    due.setDate(due.getDate() + n);
    return due;
  }, [values.borrowDays]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(createInitialValues());
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !pendingCustomerId) {
      return;
    }

    setValues((current) => ({ ...current, customerId: pendingCustomerId }));
    setErrors((current) => ({ ...current, customerId: undefined }));
    setSubmitError('');
    onPendingCustomerIdConsumed?.();
  }, [isOpen, pendingCustomerId, onPendingCustomerIdConsumed]);

  function handleCustomerChange(event) {
    const { value } = event.target;
    setValues((current) => ({ ...current, customerId: value }));
    setErrors((current) => ({ ...current, customerId: undefined }));
    setSubmitError('');
  }

  function handleBookChange(event) {
    const { value } = event.target;
    setValues((current) => ({ ...current, bookId: value }));
    setErrors((current) => ({ ...current, bookId: undefined }));
    setSubmitError('');
  }

  function handleBorrowDaysChange(event) {
    const { value } = event.target;
    setValues((current) => ({ ...current, borrowDays: value }));
    setErrors((current) => ({ ...current, borrowDays: undefined }));
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    const payload = {
      customerId: values.customerId.trim(),
      bookId: values.bookId.trim(),
      borrowDays: Number(values.borrowDays.trim()),
    };

    try {
      await borrowBook(payload);
    } catch (error) {
      const message = getErrorMessage(error, 'This borrow could not be recorded right now. Please try again.');

      if (error?.response) {
        setSubmitError(message);
      } else {
        showToast({
          type: 'error',
          message,
        });
      }

      setSubmitting(false);
      return;
    }

    showToast({
      type: 'success',
      message: 'The book was checked out successfully.',
    });

    try {
      await onBorrowed?.();
    } catch {
      showToast({
        type: 'error',
        message: 'The borrow was recorded, but the transactions list could not be refreshed.',
      });
    } finally {
      onClose();
      setSubmitting(false);
    }
  }

  const customerSelectId = 'borrow-customer';
  const bookSelectId = 'borrow-book';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Borrow" size="md">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.intro}>
          Choose a borrower and a title with copies on the shelf, then set how long the loan should run. The due
          date updates as you adjust the duration.
        </p>

        {submitError ? (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        ) : null}

        <div className={styles.grid}>
          <div className={[styles.fieldGroup, styles.fieldGroupFull].join(' ')}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor={customerSelectId}>
                Customer
                <span aria-hidden="true"> *</span>
              </label>
              {onAddCustomer ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAddCustomer}
                  disabled={submitting}
                >
                  Add customer
                </Button>
              ) : null}
            </div>
            <div
              className={[
                styles.field,
                errors.customerId ? styles.fieldError : '',
                submitting ? styles.fieldDisabled : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <select
                id={customerSelectId}
                className={styles.select}
                value={values.customerId}
                onChange={handleCustomerChange}
                disabled={submitting}
                required
                aria-invalid={errors.customerId ? 'true' : undefined}
                aria-describedby={errors.customerId ? `${customerSelectId}-error` : undefined}
              >
                <option value="">Select a customer…</option>
                {sortedCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            {errors.customerId ? (
              <p id={`${customerSelectId}-error`} className={styles.errorText} role="alert">
                {errors.customerId}
              </p>
            ) : null}
          </div>

          <div className={[styles.fieldGroup, styles.fieldGroupFull].join(' ')}>
            <label className={styles.label} htmlFor={bookSelectId}>
              Book
              <span aria-hidden="true"> *</span>
            </label>
            <div
              className={[
                styles.field,
                errors.bookId ? styles.fieldError : '',
                submitting ? styles.fieldDisabled : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <select
                id={bookSelectId}
                className={styles.select}
                value={values.bookId}
                onChange={handleBookChange}
                disabled={submitting || availableBooks.length === 0}
                required
                aria-invalid={errors.bookId ? 'true' : undefined}
                aria-describedby={errors.bookId ? `${bookSelectId}-error` : undefined}
              >
                <option value="">
                  {availableBooks.length === 0 ? 'No copies available' : 'Select a book…'}
                </option>
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                    {b.author ? ` — ${b.author}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.bookId ? (
              <p id={`${bookSelectId}-error`} className={styles.errorText} role="alert">
                {errors.bookId}
              </p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <Input
              label="Borrow duration (days)"
              name="borrowDays"
              type="number"
              min="1"
              step="1"
              value={values.borrowDays}
              onChange={handleBorrowDaysChange}
              error={errors.borrowDays}
              required
              disabled={submitting}
              hint="Whole days only; default is 14."
            />
          </div>

          <div className={styles.fieldGroup}>
            <p className={styles.label}>Due date preview</p>
            {duePreview ? (
              <p className={styles.duePreview}>
                If checked out now, this loan would be due on{' '}
                <span className={styles.dueDate}>{formatDate(duePreview, { weekday: 'short' })}</span>.
              </p>
            ) : (
              <p className={[styles.duePreview, styles.duePreviewMuted].join(' ')}>
                Enter a valid loan length to preview the due date.
              </p>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Check out
          </Button>
        </div>
      </form>
    </Modal>
  );
}
