import { ActivityLog, UserProfile, HistoricalAuditEntry, FoodActivity } from '../domain/calculator/types';
import { Goal } from '../domain/goals/GoalManager';
import CarbonCalculator from '../domain/calculator/CarbonCalculator';

const STORAGE_KEY = 'carbon_assistant_state_v1';

export interface AppState {
  profile: UserProfile;
  logs: ActivityLog[];
  goals: Goal[];
  points: number;
  theme: 'light' | 'dark';
  auditLogs: HistoricalAuditEntry[];
  token?: string;
  isAdmin?: boolean;
}

export class StorageService {
  /**
   * Generates high-quality mockup logs spanning the last 30 days.
   * Dates are computed relative to current time so the logs fit nicely on charts.
   */
  private static generateMockLogs(): ActivityLog[] {
    const mockLogs: ActivityLog[] = [];
    const now = new Date();
    
    // Create random IDs
    const nextId = (prefix: string, index: number) => `${prefix}_mock_${index}`;

    // A helper to generate iso dates offsets
    const getOffsetDate = (daysAgo: number) => {
      const d = new Date();
      d.setDate(now.getDate() - daysAgo);
      return d.toISOString();
    };

    let logIdx = 1;

    // 1. Commutes (Transportation)
    // Daily commutes of 15km on weekdays
    for (let i = 1; i <= 28; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (!isWeekend) {
        // Log car trip (80% petrol car, 20% walking/transit)
        if (i % 5 !== 0) {
          const val = 18; // 18 km commute
          mockLogs.push({
            id: nextId('trans', logIdx++),
            timestamp: date.toISOString(),
            category: 'transportation',
            type: 'petrol_car',
            value: val,
            unit: 'km',
            co2: CarbonCalculator.calculateCo2('transportation', 'petrol_car', val),
            notes: 'Daily office round-trip commute.'
          });
        } else {
          // Bike or walking
          const val = 4;
          mockLogs.push({
            id: nextId('trans', logIdx++),
            timestamp: date.toISOString(),
            category: 'transportation',
            type: 'bicycle',
            value: val,
            unit: 'km',
            co2: 0,
            notes: 'Cycled to work on a sunny day.'
          });
        }
      }
    }

    // 2. High-speed rail weekend trip (2 weeks ago)
    const tripVal = 250; // 250km rail trip
    mockLogs.push({
      id: nextId('trans', logIdx++),
      timestamp: getOffsetDate(14),
      category: 'transportation',
      type: 'high_speed_rail',
      value: tripVal,
      unit: 'km',
      co2: CarbonCalculator.calculateCo2('transportation', 'high_speed_rail', tripVal),
      notes: 'Weekend getaway rail travel.'
    });

    // 3. Energy logs (Utility bills)
    // Electricity bill (15 days ago)
    const elecVal = 210; // 210 kWh
    mockLogs.push({
      id: nextId('energy', logIdx++),
      timestamp: getOffsetDate(15),
      category: 'energy',
      type: 'electricity',
      value: elecVal,
      unit: 'kWh',
      co2: CarbonCalculator.calculateCo2('energy', 'electricity', elecVal),
      notes: 'Monthly electric power utility invoice.'
    });

    // Solar offset (10 days ago)
    const solarVal = 65; // 65 kWh generated
    mockLogs.push({
      id: nextId('energy', logIdx++),
      timestamp: getOffsetDate(10),
      category: 'energy',
      type: 'solar_offset',
      value: solarVal,
      unit: 'kWh',
      co2: CarbonCalculator.calculateCo2('energy', 'solar_offset', solarVal),
      notes: 'Rooftop solar generation feedback offset.'
    });

    // Gas usage (20 days ago)
    const gasVal = 145; // 145 kWh equivalent
    mockLogs.push({
      id: nextId('energy', logIdx++),
      timestamp: getOffsetDate(20),
      category: 'energy',
      type: 'natural_gas',
      value: gasVal,
      unit: 'kWh',
      co2: CarbonCalculator.calculateCo2('energy', 'natural_gas', gasVal),
      notes: 'Natural gas heating log.'
    });

    // 4. Food logs (daily dinners logged)
    const foodTypes = ['mixed_diet', 'vegetarian', 'vegan', 'mixed_diet', 'high_meat', 'vegetarian', 'vegan'];
    for (let i = 1; i <= 28; i++) {
      const type = foodTypes[i % foodTypes.length];
      mockLogs.push({
        id: nextId('food', logIdx++),
        timestamp: getOffsetDate(i),
        category: 'food',
        type: type as FoodActivity['type'],
        value: 1,
        unit: 'meals',
        co2: CarbonCalculator.calculateCo2('food', type, 1),
        notes: `Dinner log: ${type.replace('_', ' ')}.`
      });
    }

    // 5. Waste (Weekly pickups)
    for (let i = 1; i <= 4; i++) {
      const offset = i * 7;
      // Recycling
      mockLogs.push({
        id: nextId('waste', logIdx++),
        timestamp: getOffsetDate(offset),
        category: 'waste',
        type: 'recycling',
        value: 12, // 12 kg
        unit: 'kg',
        co2: CarbonCalculator.calculateCo2('waste', 'recycling', 12),
        notes: 'Cardboard, tin, and plastic recycling bin.'
      });
      // Organic Waste
      mockLogs.push({
        id: nextId('waste', logIdx++),
        timestamp: getOffsetDate(offset),
        category: 'waste',
        type: 'organic_waste',
        value: 8,
        unit: 'kg',
        co2: CarbonCalculator.calculateCo2('waste', 'organic_waste', 8),
        notes: 'Food scrap wastes.'
      });
    }

    // 6. Shopping logs
    mockLogs.push({
      id: nextId('shop', logIdx++),
      timestamp: getOffsetDate(5),
      category: 'shopping',
      type: 'clothing',
      value: 2,
      unit: 'items',
      co2: CarbonCalculator.calculateCo2('shopping', 'clothing', 2),
      notes: 'Bought organic cotton shirts.'
    });
    mockLogs.push({
      id: nextId('shop', logIdx++),
      timestamp: getOffsetDate(18),
      category: 'shopping',
      type: 'electronics',
      value: 1,
      unit: 'items',
      co2: CarbonCalculator.calculateCo2('shopping', 'electronics', 1),
      notes: 'New Bluetooth earbuds.'
    });

    // 7. Water (Averaged logs)
    for (let i = 1; i <= 28; i += 3) {
      mockLogs.push({
        id: nextId('water', logIdx++),
        timestamp: getOffsetDate(i),
        category: 'water',
        type: 'daily_consumption',
        value: 140, // 140L daily average
        unit: 'liters',
        co2: CarbonCalculator.calculateCo2('water', 'daily_consumption', 140),
        notes: 'Three-day average household water estimation.'
      });
    }

    return mockLogs;
  }

