import { useState } from 'react';
import Button from '../common/Button';
import UpgradeModal from '../common/UpgradeModal';
import { useSubscription } from '../../hooks/useSubscription';
import { FEATURES } from '../../lib/subscriptionPlans';
import { exportToExcel } from '../../lib/exportUtils';

export default function ExportButtons({ criteria, alternatives, results, projectName }) {
  const { canAccess } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: null });

  const excelLocked = !canAccess(FEATURES.EXPORT_EXCEL);
  const pdfLocked = !canAccess(FEATURES.EXPORT_PDF);

  const handleExcel = async () => {
    if (excelLocked) {
      setUpgradeModal({ open: true, feature: FEATURES.EXPORT_EXCEL });
      return;
    }
    await exportToExcel(criteria, alternatives, results, projectName);
  };

  const handlePdf = () => {
    if (pdfLocked) {
      setUpgradeModal({ open: true, feature: FEATURES.EXPORT_PDF });
      return;
    }
    const style = document.createElement('style');
    style.id = 'pdf-print-style';
    style.textContent = `
      @media print {
        /* 모든 요소 숨기기 */
        body * { visibility: hidden; }

        /* 인쇄 영역만 표시 */
        #ahp-print-area,
        #ahp-print-area * { visibility: visible !important; }

        #ahp-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }

        /* 불필요한 UI 완전 제거 */
        nav, footer,
        [class*="sidebar"], [class*="Sidebar"],
        [class*="toggle"], [class*="Toggle"] { display: none !important; }

        /* 인쇄 영역 내부 버튼 숨기기 */
        #ahp-print-area button { display: none !important; }

        /* 차트/테이블 페이지 넘김 방지 */
        #ahp-print-area > div { page-break-inside: avoid; margin-bottom: 12px; }

        @page { margin: 12mm; size: A4 landscape; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('pdf-print-style');
      if (el) el.remove();
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button size="sm" variant="secondary" onClick={handleExcel}>
        {excelLocked ? '\u{1F512} ' : ''}Excel 저장
      </Button>
      <Button size="sm" variant="secondary" onClick={handlePdf}>
        {pdfLocked ? '\u{1F512} ' : ''}PDF 저장
      </Button>
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: null })}
        feature={upgradeModal.feature}
      />
    </div>
  );
}
