import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBooks } from '../../api/services/bookService';
import { getBorrows } from '../../api/services/borrowService';
import { getCustomers } from '../../api/services/customerService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateTime, formatLongDate } from '../../utils/formatters';
import styles from './DashboardPage.module.css';

const STAT_KEYS = ['books', 'customers', 'borrows', 'overdue'];

function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

function isOverdueBorrow(borrow) {
  if (borrow?.dueAt == null) {
    return false;
  }
  const due = new Date(borrow.dueAt);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function getBorrowStatus(borrow) {
  if (borrow?.returnedAt) {
    return { label: 'Returned', variant: 'neutral' };
  }

  if (isOverdueBorrow(borrow)) {
    return { label: 'Overdue', variant: 'danger' };
  }

  return { label: 'Active', variant: 'success' };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [books, setBooks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, customersRes, borrowsRes] = await Promise.all([
        getBooks(),
        getCustomers(),
        getBorrows({ status: 'active' }),
      ]);

      setBooks(unwrapList(booksRes));
      setCustomers(unwrapList(customersRes));
      setActiveBorrows(unwrapList(borrowsRes));
      setLoadFailed(false);
    } catch (error) {
      console.error('Dashboard data load failed', error);
      showToast({
        type: 'error',
        message: 'Could not load dashboard data. Use Try again to reload the overview.',
      });
      setBooks([]);
      setCustomers([]);
      setActiveBorrows([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const totalBooks = books.length;
    const totalAvailableCopies = books.reduce((sum, b) => {
      const n = Number(b?.availableCopies);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const totalCustomers = customers.length;
    const activeBorrowCount = activeBorrows.length;
    const overdueCount = activeBorrows.filter(isOverdueBorrow).length;

    return {
      totalBooks,
      totalAvailableCopies,
      totalCustomers,
      activeBorrowCount,
      overdueCount,
    };
  }, [books, customers, activeBorrows]);

  const recentTransactions = useMemo(() => {
    return [...activeBorrows]
      .sort((a, b) => {
        const tb = new Date(b?.borrowedAt ?? 0).getTime();
        const ta = new Date(a?.borrowedAt ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, 5);
  }, [activeBorrows]);

  const displayName = user?.name?.trim() || 'Library staff';
  const currentDateLabel = formatLongDate(new Date());
  const availabilityLabel = loadFailed
    ? 'Overview unavailable'
    : `Available copies: ${metrics.totalAvailableCopies}`;

  const statItems = useMemo(
    () => [
      {
        key: 'books',
        label: 'Total Books',
        value: loadFailed ? '—' : metrics.totalBooks,
        accent: loadFailed ? 'warning' : 'info',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4.75A2.75 2.75 0 0 1 7.75 2h10.5A1.75 1.75 0 0 1 20 3.75v14.5A1.75 1.75 0 0 1 18.25 20H7.75A2.75 2.75 0 0 0 5 22.75V4.75Z" />
            <path d="M7.75 5.5h8.5" />
            <path d="M7.75 9.5h8.5" />
            <path d="M7.75 13.5h5.5" />
          </svg>
        ),
      },
      {
        key: 'customers',
        label: 'Total Customers',
        value: loadFailed ? '—' : metrics.totalCustomers,
        accent: loadFailed ? 'warning' : 'neutral',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.5 19.25a4.75 4.75 0 0 0-9.5 0" />
            <circle cx="11.75" cy="8" r="3.25" />
            <path d="M17.75 9.5a2.75 2.75 0 1 1 0 5.5" />
          </svg>
        ),
      },
      {
        key: 'borrows',
        label: 'Active Borrows',
        value: loadFailed ? '—' : metrics.activeBorrowCount,
        accent: loadFailed ? 'warning' : 'success',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.75 7.25h8.5a2.25 2.25 0 0 1 2.25 2.25v7.25H7A2.25 2.25 0 0 1 4.75 14.5v-7.25Z" />
            <path d="M15.5 8.5h1.75a2 2 0 0 1 2 2v6.25h-3.75" />
            <path d="M8 11.5h4.5" />
          </svg>
        ),
      },
      {
        key: 'overdue',
        label: 'Overdue Books',
        value: loadFailed ? '—' : metrics.overdueCount,
        accent: loadFailed ? 'warning' : metrics.overdueCount > 0 ? 'danger' : 'neutral',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.75 20 18.25H4L12 3.75Z" />
            <path d="M12 8.75v4.75" />
            <path d="M12 16.25h.01" />
          </svg>
        ),
      },
    ],
    [loadFailed, metrics]
  );

  const columns = useMemo(
    () => [
      {
        key: 'borrowedAt',
        label: 'Borrowed',
        render: (row) => <span className={styles.cellMuted}>{formatDateTime(row.borrowedAt)}</span>,
      },
      {
        key: 'customerName',
        label: 'Customer',
        render: (row) => row.customerName ?? '—',
      },
      {
        key: 'bookTitle',
        label: 'Book',
        render: (row) => <span className={styles.cellTitle}>{row.bookTitle ?? '—'}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => {
          const status = getBorrowStatus(row);
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      {
        key: 'dueAt',
        label: 'Due',
        render: (row) => <span className={styles.cellMuted}>{formatDateTime(row.dueAt)}</span>,
      },
    ],
    []
  );

  const recentTableActions =
    loadFailed && !loading ? (
      <Button variant="secondary" size="sm" onClick={() => void loadDashboard()}>
        Try again
      </Button>
    ) : null;

  const recentEmptyMessage = loadFailed
    ? 'We could not load recent borrowing activity. Use Try again in the card header or refresh the page.'
    : 'No active borrows yet. New loans will appear here.';

  return (
    <div className={styles.page}>
      <section
        className={styles.overview}
        aria-labelledby="dashboard-overview-heading"
        aria-busy={loading || undefined}
      >
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Overview</p>
          <h1 id="dashboard-overview-heading" className={styles.title}>
            Welcome back, {displayName}
          </h1>
          <div className={styles.heroMeta}>
            <p className={styles.date}>{currentDateLabel}</p>
            <p
              className={`${styles.availability} ${loadFailed ? styles.availabilityWarning : ''}`}
              role={loadFailed ? 'status' : undefined}
            >
              {availabilityLabel}
            </p>
          </div>
          <p className={styles.lede}>
            Here is a quick read on collection health, lending activity, and the latest circulation from your active loans.
          </p>
          {loadFailed ? (
            <p className={styles.loadNotice}>
              The latest dashboard figures could not be loaded. Use Try again to refresh this overview.
            </p>
          ) : null}
        </header>

        <section className={styles.statGrid} aria-label="Library statistics">
          {loading
            ? STAT_KEYS.map((key) => (
                <div key={key} className={styles.statSkeleton} aria-hidden>
                  <span className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  <span className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
                </div>
              ))
            : statItems.map((item, index) => (
                <article
                  key={item.key}
                  className={`${styles.statCard} ${styles[`statCard${item.accent[0].toUpperCase()}${item.accent.slice(1)}`]}`}
                  style={{ '--card-delay': `${index * 80}ms` }}
                >
                  <div className={styles.statHead}>
                    <span className={`${styles.statIcon} ${styles[`statIcon${item.accent[0].toUpperCase()}${item.accent.slice(1)}`]}`}>
                      {item.icon}
                    </span>
                  </div>
                  <p className={styles.statLabel}>{item.label}</p>
                  <p className={styles.statValue}>{item.value}</p>
                </article>
              ))}
        </section>
      </section>

      <Card
        title="Recent Transactions"
        subtitle="Up to five active loans, newest first"
        padding="md"
        actions={recentTableActions}
      >
        <p className={styles.tableHint}>Borrow and due times use your browser locale.</p>
        <Table
          ariaLabel="Recent borrow transactions"
          loading={loading}
          columns={columns}
          data={recentTransactions}
          emptyMessage={recentEmptyMessage}
        />
      </Card>
    </div>
  );
}
