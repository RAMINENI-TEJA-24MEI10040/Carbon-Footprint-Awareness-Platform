import { ActivityCategory } from './types';
import { EMISSION_FACTORS } from './constants';

export class CarbonCalculator {
  /**
   * Calculates the CO2e emission in kilograms for a given activity category, type, and value.
   * Prevents invalid calculations and enforces boundary conditions.
   * 
   * @param category The high-level category of the log.
   * @param type The specific activity subtype.
   * @param value The amount/usage value (e.g., distance, kWh, kilograms).
   * @param gridFactorOverride Optional override for electricity grid intensity (kg CO2e/kWh).
   */
  static calculateCo2(
    category: ActivityCategory,
    type: string,
    value: number,
    gridFactorOverride?: number
  ): number {
    if (value <= 0) {
      // Recycling, composting, and solar offset calculations are naturally negative offsets,
      // but the input value (e.g., "5 kg recycling" or "10 kWh solar generated") is positive.
      // Negative input values are strictly rejected as invalid logs.
      return 0;
    }

    // Handle customizable electricity emission grid factors
    if (category === 'energy') {
      if (type === 'electricity') {
        const factor = gridFactorOverride !== undefined && gridFactorOverride >= 0
          ? gridFactorOverride 
          : EMISSION_FACTORS.energy.electricity;
        return Number((value * factor).toFixed(4));
      }
      if (type === 'solar_offset') {
        const factor = gridFactorOverride !== undefined && gridFactorOverride >= 0
          ? gridFactorOverride 
          : Math.abs(EMISSION_FACTORS.energy.solar_offset);
        // Solar offset reduces total footprint, thus returned as a negative offset.
        return Number((value * -Math.abs(factor)).toFixed(4));
      }
    }

    // Retrieve corresponding emission factor
    const categoryFactors = EMISSION_FACTORS[category];
    if (!categoryFactors || !(type in categoryFactors)) {
      return 0;
    }

    const factor = categoryFactors[type as keyof typeof categoryFactors];
    const co2 = value * factor;
    
    return Number(co2.toFixed(4));
  }

  /**
   * Safely formats and validates values to prevent overflow or NaN crashes.
   */
  static validateLogValue(value: string | number): number | null {
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
      return null;
    }
    // Prevent extreme inputs (e.g. values exceeding 1,000,000 to prevent integer wrapping)
    if (parsed > 10000000) {
      return null;
    }
    return parsed;
  }
}
export default CarbonCalculator;
