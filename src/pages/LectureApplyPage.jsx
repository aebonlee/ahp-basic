import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import PublicLayout from '../components/layout/PublicLayout';
import styles from './LectureApplyPage.module.css';

const SCHEDULES = [
  { date: '2026-03-19', label: '3월 19일 (수)', time: '20:00 ~ 21:00' },
  { date: '2026-03-26', label: '3월 26일 (수)', time: '20:00 ~ 21:00' },
];

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

function isPast(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

const INITIAL_FORM = { name: '', email: '', phone: '', dates: [], message: '' };

export default function LectureApplyPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (profile || user) {
      const email = user?.email
        || user?.user_metadata?.email
        || user?.identities?.[0]?.identity_data?.email
        || profile?.email
        || '';
      setForm(prev => ({
        ...prev,
        name: prev.name || profile?.display_name || user?.user_metadata?.full_name || '',
        email: prev.email || email,
        phone: prev.phone || profile?.phone || '',
      }));
    }
  }, [profile, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateToggle = (date) => {
    setForm(prev => ({
      ...prev,
      dates: prev.dates.includes(date)
        ? prev.dates.filter(d => d !== date)
        : [...prev.dates, date],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.warning('이름을 입력해 주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.warning('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.warning('올바른 전화번호를 입력해 주세요.');
      return;
    }

    if (form.dates.length === 0) {
      toast.warning('희망 일정을 하나 이상 선택해 주세요.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('lecture_applications').insert({
      name: trimmedName,
      email: form.email.trim(),
      phone: form.phone.trim(),
      preferred_dates: form.dates,
      message: form.message.trim() || null,
    });

    if (error) {
      toast.error('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      setSubmitting(false);
      return;
    }

    toast.success('강의 신청이 완료되었습니다!');
    setForm({ ...INITIAL_FORM });
    setSubmitting(false);
  };

  const availableDates = SCHEDULES.filter(s => !isPast(s.date));

  return (
    <PublicLayout>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>2026년 3월</span>
          <h1 className={styles.heroTitle}>온라인 강의 신청</h1>
          <p className={styles.heroDesc}>
            AHP Basic 활용법을 배울 수 있는 온라인 강의입니다.<br />
            매주 수요일 저녁 8시, 1시간 동안 진행됩니다.
          </p>
        </div>
      </section>

      {/* Schedule */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>강의 일정</h2>
        <div className={styles.scheduleGrid}>
          {SCHEDULES.map(s => {
            const past = isPast(s.date);
            return (
              <div key={s.date} className={`${styles.scheduleCard} ${past ? styles.past : ''}`}>
                <div className={styles.scheduleIcon}>
                  <CalendarIcon />
                </div>
                <div className={styles.scheduleInfo}>
                  <span className={styles.scheduleDate}>{s.label}</span>
                  <span className={styles.scheduleTime}>{s.time}</span>
                  <span className={`${styles.scheduleBadge} ${past ? styles.ended : styles.available}`}>
                    {past ? '종료' : '신청 가능'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <h2 className={styles.sectionTitle}>신청서 작성</h2>
        <div className={styles.formWrap}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="lec-name">이름 *</label>
              <input
                id="lec-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="홍길동"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lec-email">이메일 *</label>
              <input
                id="lec-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lec-phone">전화번호 *</label>
              <input
                id="lec-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>희망 일정 *</label>
              <div className={styles.checkboxGroup}>
                {SCHEDULES.map(s => {
                  const past = isPast(s.date);
                  return (
                    <label
                      key={s.date}
                      className={`${styles.checkboxLabel} ${past ? styles.disabled : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.dates.includes(s.date)}
                        onChange={() => handleDateToggle(s.date)}
                        disabled={past}
                      />
                      {s.label} {s.time} {past && '(종료)'}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lec-message">문의사항</label>
              <textarea
                id="lec-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="궁금한 점이 있으시면 자유롭게 작성해 주세요."
                rows={3}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || availableDates.length === 0}
            >
              {submitting ? '신청 중...' : '강의 신청하기'}
            </button>
          </form>

          <div className={styles.infoBox}>
            <strong>안내사항</strong><br />
            - 강의는 Zoom을 통해 진행되며, 신청 후 이메일로 참여 링크가 발송됩니다.<br />
            - 강의 시간: 매주 수요일 저녁 8시 ~ 9시 (1시간)<br />
            - 문의: 신청서 하단 문의사항란을 이용해 주세요.
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
