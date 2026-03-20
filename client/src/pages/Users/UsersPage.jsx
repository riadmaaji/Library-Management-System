import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteUser, getUsers } from '../../api/services/userService';
import { UserFormModal } from './UserFormModal';
import { getErrorMessage } from './usersUtils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import styles from './UsersPage.module.css';

function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function formatCreatedDate(value) {
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

function roleBadgeForRole(role) {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'ADMIN') {
    return { variant: 'warning', label: 'Admin' };
  }
  if (normalized === 'EMPLOYEE') {
    return { variant: 'neutral', label: 'Employee' };
  }
  return { variant: 'neutral', label: role ? String(role) : '—' };
}

function isSameUserAsCurrent(currentUser, row) {
  return currentUser?.id != null && row?.id != null && row.id === currentUser.id;
}

function UsersIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);

  const loadUsers = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await getUsers();
        setUsers(unwrapList(response));
        setLoadFailed(false);
      } catch (error) {
        setUsers([]);
        setLoadFailed(true);
        showToast({
          type: 'error',
          message: getErrorMessage(
            error,
            'Could not load users right now. Please refresh and try again.',
          ),
        });
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenCreate = useCallback(() => {
    setEditingUser(null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingUser(null);
  }, []);

  const handleOpenEdit = useCallback((row) => {
    setEditingUser(row);
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback(
    (row) => {
      if (isSameUserAsCurrent(currentUser, row)) {
        showToast({
          type: 'warning',
          message: 'You cannot delete your own account from this list.',
        });
        return;
      }

      setPendingDeleteUser(row);
    },
    [currentUser, showToast],
  );

  const handleCloseDelete = useCallback(() => {
    setPendingDeleteUser(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteUser) {
      return false;
    }

    const label = pendingDeleteUser.name || pendingDeleteUser.email || 'this user';

    try {
      await deleteUser(pendingDeleteUser.id);
      showToast({
        type: 'success',
        message: `${label} was removed.`,
      });
      await loadUsers({ silent: true });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: getErrorMessage(
          error,
          'This user could not be deleted right now. Please try again.',
        ),
      });
      return false;
    }
  }, [pendingDeleteUser, loadUsers, showToast]);

  const emptyMessage = useMemo(() => {
    if (loadFailed) {
      return 'We could not load users from the server. Use "Try again" in the card header or refresh the page.';
    }
    return 'No users are registered yet. Add your first user to get started.';
  }, [loadFailed]);

  const tableCardActions =
    loadFailed && !loading ? (
      <Button variant="secondary" size="sm" onClick={() => loadUsers()}>
        Try again
      </Button>
    ) : null;

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        render: (row) => (
          <div className={styles.nameCell}>
            <span className={styles.userName}>{row.name || '—'}</span>
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
        key: 'role',
        label: 'Role',
        render: (row) => {
          const { variant, label } = roleBadgeForRole(row.role);
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        render: (row) => (
          <span className={styles.cellMuted}>{formatCreatedDate(row.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => {
          const isSelf = isSameUserAsCurrent(currentUser, row);
          return (
            <div className={styles.actionGroup}>
              <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isSelf}
                title={
                  isSelf ? 'You cannot delete your own account' : 'Permanently remove this user'
                }
                aria-label={isSelf ? 'Delete user (disabled for your own account)' : 'Delete user'}
                onClick={() => handleDeleteClick(row)}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [currentUser, handleDeleteClick, handleOpenEdit],
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Administration</p>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.lede}>
            See who can sign in to the admin app. Add, edit, or remove accounts here. You cannot
            delete your own user from this list.
          </p>
        </div>
        <Button size="lg" icon={<UsersIcon />} onClick={handleOpenCreate}>
          Add User
        </Button>
      </section>

      <UserFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        user={editingUser}
        isEditingSelf={Boolean(editingUser && isSameUserAsCurrent(currentUser, editingUser))}
        onSaved={() => loadUsers({ silent: true })}
      />

      <ConfirmDialog
        isOpen={pendingDeleteUser != null}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete user"
        confirmText="Delete user"
        message={
          pendingDeleteUser ? (
            <p className={styles.confirmMessage}>
              Delete <strong>{pendingDeleteUser.name || pendingDeleteUser.email || 'this user'}</strong>
              ? They will no longer be able to sign in.
            </p>
          ) : null
        }
      />

      <Card
        title="Users"
        subtitle="Accounts with access to the admin application. Details load from the server."
        actions={tableCardActions}
      >
        <Table
          ariaLabel="Users table"
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </Card>
    </div>
  );
}
