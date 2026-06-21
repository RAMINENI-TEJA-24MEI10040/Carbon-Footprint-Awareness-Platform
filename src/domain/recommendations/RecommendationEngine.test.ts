import { describe, it, expect } from 'vitest';
import { RecommendationEngine } from './RecommendationEngine';
import { ActivityLog, UserProfile } from '../calculator/types';

describe('RecommendationEngine', () => {
  const mockProfile: UserProfile = {
    name: 'Test Citizen',
    householdSize: 3,
    country: 'United Kingdom'
  };

  it('should generate transport public transit recommendation for high car mileage', () => {
    // 200km driving in petrol car logged today (1 day span = 0.14 weeks, making it extremely high weekly average)
    const logs: ActivityLog[] = [
      {
        id: 'log_1',
        timestamp: new Date().toISOString(),
        category: 'transportation',
        type: 'petrol_car',
        value: 200,
        unit: 'km',
        co2: 34.0
      }
    ];

    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    
    // Check that we have a public transit recommendation
    const publicTransitRec = recommendations.find(r => r.id === 'rec_transport_public_transit');
    expect(publicTransitRec).toBeDefined();
    expect(publicTransitRec!.co2ReductionAnnual).toBeGreaterThan(0);
    expect(publicTransitRec!.monthlySavings).toBeGreaterThan(0);
    expect(publicTransitRec!.priority).toBe(1);
  });

  it('should generate EV recommendation for extremely high car mileage', () => {
    const logs: ActivityLog[] = [
      {
        id: 'log_1',
        timestamp: new Date().toISOString(),
        category: 'transportation',
        type: 'petrol_car',
        value: 1000,
        unit: 'km',
        co2: 170.0
      }
    ];

    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    expect(recommendations.find(r => r.id === 'rec_transport_ev')).toBeDefined();
  });

  it('should generate default transport recommendation for low mileage', () => {
    const logs: ActivityLog[] = [];
    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    expect(recommendations.find(r => r.id === 'rec_transport_walking')).toBeDefined();
  });

  it('should generate energy adjustments recommendations for high electricity logs', () => {
    const logs: ActivityLog[] = [
      {
        id: 'log_2',
        timestamp: new Date().toISOString(),
        category: 'energy',
        type: 'electricity',
        value: 300,
        unit: 'kWh',
        co2: 114.0
      }
    ];

    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    
    const energyRec = recommendations.find(r => r.id === 'rec_energy_efficiency');
    expect(energyRec).toBeDefined();
    expect(energyRec!.co2ReductionAnnual).toBeGreaterThan(0);

    // Household size 3 -> solar recommendation should also be generated
    expect(recommendations.find(r => r.id === 'rec_energy_solar')).toBeDefined();
  });

  it('should generate standby power saving recommendations for low electricity usage', () => {
    const logs: ActivityLog[] = [];
    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    expect(recommendations.find(r => r.id === 'rec_energy_default')).toBeDefined();
  });

  it('should generate diet recommendation for meat-heavy logs', () => {
    const logs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'food', type: 'high_meat', value: 10, unit: 'meals', co2: 48.0 }
    ];
    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    expect(recommendations.find(r => r.id === 'rec_food_diet_swap')).toBeDefined();
  });

  it('should generate organic food recommendation for low-meat logs', () => {
    const logs: ActivityLog[] = [];
    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    expect(recommendations.find(r => r.id === 'rec_food_local')).toBeDefined();
  });

  it('should generate recycling recommendation for waste logs', () => {
    const logs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'waste', type: 'plastic_waste', value: 5, unit: 'kg', co2: 4.5 }
    ];
    const recommendations = RecommendationEngine.generateRecommendations(logs, mockProfile);
    expect(recommendations.find(r => r.id === 'rec_waste_recycle')).toBeDefined();
  });
});
