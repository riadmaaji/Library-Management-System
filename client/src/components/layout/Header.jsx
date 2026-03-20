import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Header({ title, isSidebarOpen = false, onMenuToggle }) {
  const { user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headingGroup}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Open navigation menu"
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          onClick={onMenuToggle}
        >
          <MenuIcon />
        </button>

        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>Library workspace</span>
          <p className={styles.title}>{title}</p>
        </div>
      </div>

      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden="true">
          {getInitials(user?.name ?? 'Library User')}
        </div>
        <div className={styles.profileText}>
          <span className={styles.profileName}>{user?.name ?? 'Library User'}</span>
          <span className={styles.profileRole}>{user?.role ?? 'Staff'}</span>
        </div>
      </div>
    </header>
  );
}
