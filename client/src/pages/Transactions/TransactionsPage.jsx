import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBorrows, returnBook } from '../../api/services/borrowService';
import { BorrowFormModal } from './BorrowFormModal';
import { getBooks } from '../../api/services/bookService';
import { getCustomers } from '../../api/services/customerService';
import { CustomerFormModal } from '../Customers/CustomerFormModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './TransactionsPage.module.css';

const STATUS_FILTER_ALL = 'all';
const STATUS_FILTER_ACTIVE = 'active';
const STATUS_FILTER_RETURNED = 'returned';

const STATUS_TABS = [
  { value: STATUS_FILTER_ALL, label: 'All' },
  { value: STATUS_FILTER_ACTIVE, label: 'Active' },
  { value: STATUS_FILTER_RETURNED, label: 'Returned' },
];

function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function formatLoadFailureMessage(failedResources) {
  if (failedResources.length === 0) {
    return '';
  }

  if (failedResources.length === 1) {
    return `Could not load ${failedResources[0]}. Some transactions data may be unavailable.`;
  }

  if (failedResources.length === 2) {
    return `Could not load ${failedResources[0]} and ${failedResources[1]}. Some transactions data may be unavailable.`;
  }

  return 'Could not load transactions data completely. Some records may be unavailable.';
}

function normalizeQuery(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isBorrowReturned(borrow) {
  return borrow?.returnedAt != null && borrow.returnedAt !== '';
}

function isOverdueBorrow(borrow) {
  if (isBorrowReturned(borrow)) {
    return false;
  }

  if (borrow?.dueAt == null) {
    return false;
  }

  const due = new Date(borrow.dueAt);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function getBorrowStatusMeta(borrow) {
  if (isBorrowReturned(borrow)) {
    return { label: 'Returned', variant: 'neutral' };
  }

  if (isOverdueBorrow(borrow)) {
    return { label: 'Overdue', variant: 'danger' };
  }

  return { label: 'Active', variant: 'success' };
}

/** Matches server default `PENALTY_PER_DAY` in `server/src/config/env.js` for preview only. */
const PENALTY_PER_DAY_PREVIEW = 2;

function getReturnOverduePreview(borrow) {
  if (!borrow?.dueAt || isBorrowReturned(borrow)) {
    return null;
  }

  const due = new Date(borrow.dueAt);
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const now = Date.now();
  if (now <= due.getTime()) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const lateDays = Math.ceil((now - due.getTime()) / msPerDay);
  const predictedPenalty = lateDays * PENALTY_PER_DAY_PREVIEW;

  return { lateDays, predictedPenalty };
}

function getReturnErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0] ??
    error?.response?.data?.message ??
    fallbackMessage
  );
}

function BorrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M12 13V7" />
      <path d="m9 10 3-3 3 3" />
    </svg>
  );
}

