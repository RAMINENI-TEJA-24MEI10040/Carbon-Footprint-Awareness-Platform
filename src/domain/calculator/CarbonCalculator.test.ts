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

    // Hybrid calculation (0.103 kg CO2e / km)
    const hybridResult = CarbonCalculator.calculateCo2('transportation', 'hybrid', 50);
    expect(hybridResult).toBe(5.15);
  });

  it('should compute energy, food, waste, shopping and water emissions correctly', () => {
    // LPG (1.56 kg CO2e / L)
    expect(CarbonCalculator.calculateCo2('energy', 'lpg', 20)).toBe(31.2);
    
    // Vegan food (0.60 kg CO2e / meal)
    expect(CarbonCalculator.calculateCo2('food', 'vegan', 3)).toBe(1.8);
    
    // High Meat (4.80 kg CO2e / meal)
    expect(CarbonCalculator.calculateCo2('food', 'high_meat', 2)).toBe(9.6);
    
    // Recycling offset (negative offset: -0.35 kg CO2e / kg)
    expect(CarbonCalculator.calculateCo2('waste', 'recycling', 10)).toBe(-3.5);
    
    // Electronic waste (11.20 kg CO2e / kg)
    expect(CarbonCalculator.calculateCo2('waste', 'electronic_waste', 5)).toBe(56.0);
    
    // Clothing shopping (15.0 kg CO2e / item)
    expect(CarbonCalculator.calculateCo2('shopping', 'clothing', 4)).toBe(60.0);
    
    // Heated water (0.012 kg CO2e / L)
    expect(CarbonCalculator.calculateCo2('water', 'heated_water', 100)).toBe(1.2);
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
    
    // Solar offset with override
    const resultOverride = CarbonCalculator.calculateCo2('energy', 'solar_offset', 50, 0.20);
    expect(resultOverride).toBe(-10.0); // 50 * -0.20 = -10
  });

  it('should return 0 for unrecognized categories or types', () => {
    // Invalid category
    expect(CarbonCalculator.calculateCo2('invalid_cat' as unknown as 'energy', 'type', 10)).toBe(0);
    // Invalid type
    expect(CarbonCalculator.calculateCo2('transportation', 'rocket_ship', 10)).toBe(0);
  });

  it('should validate logs values correctly', () => {
    expect(CarbonCalculator.validateLogValue('100')).toBe(100);
    expect(CarbonCalculator.validateLogValue(50.5)).toBe(50.5);
    expect(CarbonCalculator.validateLogValue('-10')).toBeNull();
    expect(CarbonCalculator.validateLogValue('invalid')).toBeNull();
    expect(CarbonCalculator.validateLogValue(20000000)).toBeNull(); // extreme value bound limit
  });
});
