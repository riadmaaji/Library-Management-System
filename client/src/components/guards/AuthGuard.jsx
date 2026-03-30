import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import styles from './GuardFallback.module.css';

export default function AuthGuard({ children }) {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.loadingPanel}>
          <Spinner size="lg" aria-label="Checking authentication status" />
          <p>Restoring your library session.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
