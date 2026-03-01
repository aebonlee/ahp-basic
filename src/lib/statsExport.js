/**
 * 통계 결과 Excel 내보내기
 */
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ANALYSIS_LABELS = {
  descriptive: '기술통계',
  independentT: '독립표본T검정',
  pairedT: '대응표본T검정',
  anova: '일원분산분석',
  chiSquare: '카이제곱검정',
  correlation: '상관분석',
  regression: '단순선형회귀',
  cronbach: '크론바흐알파',
  crossTab: '교차분석',
};

export function exportStatsToExcel(analysisType, result, projectName = '프로젝트') {
  const wb = XLSX.utils.book_new();
  const label = ANALYSIS_LABELS[analysisType] || analysisType;

  // 요약 시트
  if (result.summary) {
    const summaryRows = Object.entries(result.summary).map(([k, v]) => ({ 항목: k, 값: v }));
    const ws = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws, '요약');
  }

  // 상세 시트
  if (result.details && result.details.length > 0) {
    const ws = XLSX.utils.json_to_sheet(result.details);
    XLSX.utils.book_append_sheet(wb, ws, '상세');
  }

  // 상관분석: p값 행렬
  if (result.pMatrix && result.pMatrix.length > 0) {
    const ws = XLSX.utils.json_to_sheet(result.pMatrix);
    XLSX.utils.book_append_sheet(wb, ws, 'p값 행렬');
  }

  // 교차분석: 추가 테이블들
  if (result.pctTable) {
    const ws = XLSX.utils.json_to_sheet(result.pctTable);
    XLSX.utils.book_append_sheet(wb, ws, '비율표');
  }
  if (result.expectedTable) {
    const ws = XLSX.utils.json_to_sheet(result.expectedTable);
    XLSX.utils.book_append_sheet(wb, ws, '기대빈도');
  }
  if (result.residualTable) {
    const ws = XLSX.utils.json_to_sheet(result.residualTable);
    XLSX.utils.book_append_sheet(wb, ws, '잔차');
  }

  // 차트 데이터 시트
  if (result.chartData && result.chartData.length > 0) {
    const ws = XLSX.utils.json_to_sheet(result.chartData);
    XLSX.utils.book_append_sheet(wb, ws, '차트데이터');
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const fileName = `${projectName}_${label}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}
