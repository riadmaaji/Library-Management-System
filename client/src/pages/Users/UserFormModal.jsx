import { useEffect, useId, useMemo, useState } from 'react';
import { createUser, updateUser } from '../../api/services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import styles from './UserFormModal.module.css';
import { getErrorMessage } from './usersUtils';

const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
};

function createInitialValues(user) {
  const role =
    user?.role && String(user.role).toUpperCase() === ROLES.ADMIN ? ROLES.ADMIN : ROLES.EMPLOYEE;

  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role,
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Heuristic mapping: server returns `errors` as plain English strings from
// `validateRequired`, `validateEmail`, `assertValidRole`, etc. If those messages
// change, adjust the matchers below so inline field hints stay accurate.
function mapApiErrorsToFields(apiErrors) {
  const fields = {};
  const unmapped = [];

  if (!Array.isArray(apiErrors)) {
    return { fields, unmapped };
  }

  for (const raw of apiErrors) {
    const msg = String(raw);
    const l = msg.toLowerCase();
    let assigned = false;

    if ((l.includes('invalid') && l.includes('role')) || l.includes('admin or employee')) {
      if (!fields.role) {
        fields.role = msg;
        assigned = true;
      }
    } else if (l.includes('email')) {
      if (!fields.email) {
        fields.email = msg;
        assigned = true;
      }
    } else if (l.includes('password')) {
      if (!fields.password) {
        fields.password = msg;
        assigned = true;
      }
    } else if (/^name\s|^name is\b/.test(l)) {
      if (!fields.name) {
        fields.name = msg;
        assigned = true;
      }
    }

    if (!assigned) {
      unmapped.push(msg);
    }
  }

  return { fields, unmapped };
}

function validateForm(values, isEditMode) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const password = values.password.trim();

  if (!name) {
    errors.name = 'Name is required.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!isEditMode) {
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
  } else if (password && password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!values.role || ![ROLES.ADMIN, ROLES.EMPLOYEE].includes(values.role)) {
    errors.role = 'Choose a valid role.';
  }

  return errors;
}

export function UserFormModal({ isOpen, onClose, onSaved, user, isEditingSelf = false }) {
  const { showToast } = useToast();
  const roleSelectId = useId();
  const [values, setValues] = useState(() => createInitialValues(user));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(user);
  const roleLocked = isEditMode && isEditingSelf;
  const modalTitle = useMemo(() => (isEditMode ? 'Edit User' : 'Add User'), [isEditMode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(createInitialValues(user));
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
  }, [isOpen, user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  }

  function handleRoleChange(event) {
    const { value } = event.target;
    setValues((current) => ({ ...current, role: value }));
    setErrors((current) => ({ ...current, role: undefined }));
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(values, isEditMode);
    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    const name = values.name.trim();
    const email = values.email.trim();
    const password = values.password.trim();

    const fallbackMessage = isEditMode
      ? 'This user could not be updated right now. Please try again.'
      : 'This user could not be created right now. Please try again.';

    try {
      if (isEditMode) {
        const body = {
          name,
          email,
          role: values.role,
        };
        if (password) {
          body.password = password;
        }
        await updateUser(user.id, body);
      } else {
        await createUser({
          name,
          email,
          password,
          role: values.role,
        });
      }

      showToast({
        type: 'success',
        message: isEditMode
          ? `"${name}" was updated successfully.`
          : `"${name}" was added and can sign in.`,
      });

      try {
        await onSaved?.();
      } catch {
        showToast({
          type: 'error',
          message: isEditMode
            ? 'The user was updated, but the list could not be refreshed.'
            : 'The user was created, but the list could not be refreshed.',
        });
      } finally {
        onClose();
      }
    } catch (error) {
      if (!error?.response) {
        showToast({
          type: 'error',
          message: getErrorMessage(error, fallbackMessage),
        });
      } else {
        const data = error.response.data;
        const list = Array.isArray(data?.errors) ? data.errors : [];
        if (list.length > 0) {
          const { fields, unmapped } = mapApiErrorsToFields(list);
          setErrors((prev) => ({ ...prev, ...fields }));
          setSubmitError(unmapped.length > 0 ? unmapped.join(' ') : '');
        } else {
          const msg = getErrorMessage(error, fallbackMessage);
          const lower = String(msg).toLowerCase();
          if (lower.includes('email') && lower.includes('already')) {
            setErrors((prev) => ({ ...prev, email: msg }));
            setSubmitError('');
          } else {
            setSubmitError(msg);
          }
        }
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
            ? 'Update account details and access level. Password changes apply immediately.'
            : 'Create a new account for the admin app. They will sign in with the email and password you set.'}
        </p>

        {submitError ? (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        ) : null}

        <div className={styles.grid}>
          <div className={[styles.fieldGroup, styles.fieldGroupFull].join(' ')}>
            <Input
              label="Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
              required
              disabled={submitting}
              autoFocus
              placeholder="Jordan Lee"
            />
          </div>

          <div className={[styles.fieldGroup, styles.fieldGroupFull].join(' ')}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              required
              disabled={submitting}
              placeholder="jordan@library.org"
            />
          </div>

          <div className={[styles.fieldGroup, styles.fieldGroupFull].join(' ')}>
            <Input
              label={isEditMode ? 'New password (optional)' : 'Password'}
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              required={!isEditMode}
              disabled={submitting}
              autoComplete="new-password"
              placeholder={isEditMode ? '••••••••' : 'At least 6 characters'}
              hint={isEditMode ? undefined : 'Minimum 6 characters.'}
            />
            {isEditMode ? (
              <p className={styles.helperText}>Leave blank to keep the current password.</p>
            ) : null}
          </div>

          <div className={[styles.fieldGroup, styles.fieldGroupFull].join(' ')}>
            <label className={styles.label} htmlFor={roleSelectId}>
              Role
              <span aria-hidden="true"> *</span>
            </label>
            <div
              className={[
                styles.field,
                errors.role ? styles.fieldError : '',
                submitting || roleLocked ? styles.fieldDisabled : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <select
                id={roleSelectId}
                name="role"
                className={styles.select}
                value={values.role}
                onChange={handleRoleChange}
                disabled={submitting || roleLocked}
                required
                aria-invalid={errors.role ? 'true' : undefined}
                aria-describedby={errors.role ? `${roleSelectId}-error` : undefined}
              >
                <option value={ROLES.EMPLOYEE}>Employee</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
            </div>
            {errors.role ? (
              <p id={`${roleSelectId}-error`} className={styles.errorText} role="alert">
                {errors.role}
              </p>
            ) : null}
            {roleLocked ? (
              <p className={styles.helperText}>
                Your role cannot be changed here so you do not lose admin access by mistake.
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
