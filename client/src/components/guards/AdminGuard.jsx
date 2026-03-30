import { Outlet, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import styles from './GuardFallback.module.css';

export default function AdminGuard({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return children ?? <Outlet />;
  }

  return (
    <div className={styles.deniedWrap}>
      <Card
        className={styles.deniedCard}
        title="Access denied"
        subtitle="User Management is reserved for administrators."
        padding="lg"
      >
        <div className={styles.deniedBody}>
          <Badge variant="warning">{user?.role ?? 'UNKNOWN ROLE'}</Badge>
          <p className={styles.deniedText}>
            You are signed in, but your account does not have permission to view this page.
          </p>
          <div className={styles.deniedActions}>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
