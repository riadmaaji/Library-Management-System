import { Card } from '../../components/ui/Card';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  return (
    <main className={styles.shell}>
      <Card
        className={styles.card}
        title="Library MS"
        subtitle="Login page placeholder"
        padding="lg"
      >
        <div className={styles.content}>
          <p className={styles.description}>
            Task 8 wires the authenticated shell and protected routes. The full sign-in experience will
            be implemented in Task 9.
          </p>

          <div className={styles.note}>
            <span className={styles.noteLabel}>Demo credentials</span>
            <strong>admin@example.com / password</strong>
          </div>
        </div>
      </Card>
    </main>
  );
}
