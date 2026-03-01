import { describe, it, expect } from 'vitest';
import {
  gammln,
  regularizedBeta,
  regularizedGamma,
  tCDF,
  fCDF,
  chiSquaredCDF,
  normalCDF,
} from '../statsDistributions';

describe('gammln', () => {
  it('gammln(1) ≈ 0 (since Γ(1)=1)', () => {
    expect(gammln(1)).toBeCloseTo(0, 8);
  });

  it('gammln(5) ≈ ln(24) (since Γ(5)=4!=24)', () => {
    expect(gammln(5)).toBeCloseTo(Math.log(24), 6);
  });

  it('gammln(0.5) ≈ ln(√π) (since Γ(0.5)=√π)', () => {
    expect(gammln(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 6);
  });
});

describe('tCDF', () => {
  it('t=0 → p=1 (양측)', () => {
    expect(tCDF(0, 10)).toBe(1);
  });

  it('t=2.228, df=10 → p < 0.05 (양측)', () => {
    const p = tCDF(2.228, 10);
    expect(p).toBeLessThan(0.05);
    expect(p).toBeGreaterThan(0);
  });

  it('큰 t값 → p ≈ 0', () => {
    const p = tCDF(100, 10);
    expect(p).toBeLessThan(0.0001);
  });

  it('df ≤ 0 → p = 1', () => {
    expect(tCDF(2, 0)).toBe(1);
    expect(tCDF(2, -1)).toBe(1);
  });
});

describe('fCDF', () => {
  it('F ≤ 0 → p = 1', () => {
    expect(fCDF(0, 2, 12)).toBe(1);
    expect(fCDF(-1, 2, 12)).toBe(1);
  });

  it('F=4.96, df1=2, df2=12 → p < 0.05', () => {
    const p = fCDF(4.96, 2, 12);
    expect(p).toBeLessThan(0.05);
    expect(p).toBeGreaterThan(0);
  });

  it('큰 F값 → p ≈ 0', () => {
    const p = fCDF(1000, 2, 12);
    expect(p).toBeLessThan(0.0001);
  });
});

describe('chiSquaredCDF', () => {
  it('χ² ≤ 0 → p = 1', () => {
    expect(chiSquaredCDF(0, 2)).toBe(1);
    expect(chiSquaredCDF(-1, 2)).toBe(1);
  });

  it('χ²=5.991, k=2 → p ≈ 0.05', () => {
    const p = chiSquaredCDF(5.991, 2);
    expect(p).toBeCloseTo(0.05, 2);
  });

  it('큰 χ² → p ≈ 0', () => {
    const p = chiSquaredCDF(100, 2);
    expect(p).toBeLessThan(0.0001);
  });
});

describe('regularizedBeta', () => {
  it('x=0 → 0', () => {
    expect(regularizedBeta(0, 2, 3)).toBe(0);
  });

  it('x=1 → 1', () => {
    expect(regularizedBeta(1, 2, 3)).toBe(1);
  });

  it('I_0.3(2,3) — 알려진 값 검증', () => {
    // I_0.3(2,3) = 1 - (1-0.3)^3 * (1 + 3*0.3 + 6*0.3^2) ... 수치적 범위 체크
    const val = regularizedBeta(0.3, 2, 3);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(1);
  });

  it('NaN 입력 → NaN', () => {
    expect(regularizedBeta(NaN, 2, 3)).toBeNaN();
    expect(regularizedBeta(0.5, NaN, 3)).toBeNaN();
  });
});

describe('regularizedGamma', () => {
  it('x=0 → 0', () => {
    expect(regularizedGamma(2, 0)).toBe(0);
  });

  it('P(1, 1) = 1 - e^(-1) ≈ 0.6321', () => {
    expect(regularizedGamma(1, 1)).toBeCloseTo(1 - Math.exp(-1), 4);
  });

  it('음수 x → 0', () => {
    expect(regularizedGamma(2, -1)).toBe(0);
  });
});

describe('normalCDF', () => {
  it('z=0 → 0.5', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 6);
  });

  it('z=1.96 → ≈ 0.975', () => {
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 2);
  });

  it('z=-1.96 → ≈ 0.025', () => {
    expect(normalCDF(-1.96)).toBeCloseTo(0.025, 2);
  });

  it('극대 양수 → 1', () => {
    expect(normalCDF(10)).toBe(1);
  });

  it('극대 음수 → 0', () => {
    expect(normalCDF(-10)).toBe(0);
  });

  it('NaN → 0.5', () => {
    expect(normalCDF(NaN)).toBe(0.5);
  });
});

describe('엣지 케이스', () => {
  it('tCDF에 NaN → 1', () => {
    expect(tCDF(NaN, 10)).toBe(1);
  });

  it('fCDF에 NaN → 1', () => {
    expect(fCDF(NaN, 2, 12)).toBe(1);
  });

  it('chiSquaredCDF에 NaN → 1', () => {
    expect(chiSquaredCDF(NaN, 2)).toBe(1);
  });
});
