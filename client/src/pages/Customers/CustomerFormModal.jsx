import { useEffect, useMemo, useState } from 'react';
import { createCustomer, updateCustomer } from '../../api/services/customerService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import styles from './CustomerFormModal.module.css';

function createInitialValues(customer) {
  return {
    fullName: customer?.fullName ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
  };
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0] ??
    error?.response?.data?.message ??
    fallbackMessage
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function unwrapSavedEntity(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    payload.data != null &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  return payload;
}

function validateForm(values) {
  const errors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  }

  if (!email && !phone) {
    const message = 'Provide at least an email address or a phone number.';
    errors.email = message;
    errors.phone = message;
  }

  if (email && !isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export function CustomerFormModal({ isOpen, onClose, onSaved, customer }) {
  const { showToast } = useToast();
  const [values, setValues] = useState(() => createInitialValues(customer));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(customer);
  const modalTitle = useMemo(() => (isEditMode ? 'Edit Customer' : 'Add Customer'), [isEditMode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(createInitialValues(customer));
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
  }, [isOpen, customer]);

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
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    };

    let savedEntity;
    try {
      if (isEditMode) {
        const raw = await updateCustomer(customer.id, payload);
        savedEntity = unwrapSavedEntity(raw);
      } else {
        const raw = await createCustomer(payload);
        savedEntity = unwrapSavedEntity(raw);
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        isEditMode
          ? 'This customer could not be updated right now. Please try again.'
          : 'This customer could not be created right now. Please try again.',
      );

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
      message: isEditMode
        ? `"${payload.fullName}" was updated successfully.`
        : `"${payload.fullName}" was added to the customer list.`,
    });

    try {
      await onSaved?.(savedEntity);
    } catch {
      showToast({
        type: 'error',
        message: isEditMode
          ? 'The customer was updated, but the customer list could not be refreshed.'
          : 'The customer was created, but the customer list could not be refreshed.',
      });
    } finally {
      onClose();
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.intro}>
          {isEditMode
            ? 'Update the borrower record and keep contact details current for future circulation.'
            : 'Add a new borrower profile with the best contact information you have on hand.'}
        </p>

        {submitError ? (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        ) : null}

        <div className={styles.grid}>
          <Input
            label="Full Name"
            name="fullName"
            value={values.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
            disabled={submitting}
            autoFocus
            placeholder="Alice Johnson"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            disabled={submitting}
            placeholder="alice@example.com"
          />

          <Input
            label="Phone"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
            disabled={submitting}
            placeholder="123-456-7890"
          />
        </div>

        <p className={styles.helperText}>At least one of email or phone is required.</p>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
