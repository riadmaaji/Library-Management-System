import { Card } from '../../components/ui/Card';
import styles from './PlaceholderPage.module.css';

export default function PlaceholderPage({ title, subtitle, description }) {
  return (
    <section className={styles.page}>
      <Card title={title} subtitle={subtitle} padding="lg" className={styles.card}>
        <p className={styles.description}>{description}</p>
      </Card>
    </section>
  );
}
