import { useEffect, useMemo, useState } from 'react';
import { createBook, updateBook } from '../../api/services/bookService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import styles from './BookFormModal.module.css';

function createInitialValues(book) {
  return {
    title: book?.title ?? '',
    author: book?.author ?? '',
    isbn: book?.isbn ?? '',
    category: book?.category ?? '',
    totalCopies: book?.totalCopies != null ? String(book.totalCopies) : '1',
  };
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0] ??
    error?.response?.data?.message ??
    fallbackMessage
  );
}

function validateForm(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!values.author.trim()) {
    errors.author = 'Author is required.';
  }

  if (!values.isbn.trim()) {
    errors.isbn = 'ISBN is required.';
  }

  if (!values.category.trim()) {
    errors.category = 'Category is required.';
  }

  if (!values.totalCopies.trim()) {
    errors.totalCopies = 'Total copies is required.';
  } else if (!/^\d+$/.test(values.totalCopies.trim()) || Number(values.totalCopies.trim()) < 1) {
    errors.totalCopies = 'Total copies must be a positive integer.';
  }

  return errors;
}

export function BookFormModal({ isOpen, onClose, onSaved, book }) {
  const { showToast } = useToast();
  const [values, setValues] = useState(() => createInitialValues(book));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(book);
  const modalTitle = useMemo(() => (isEditMode ? 'Edit Book' : 'Add Book'), [isEditMode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(createInitialValues(book));
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
  }, [isOpen, book]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
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
      title: values.title.trim(),
      author: values.author.trim(),
      isbn: values.isbn.trim(),
      category: values.category.trim(),
      totalCopies: values.totalCopies.trim(),
    };

    try {
      if (isEditMode) {
        await updateBook(book.id, payload);
      } else {
        await createBook(payload);
      }

      showToast({
        type: 'success',
        message: isEditMode
          ? `"${payload.title}" was updated successfully.`
          : `"${payload.title}" was added to the catalog.`,
      });

      await onSaved?.();
      onClose();
    } catch (error) {
      const message = getErrorMessage(
        error,
        isEditMode
          ? 'This book could not be updated right now. Please try again.'
          : 'This book could not be created right now. Please try again.'
      );

      if (error?.response) {
        setSubmitError(message);
      } else {
        showToast({
          type: 'error',
          message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.intro}>
          {isEditMode
            ? 'Adjust the bibliographic details or update the total copy count for this title.'
            : 'Add a new title to the catalog with its category and the number of copies available.'}
        </p>

        {submitError ? (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            label="Title"
            name="title"
            value={values.title}
            onChange={handleChange}
            error={errors.title}
            required
            disabled={submitting}
            autoFocus
          />

          <Input
            label="Author"
            name="author"
            value={values.author}
            onChange={handleChange}
            error={errors.author}
            required
            disabled={submitting}
          />

          <Input
            label="ISBN"
            name="isbn"
            value={values.isbn}
            onChange={handleChange}
            error={errors.isbn}
            required
            disabled={submitting}
          />

          <Input
            label="Category"
            name="category"
            value={values.category}
            onChange={handleChange}
            error={errors.category}
            required
            disabled={submitting}
          />

          <Input
            label="Total Copies"
            name="totalCopies"
            type="number"
            min="1"
            step="1"
            value={values.totalCopies}
            onChange={handleChange}
            error={errors.totalCopies}
            required
            disabled={submitting}
            hint="Use whole numbers only."
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Save Changes' : 'Create Book'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
