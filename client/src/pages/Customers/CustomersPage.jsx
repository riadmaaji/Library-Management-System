import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCustomers } from '../../api/services/customerService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../hooks/useToast';
import { CustomerFormModal } from './CustomerFormModal';
import styles from './CustomersPage.module.css';

function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0] ??
    error?.response?.data?.message ??
    fallbackMessage
  );
}

function normalizeQuery(value) {
  return String(value ?? '').trim().toLowerCase();
}

function formatRegisteredDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function CustomersIcon() {
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
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.75 18.25a5.25 5.25 0 0 1 10.5 0" />
      <path d="M16.75 9.25a2.75 2.75 0 1 1 0 5.5" />
      <path d="M16 18.25h4.25" />
    </svg>
  );
}

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadCustomers = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await getCustomers();
        setCustomers(unwrapList(response));
      } catch (error) {
        setCustomers([]);
        showToast({
          type: 'error',
          message: getErrorMessage(
            error,
            'Could not load customers right now. Please refresh and try again.',
          ),
        });
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = normalizeQuery(searchQuery);

    return customers.filter((customer) => {
      if (!query) {
        return true;
      }

      const haystacks = [customer?.fullName, customer?.email, customer?.phone].map(normalizeQuery);
      return haystacks.some((value) => value.includes(query));
    });
  }, [customers, searchQuery]);

  const emptyMessage =
    customers.length === 0
      ? 'No customers are registered yet. Add your first customer to get started.'
      : 'No customers match the current search.';

  const handleOpenCreate = useCallback(() => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setEditingCustomer(null);
    setIsFormOpen(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCustomerSaved = useCallback(async () => {
    await loadCustomers({ silent: true });
  }, [loadCustomers]);

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: 'Full Name',
        render: (row) => (
          <div className={styles.nameCell}>
            <span className={styles.customerName}>{row.fullName}</span>
            <span className={styles.customerMeta}>
              {row.email || row.phone ? 'Ready for borrowing activity' : 'Contact details needed'}
            </span>
          </div>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        render: (row) =>
          row.email ? (
            <span className={styles.cellText}>{row.email}</span>
          ) : (
            <span className={styles.cellMuted}>—</span>
          ),
      },
      {
        key: 'phone',
        label: 'Phone',
        render: (row) =>
          row.phone ? (
            <span className={styles.cellText}>{row.phone}</span>
          ) : (
            <span className={styles.cellMuted}>—</span>
          ),
      },
      {
        key: 'createdAt',
        label: 'Registered',
        render: (row) => <span className={styles.cellMuted}>{formatRegisteredDate(row.createdAt)}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className={styles.actionGroup}>
            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [handleOpenEdit],
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Community records</p>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.lede}>
            Keep borrower profiles current, search your patron list quickly, and update contact
            details without leaving the desk view.
          </p>
        </div>
        <Button size="lg" icon={<CustomersIcon />} onClick={handleOpenCreate}>
          Add Customer
        </Button>
      </section>

      <Card
        title="Find a customer"
        subtitle="Search by full name, email, or phone number to narrow the customer list instantly."
        actions={
          <Button variant="ghost" onClick={handleResetFilters} disabled={searchQuery.trim() === ''}>
            Reset search
          </Button>
        }
      >
        <div className={styles.filterRow}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by full name, email, or phone"
            className={styles.searchField}
          />
        </div>

        <p className={styles.resultsSummary}>
          Showing {filteredCustomers.length} of {customers.length}{' '}
          {customers.length === 1 ? 'customer' : 'customers'}.
        </p>
      </Card>

      <Card
        title="Registered customers"
        subtitle="Review contact details and keep borrower records accurate before issuing new loans."
      >
        <Table
          ariaLabel="Customers table"
          columns={columns}
          data={filteredCustomers}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </Card>

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSaved={handleCustomerSaved}
        customer={editingCustomer}
      />
    </div>
  );
}
