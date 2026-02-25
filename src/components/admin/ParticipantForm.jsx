import { useState } from 'react';
import Button from '../common/Button';
import { formatPhone } from '../../lib/evaluatorUtils';
import styles from './ProjectForm.module.css';

export default function ParticipantForm({ evaluator, onSave, onClose }) {
  const [name, setName] = useState(evaluator?.name || '');
  const [email, setEmail] = useState(evaluator?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(
    formatPhone(evaluator?.phone_number || '')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return; }
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (!digitsOnly) { setError('전화번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      await onSave({ name, email, phone_number: digitsOnly });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}
      <label className={styles.field}>
        <span>이메일</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" autoFocus />
      </label>
      <label className={styles.field}>
        <span>이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
      </label>
      <label className={styles.field}>
        <span>전화번호</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
          placeholder="010-1234-5678"
        />
      </label>
      <div className={styles.actions}>
        <Button type="submit" size="sm" loading={loading}>
          {evaluator ? '수정' : '추가'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>취소</Button>
      </div>
    </form>
  );
}
