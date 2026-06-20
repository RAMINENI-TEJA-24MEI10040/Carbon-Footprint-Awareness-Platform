import { describe, it, expect } from 'vitest';
import CarbonCalculator from './CarbonCalculator';

describe('CarbonCalculator', () => {
  it('should compute transportation emissions correctly', () => {
    // Petrol car calculation (0.170 kg CO2e / km)
    const result = CarbonCalculator.calculateCo2('transportation', 'petrol_car', 10);
    expect(result).toBe(1.70);

    // EV calculation (0.047 kg CO2e / km default)
    const evResult = CarbonCalculator.calculateCo2('transportation', 'ev', 100);
    expect(evResult).toBe(4.7);
  });

  it('should return 0 for non-positive input values', () => {
    const zeroResult = CarbonCalculator.calculateCo2('transportation', 'petrol_car', 0);
    const negativeResult = CarbonCalculator.calculateCo2('transportation', 'petrol_car', -10);
    expect(zeroResult).toBe(0);
    expect(negativeResult).toBe(0);
  });

  it('should handle custom grid electricity factor overrides', () => {
    // Default factor is 0.38
    const defaultResult = CarbonCalculator.calculateCo2('energy', 'electricity', 100);
    expect(defaultResult).toBe(38.0);

    // Override to 0.15 (cleaner grid)
    const overrideResult = CarbonCalculator.calculateCo2('energy', 'electricity', 100, 0.15);
    expect(overrideResult).toBe(15.0);
  });

  it('should calculate negative solar offsets correctly', () => {
    // Solar offset should be negative
    const result = CarbonCalculator.calculateCo2('energy', 'solar_offset', 50);
    expect(result).toBe(-19.0); // 50 * -0.38 = -19
  });

  it('should validate logs values correctly', () => {
    expect(CarbonCalculator.validateLogValue('100')).toBe(100);
    expect(CarbonCalculator.validateLogValue(50.5)).toBe(50.5);
    expect(CarbonCalculator.validateLogValue('-10')).toBeNull();
    expect(CarbonCalculator.validateLogValue('invalid')).toBeNull();
    expect(CarbonCalculator.validateLogValue(20000000)).toBeNull(); // extreme value bound limit
  });
});