  /**
   * Initializes or loads the saved application state.
   */
  static loadState(): AppState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Basic schema verification
        if (parsed.profile && Array.isArray(parsed.logs) && Array.isArray(parsed.goals)) {
          return parsed as AppState;
        }
      }
    } catch (e) {
      console.error('Failed to parse local storage state. Falling back to defaults.', e);
    }

    // Fallback: Default starting state with mock data
    const defaultProfile: UserProfile = {
      name: 'Eco Explorer',
      householdSize: 2,
      country: 'United Kingdom'
    };

    const mockLogs = this.generateMockLogs();
    
    // Default goals
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const defaultGoals: Goal[] = [
      {
        id: 'goal_food_reduction',
        title: 'Cut food footprint by 20%',
        category: 'food',
        targetReductionPercent: 20,
        startDate: today.toISOString(),
        targetDate: futureDate.toISOString(),
        baselineValue: 58.50, // estimated monthly base food footprint
        targetValue: 46.80,
        currentValue: 52.00,
        status: 'active',
        pointsReward: 300
      },
      {
        id: 'goal_commute_reduction',
        title: 'Reduce commuting emissions by 15%',
        category: 'transportation',
        targetReductionPercent: 15,
        startDate: today.toISOString(),
        targetDate: futureDate.toISOString(),
        baselineValue: 120.00,
        targetValue: 102.00,
        currentValue: 114.00,
        status: 'active',
        pointsReward: 250
      }
    ];

    const initialState: AppState = {
      profile: defaultProfile,
      logs: mockLogs,
      goals: defaultGoals,
      points: 220, // start with some points from mock history
      theme: 'dark', // default to dark theme for maximum wow effect!
      auditLogs: [
        {
          id: 'audit_init',
          timestamp: new Date().toISOString(),
          action: 'create',
          details: 'Application initial state created with sample historical logs.'
        }
      ]
    };

    this.saveState(initialState);
    return initialState;
  }

  /**
   * Persists application state in local storage.
   */
  static saveState(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  /**
   * Resets local storage back to fresh mock data.
   */
  static resetState(): AppState {
    localStorage.removeItem(STORAGE_KEY);
    return this.loadState();
  }
}
export default StorageService;
