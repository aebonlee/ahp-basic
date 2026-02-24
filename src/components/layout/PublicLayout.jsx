import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';
import styles from './PublicLayout.module.css';

export default function PublicLayout({ children }) {
  return (
    <div className={styles.layout}>
      <PublicNav />
      <main className={styles.main}>{children}</main>
      <PublicFooter />
    </div>
  );
}
