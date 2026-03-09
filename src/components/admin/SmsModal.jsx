import { useState, useMemo, useCallback, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatPhone } from '../../lib/evaluatorUtils';
import { getByteInfo } from '../../lib/smsUtils';
import { sendSmsBulk } from '../../lib/smsService';
import styles from './SmsModal.module.css';

const SYMBOLS = [
  '★','☆','♥','♡','◆','◇','■','□','●','○',
  '▶','◀','△','▽','☎','♠','♣','♧','→','←','↑','↓',
];

const TEMPLATES = [
  { name: '평가 참여 요청', content: '[AHP 설문] 평가에 참여해 주세요.\n{링크}' },
  { name: '평가 독려', content: '[AHP 설문] 아직 평가가 완료되지 않았습니다. 참여 부탁드립니다.\n{링크}' },
  { name: '평가 감사', content: '[AHP 설문] 평가에 참여해 주셔서 감사합니다.' },
];

export default function SmsModal({ isOpen, onClose, evaluators, projectId }) {
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('symbols');
  const textareaRef = useRef(null);

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/eval/invite/${projectId}`;

  // 전화번호 있는 평가자만 선택 가능
  const selectableEvaluators = useMemo(
    () => evaluators.filter((ev) => ev.phone_number),
    [evaluators]
  );

  const byteInfo = useMemo(() => getByteInfo(message), [message]);

  const handleToggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === selectableEvaluators.length) return new Set();
      return new Set(selectableEvaluators.map((ev) => ev.id));
    });
  }, [selectableEvaluators]);

  const insertAtCursor = useCallback((text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = message.slice(0, start);
    const after = message.slice(end);
    const newMsg = before + text + after;
    setMessage(newMsg);
    // 커서 복원 — requestAnimationFrame으로 state 반영 후 실행
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [message]);

  const applyTemplate = useCallback((content) => {
    if (message.trim() && !window.confirm('기존 메시지를 덮어쓰시겠습니까?')) return;
    const resolved = content.replace('{링크}', inviteUrl);
    setMessage(resolved);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [message, inviteUrl]);

  const handleSend = async () => {
    if (selected.size === 0 || !message.trim()) return;
    if (byteInfo.type === 'OVER') return;

    const recipients = selectableEvaluators
      .filter((ev) => selected.has(ev.id))
      .map((ev) => ({ name: ev.name, phone: ev.phone_number }));

    setSending(true);
    setProgress({ current: 0, total: recipients.length });
    setResults(null);

    const res = await sendSmsBulk(recipients, message, (current, total) => {
      setProgress({ current, total });
    });

    setResults(res);
    setSending(false);
  };

  const handleClose = () => {
    if (sending) return;
    setResults(null);
    onClose();
  };

  const selectedCount = selected.size;
  const allSelected =
    selectableEvaluators.length > 0 &&
    selectedCount === selectableEvaluators.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="SMS 발송" width="480px">
      {results ? (
        <div className={styles.results}>
          <h4 className={styles.resultsTitle}>발송 결과</h4>
          <ul className={styles.resultsList}>
            {results.map((r, i) => (
              <li key={i} className={r.success ? styles.resultSuccess : styles.resultFail}>
                <span>{r.name}</span>
                <span>{formatPhone(r.phone)}</span>
                <span className={r.success ? styles.badgeSuccess : styles.badgeFail}>
                  {r.success ? '성공' : '실패'}
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.resultsSummary}>
            성공 {results.filter((r) => r.success).length}건 / 실패{' '}
            {results.filter((r) => !r.success).length}건
          </div>
          <div className={styles.actions}>
            <Button onClick={handleClose}>닫기</Button>
          </div>
        </div>
      ) : (
        <>
          {/* 수신자 선택 */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>수신자 선택</label>
            <div className={styles.recipientList}>
              <label className={styles.recipientRow}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  disabled={sending}
                />
                <span className={styles.recipientName}>
                  전체 선택 ({selectedCount}/{selectableEvaluators.length}명)
                </span>
              </label>
              {evaluators.map((ev) => {
                const hasPhone = !!ev.phone_number;
                return (
                  <label
                    key={ev.id}
                    className={`${styles.recipientRow} ${!hasPhone ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(ev.id)}
                      onChange={() => handleToggle(ev.id)}
                      disabled={!hasPhone || sending}
                    />
                    <span className={styles.recipientName}>{ev.name}</span>
                    <span className={styles.recipientPhone}>
                      {hasPhone ? formatPhone(ev.phone_number) : '(번호 없음)'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 메시지 입력 */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>메시지</label>

            {/* 특수문자 / 기본문구 탭 */}
            <div className={styles.toolbar}>
              <div className={styles.tabBar}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'symbols' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('symbols')}
                  disabled={sending}
                >
                  특수문자
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'templates' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('templates')}
                  disabled={sending}
                >
                  기본문구
                </button>
              </div>

              {activeTab === 'symbols' && (
                <div className={styles.symbolGrid}>
                  {SYMBOLS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      className={styles.symbolBtn}
                      onClick={() => insertAtCursor(sym)}
                      disabled={sending}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'templates' && (
                <div className={styles.templateList}>
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      className={styles.templateItem}
                      onClick={() => applyTemplate(tpl.content)}
                      disabled={sending}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              rows={5}
              disabled={sending}
            />
            <div className={styles.byteCounter}>
              <span>
                {byteInfo.bytes}/{byteInfo.max} bytes
              </span>
              <span
                className={`${styles.typeBadge} ${
                  byteInfo.type === 'SMS'
                    ? styles.badgeSms
                    : byteInfo.type === 'LMS'
                      ? styles.badgeLms
                      : styles.badgeOver
                }`}
              >
                {byteInfo.type}
              </span>
            </div>
          </div>

          {/* 발송 */}
          <div className={styles.actions}>
            {sending && (
              <span className={styles.progressText}>
                발송 중... {progress.current}/{progress.total}
              </span>
            )}
            <Button
              onClick={handleSend}
              loading={sending}
              disabled={
                selectedCount === 0 ||
                !message.trim() ||
                byteInfo.type === 'OVER'
              }
            >
              {sending
                ? '발송 중...'
                : `발송 (${selectedCount}명에게)`}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
