import { NavLink } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from './navigation';
import styles from './Sidebar.module.css';

function NavIcon({ name }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case 'books':
      return (
        <svg {...commonProps}>
          <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2H20v18H8.5A2.5 2.5 0 0 0 6 22Z" />
          <path d="M6 4.5V22H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" />
          <path d="M10 7h6" />
          <path d="M10 11h6" />
        </svg>
      );
    case 'customers':
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" />
        </svg>
      );
    case 'transactions':
      return (
        <svg {...commonProps}>
          <path d="M17 3h4v4" />
          <path d="M7 21H3v-4" />
          <path d="M21 7l-5-5" />
          <path d="M3 17l5 5" />
          <path d="M21 7H9a6 6 0 0 0-6 6v0" />
          <path d="M3 17h12a6 6 0 0 0 6-6v0" />
        </svg>
      );
    case 'users':
      return (
        <svg {...commonProps}>
          <path d="M12 3l7 4v5c0 5-3 7.5-7 9-4-1.5-7-4-7-9V7Z" />
          <path d="M9.75 12.25 11.4 14l3.1-3.5" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...commonProps}>
          <path d="M14 16l4-4-4-4" />
          <path d="M18 12H9" />
          <path d="M10 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
        </svg>
      );
    case 'close':
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({ isMobile = false, isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  return (
    <>
      <button
        type="button"
        className={[styles.backdrop, isOpen ? styles.backdropVisible : ''].filter(Boolean).join(' ')}
        aria-label="Close navigation menu"
        disabled={isMobile && !isOpen}
        onClick={onClose}
      />

      <aside
        id="app-sidebar"
        aria-hidden={isMobile && !isOpen ? 'true' : undefined}
        className={[styles.sidebar, isOpen ? styles.sidebarOpen : ''].filter(Boolean).join(' ')}
      >
        <div className={styles.brandRow}>
          <div className={styles.brandBlock}>
            <span className={styles.brandEyebrow}>Curated catalog</span>
            <NavLink to="/dashboard" className={styles.brandLink} onClick={onClose}>
              Library MS
            </NavLink>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <NavIcon name="close" />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              <span className={styles.navIcon}>
                <NavIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.userMeta}>
              <p className={styles.userName}>{user?.name ?? 'Library Staff'}</p>
              <Badge
                variant={user?.role === 'ADMIN' ? 'info' : 'neutral'}
                className={[
                  styles.roleBadge,
                  user?.role === 'ADMIN' ? styles.roleBadgeAdmin : styles.roleBadgeEmployee,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {user?.role ?? 'SIGNED OUT'}
              </Badge>
            </div>
            <p className={styles.userHint}>{user?.email ?? 'Session not available'}</p>
          </div>

          <Button
            variant="secondary"
            className={styles.logoutButton}
            fullWidth
            icon={<NavIcon name="logout" />}
            aria-label="Log out"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
