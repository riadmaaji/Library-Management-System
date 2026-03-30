const SHORT_DATE_OPTIONS = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

/**
 * Human-friendly date using the runtime locale. Optional `weekday: 'short'` matches borrow due preview.
 * @param {string | number | Date | null | undefined} value
 * @param {{ weekday?: 'short' }} [options]
 */
export function formatDate(value, { weekday } = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const opts = { ...SHORT_DATE_OPTIONS };
  if (weekday === 'short') {
    opts.weekday = 'short';
  }

  return date.toLocaleDateString(undefined, opts);
}

/**
 * Long weekday + month + day + year (dashboard header, login welcome).
 * @param {string | number | Date} date
 */
export function formatLongDate(date) {
  if (date == null || date === '') {
    return '—';
  }

  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Medium date + short time for activity tables.
 * @param {string | number | Date | null | undefined} isoString
 */
export function formatDateTime(isoString) {
  if (isoString == null || isoString === '') {
    return '—';
  }

  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * USD with two fraction digits. Use `omitIfNonPositive` for penalty-style columns (zero → em dash).
 * @param {unknown} amount
 * @param {{ omitIfNonPositive?: boolean }} [options]
 */
export function formatCurrency(amount, { omitIfNonPositive = false } = {}) {
  if (amount == null || amount === '') {
    return '—';
  }

  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return '—';
  }
  if (omitIfNonPositive && n <= 0) {
    return '—';
  }

  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
