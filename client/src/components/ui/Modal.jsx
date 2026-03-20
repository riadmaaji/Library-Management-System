import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

const sizeClass = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

function getFocusableElements(container) {
  if (!(container instanceof HTMLElement)) {
    return [];
  }

  return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    return !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true';
  });
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.descriptionId] — id of element that describes the dialog (e.g. confirm message)
 * @param {import('react').ReactNode} [props.children]
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export function Modal({ isOpen, onClose, title, ariaLabel, descriptionId, children, size = 'md' }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const sizeStyle = sizeClass[size] ?? sizeClass.md;
  const fallbackLabel = ariaLabel ?? title ?? 'Dialog';

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousActive = document.activeElement;
    const id = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const firstFocusable = getFocusableElements(panel)[0];
      (firstFocusable ?? panel)?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(id);
      if (previousActive instanceof HTMLElement) {
        previousActive.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panel = panelRef.current;
      if (!(panel instanceof HTMLElement)) {
        return;
      }

      const focusableElements = getFocusableElements(panel);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const activeInsidePanel = activeElement instanceof Node && panel.contains(activeElement);

      if (!activeInsidePanel) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && (activeElement === firstElement || activeElement === panel)) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && (activeElement === lastElement || activeElement === panel)) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.root} role="presentation">
      <div className={styles.backdrop} onMouseDown={onClose} aria-hidden />
      <div className={styles.positioner}>
        <div
          ref={panelRef}
          className={[styles.panel, sizeStyle].filter(Boolean).join(' ')}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title != null ? titleId : undefined}
          aria-describedby={descriptionId}
          aria-label={title == null ? fallbackLabel : undefined}
          tabIndex={-1}
        >
          {title != null ? (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          ) : null}
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
