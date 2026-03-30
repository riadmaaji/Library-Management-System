import { useId } from 'react';
import styles from './Input.module.css';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.id]
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} [props.className]
 * @param {string} [props.inputClassName]
 * @param {import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input({
  label,
  id: idProp,
  error,
  hint,
  icon,
  className = '',
  inputClassName = '',
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
  ...inputProps
}) {
  const uid = useId();
  const id = idProp ?? `field-${uid}`;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const describedBy = [hintId, errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

  const fieldClass = [
    styles.field,
    error ? styles.error : '',
    disabled ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true"> *</span>
        ) : null}
      </label>
      <div className={fieldClass}>
        {icon ? (
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          className={[styles.input, inputClassName].filter(Boolean).join(' ')}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          aria-required={required ? 'true' : undefined}
          {...inputProps}
        />
      </div>
      {error ? (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