export default function TransactionsPage() {
  const { showToast } = useToast();
  const [borrows, setBorrows] = useState([]);
  const [books, setBooks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowsLoadFailed, setBorrowsLoadFailed] = useState(false);
  const [booksLoadFailed, setBooksLoadFailed] = useState(false);
  const [customersLoadFailed, setCustomersLoadFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowCustomerFormOpen, setBorrowCustomerFormOpen] = useState(false);
  const [pendingBorrowCustomerId, setPendingBorrowCustomerId] = useState(null);
  const [pendingReturnBorrow, setPendingReturnBorrow] = useState(null);

  const refreshCirculationData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      const [borrowsResult, booksResult, customersResult] = await Promise.allSettled([
        getBorrows(),
        getBooks(),
        getCustomers(),
      ]);

      const failedResources = [];

      if (borrowsResult.status === 'fulfilled') {
        setBorrows(unwrapList(borrowsResult.value));
        setBorrowsLoadFailed(false);
      } else {
        setBorrows([]);
        setBorrowsLoadFailed(true);
        failedResources.push('borrowing records');
      }

      if (booksResult.status === 'fulfilled') {
        setBooks(unwrapList(booksResult.value));
        setBooksLoadFailed(false);
      } else {
        setBooks([]);
        setBooksLoadFailed(true);
        failedResources.push('books');
      }

      if (customersResult.status === 'fulfilled') {
        setCustomers(unwrapList(customersResult.value));
        setCustomersLoadFailed(false);
      } else {
        setCustomers([]);
        setCustomersLoadFailed(true);
        failedResources.push('customers');
      }

      if (failedResources.length > 0) {
        showToast({
          type: 'error',
          message: formatLoadFailureMessage(failedResources),
        });
      }

      setLoading(false);
    },
    [showToast],
  );

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void refreshCirculationData({ silent: true });
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [refreshCirculationData]);

  const transactions = useMemo(
    () =>
      borrows.map((borrow) => {
        const borrowerName = borrow.customerName ?? borrow.borrowerName ?? null;
        const statusMeta = getBorrowStatusMeta(borrow);

        return {
          ...borrow,
          borrowerName,
          statusLabel: statusMeta.label,
          statusVariant: statusMeta.variant,
        };
      }),
    [borrows],
  );

  const filteredTransactions = useMemo(() => {
    const query = normalizeQuery(searchQuery);

    return transactions.filter((row) => {
      if (statusFilter === STATUS_FILTER_ACTIVE && isBorrowReturned(row)) {
        return false;
      }

      if (statusFilter === STATUS_FILTER_RETURNED && !isBorrowReturned(row)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystacks = [row?.bookTitle, row?.borrowerName, row?.id].map(normalizeQuery);
      return haystacks.some((value) => value.includes(query));
    });
  }, [searchQuery, statusFilter, transactions]);

  const prefetchedSupportSummary = useMemo(() => {
    if (booksLoadFailed && customersLoadFailed) {
      return 'Books and customers could not be loaded for the upcoming borrow flow.';
    }

    if (booksLoadFailed) {
      return `${customers.length} ${customers.length === 1 ? 'customer' : 'customers'} loaded for the upcoming borrow flow. Books could not be loaded.`;
    }

    if (customersLoadFailed) {
      return `${books.length} ${books.length === 1 ? 'book' : 'books'} loaded for the upcoming borrow flow. Customers could not be loaded.`;
    }

    const bookLabel = books.length === 1 ? 'book' : 'books';
    const customerLabel = customers.length === 1 ? 'customer' : 'customers';

    return `${books.length} ${bookLabel} and ${customers.length} ${customerLabel} are loaded for the upcoming borrow flow.`;
  }, [books, booksLoadFailed, customers, customersLoadFailed]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== STATUS_FILTER_ALL;

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(STATUS_FILTER_ALL);
  }, []);

  const handleBorrowModalClose = useCallback(() => {
    setBorrowModalOpen(false);
    setPendingBorrowCustomerId(null);
  }, []);

  const handleBorrowCustomerFormClose = useCallback(() => {
    setBorrowCustomerFormOpen(false);
  }, []);

  const handleBorrowFlowCustomerSaved = useCallback(
    async (savedCustomer) => {
      await refreshCirculationData({ silent: true });
      const id = savedCustomer?.id;
      if (id != null && String(id).trim() !== '') {
        setPendingBorrowCustomerId(String(id));
      }
      setBorrowCustomerFormOpen(false);
    },
    [refreshCirculationData],
  );

  const handlePendingBorrowCustomerConsumed = useCallback(() => {
    setPendingBorrowCustomerId(null);
  }, []);

  const handleBorrowCreated = useCallback(async () => {
    await refreshCirculationData({ silent: true });
  }, [refreshCirculationData]);

  const handleReturnConfirmClose = useCallback(() => {
    setPendingReturnBorrow(null);
  }, []);

  const handleReturnConfirm = useCallback(async () => {
    const id = pendingReturnBorrow?.id;
    if (id == null || String(id).trim() === '') {
      return false;
    }

    try {
      const response = await returnBook(id);
      const returned = response?.data ?? response;
      const penaltyRaw = Number(returned?.penaltyAmount);

      await refreshCirculationData({ silent: true });

      const hasPenalty = Number.isFinite(penaltyRaw) && penaltyRaw > 0;
      showToast({
        type: 'success',
        message: hasPenalty
          ? `Return recorded. Penalty: ${formatCurrency(penaltyRaw)}.`
          : 'Return recorded.',
      });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: getReturnErrorMessage(error, 'Could not return this book.'),
      });
      return false;
    }
  }, [pendingReturnBorrow, refreshCirculationData, showToast]);

  const columns = useMemo(
    () => [
      {
        key: 'customer',
        label: 'Customer',
        render: (row) => (
          <span className={styles.cellText}>
            {row.borrowerName ? row.borrowerName : <span className={styles.cellMuted}>—</span>}
          </span>
        ),
      },
      {
        key: 'book',
        label: 'Book',
        render: (row) => (
          <span className={styles.cellText}>
            {row.bookTitle ? row.bookTitle : <span className={styles.cellMuted}>—</span>}
          </span>
        ),
      },
      {
        key: 'borrowedAt',
        label: 'Borrowed date',
        render: (row) => (
          <span className={styles.cellMuted}>{formatDate(row.borrowedAt)}</span>
        ),
      },
      {
        key: 'dueAt',
        label: 'Due date',
        render: (row) => <span className={styles.cellMuted}>{formatDate(row.dueAt)}</span>,
      },
      {
        key: 'returnedAt',
        label: 'Return date',
        render: (row) => (
          <span className={styles.cellMuted}>{formatDate(row.returnedAt)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <Badge variant={row.statusVariant}>{row.statusLabel}</Badge>
        ),
      },
      {
        key: 'penalty',
        label: 'Penalty',
        render: (row) => (
          <span className={styles.cellMuted}>
            {formatCurrency(row.penaltyAmount, { omitIfNonPositive: true })}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className={styles.actionCell}>
            {isBorrowReturned(row) ? (
              <span className={styles.cellMuted}>—</span>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                aria-label={
                  row.bookTitle && row.borrowerName
                    ? `Return "${row.bookTitle}" for ${row.borrowerName}`
                    : row.bookTitle
                      ? `Return "${row.bookTitle}"`
                      : row.borrowerName
                        ? `Return book for ${row.borrowerName}`
                        : row.id != null && String(row.id).trim() !== ''
                          ? `Return loan ${row.id}`
                          : 'Return this loan'
                }
                onClick={() => setPendingReturnBorrow(row)}
              >
                Return
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const emptyMessage = borrowsLoadFailed
    ? 'We could not load borrowing records. Use Try again in the card header or refresh the page.'
    : transactions.length === 0
      ? 'No borrowing records yet.'
      : 'No borrowing records match the current filters.';

  const borrowingActivityActions =
    borrowsLoadFailed && !loading ? (
      <Button variant="secondary" size="sm" onClick={() => void refreshCirculationData()}>
        Try again
      </Button>
    ) : null;

  const returnConfirmPreview =
    pendingReturnBorrow != null ? getReturnOverduePreview(pendingReturnBorrow) : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Circulation desk</p>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.lede}>
            Track loans and returns in one place—filter the ledger, review due dates, and record new
            borrows without leaving this view.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Button size="lg" icon={<BorrowIcon />} onClick={() => setBorrowModalOpen(true)}>
            New Borrow
          </Button>
        </div>
      </section>

      <Card
        title="Filter transactions"
        subtitle="Choose All, Active, or Returned, then search by book title, customer, or loan id."
        actions={
          <Button variant="ghost" onClick={handleResetFilters} disabled={!hasActiveFilters}>
            Reset filters
          </Button>
        }
      >
        <div className={styles.filterStack}>
          <div
            className={styles.statusTabs}
            role="group"
            aria-label="Filter borrowing records by status"
          >
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={isActive}
                  className={[styles.statusTab, isActive ? styles.statusTabActive : ''].filter(Boolean).join(' ')}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by book, customer, or loan id"
            className={styles.searchField}
          />
        </div>

        <p className={styles.resultsSummary}>
          Showing {filteredTransactions.length} of {transactions.length}{' '}
          {transactions.length === 1 ? 'transaction' : 'transactions'}.
        </p>
        <p className={styles.resultsSummary}>{prefetchedSupportSummary}</p>
      </Card>

      <Card
        title="Borrowing activity"
        subtitle="Active loans show as Active or Overdue; returned loans show the return date and any recorded penalty."
        actions={borrowingActivityActions}
      >
        <Table
          ariaLabel="Borrowing transactions table"
          columns={columns}
          data={filteredTransactions}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </Card>

      <BorrowFormModal
        isOpen={borrowModalOpen}
        onClose={handleBorrowModalClose}
        onBorrowed={handleBorrowCreated}
        customers={customers}
        books={books}
        onAddCustomer={() => setBorrowCustomerFormOpen(true)}
        pendingCustomerId={pendingBorrowCustomerId}
        onPendingCustomerIdConsumed={handlePendingBorrowCustomerConsumed}
      />

      <CustomerFormModal
        isOpen={borrowCustomerFormOpen}
        onClose={handleBorrowCustomerFormClose}
        onSaved={handleBorrowFlowCustomerSaved}
      />

      <ConfirmDialog
        isOpen={pendingReturnBorrow != null}
        onClose={handleReturnConfirmClose}
        onConfirm={handleReturnConfirm}
        title="Confirm return"
        variant="warning"
        confirmText="Confirm return"
        message={
          pendingReturnBorrow ? (
            <div className={styles.returnConfirmBody}>
              <dl className={styles.returnConfirmDetails}>
                <dt>Customer</dt>
                <dd className={styles.returnConfirmValue}>
                  {pendingReturnBorrow.borrowerName ? (
                    pendingReturnBorrow.borrowerName
                  ) : (
                    <span className={styles.cellMuted}>—</span>
                  )}
                </dd>
                <dt>Book</dt>
                <dd className={styles.returnConfirmValue}>
                  {pendingReturnBorrow.bookTitle ? (
                    pendingReturnBorrow.bookTitle
                  ) : (
                    <span className={styles.cellMuted}>—</span>
                  )}
                </dd>
                <dt>Borrowed date</dt>
                <dd className={styles.returnConfirmValue}>
                  {formatDate(pendingReturnBorrow.borrowedAt)}
                </dd>
                <dt>Due date</dt>
                <dd className={styles.returnConfirmValue}>
                  {formatDate(pendingReturnBorrow.dueAt)}
                </dd>
              </dl>
              {returnConfirmPreview ? (
                <p className={styles.returnConfirmOverdue} role="status">
                  Overdue by {returnConfirmPreview.lateDays}{' '}
                  {returnConfirmPreview.lateDays === 1 ? 'day' : 'days'}. Predicted penalty:{' '}
                  {formatCurrency(returnConfirmPreview.predictedPenalty, { omitIfNonPositive: true })}{' '}
                  (if returned now).
                </p>
              ) : null}
            </div>
          ) : null
        }
      />
    </div>
  );
}
