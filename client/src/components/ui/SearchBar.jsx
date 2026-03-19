import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Input } from './Input';
import styles from './SearchBar.module.css';

const DEBOUNCE_MS = 300;

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Local draft updates on every keystroke; `onChange` receives the debounced query (300ms).
 *
 * @param {object} props
 * @param {string} [props.value] When the parent updates this (e.g. clear filters), the field syncs.
 * @param {(query: string) => void} [props.onChange]
 * @param {string} [props.placeholder]
 * @param {string} [props.name]
 * @param {string} [props.id]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.autoFocus]
 * @param {string} [props.className]
 * @param {string} [props.inputClassName]
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  className = '',
  inputClassName = '',
  autoComplete = 'off',
  spellCheck = false,
  ...inputProps
}) {
  const [draft, setDraft] = useState(() => value ?? '');
  const [prevValue, setPrevValue] = useState(value);
  const debounced = useDebounce(draft, DEBOUNCE_MS);
  const onChangeRef = useRef(onChange);
  const hasMountedRef = useRef(false);
  const lastUpdateWasUserInputRef = useRef(false);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value ?? '');
  }

  useLayoutEffect(() => {
    lastUpdateWasUserInputRef.current = false;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!lastUpdateWasUserInputRef.current) {
      return;
    }

    onChangeRef.current?.(debounced);
  }, [debounced]);

  return (
    <Input
      className={[styles.root, className].filter(Boolean).join(' ')}
      inputClassName={inputClassName}
      label="Search"
      type="search"
      placeholder={placeholder}
      value={draft}
      onChange={(e) => {
        lastUpdateWasUserInputRef.current = true;
        setDraft(e.target.value);
      }}
      icon={<SearchIcon />}
      autoComplete={autoComplete}
      spellCheck={spellCheck}
      {...inputProps}
    />
  );
}
