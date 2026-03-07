import styles from './WeightSlider.module.css';

export default function WeightSlider({ criteria, selected, onChange }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title} id="weight-slider-label">1차 기준 선택</h3>
      <div className={styles.buttons} role="radiogroup" aria-labelledby="weight-slider-label">
        {criteria.map((c, idx) => (
          <button
            key={c.id}
            className={`${styles.btn} ${idx === selected ? styles.active : ''}`}
            role="radio"
            aria-checked={idx === selected}
            onClick={() => onChange(idx)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
