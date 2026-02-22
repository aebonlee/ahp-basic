import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>&copy; {new Date().getFullYear()} AHP Basic - I Make It</span>
        <span className={styles.links}>
          <a href="https://imakeit.kr" target="_blank" rel="noopener noreferrer">imakeit.kr</a>
        </span>
      </div>
    </footer>
  );
}
