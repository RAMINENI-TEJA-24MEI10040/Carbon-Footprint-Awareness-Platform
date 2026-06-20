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
  });
});
