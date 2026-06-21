import { describe, it, expect } from 'vitest';
import { GoalManager, Goal } from './GoalManager';
import { ActivityLog } from '../calculator/types';

describe('GoalManager', () => {
  const today = new Date().toISOString();

  it('should return default reference baseline if there are no historical logs before goal start', () => {
    const logs: ActivityLog[] = [];
    const baseline = GoalManager.calculateBaseline(logs, 'food', today);
    expect(baseline).toBe(120); // default for food

    const overallBaseline = GoalManager.calculateBaseline(logs, 'all', today);
    expect(overallBaseline).toBe(650); // default for all
    
    const unrecognizedBaseline = GoalManager.calculateBaseline(logs, 'unrecognized' as unknown as 'food', today);
    expect(unrecognizedBaseline).toBe(100); // generic fallback
  });

  it('should calculate baseline correctly based on historical logs', () => {
    const start = new Date();
    
    // Create historical logs spread over 6 days (span = 5 days)
    const logs: ActivityLog[] = [];
    for (let i = 1; i <= 6; i++) {
      const logDate = new Date();
      logDate.setDate(start.getDate() - i);
      logs.push({
        id: `log_${i}`,
        timestamp: logDate.toISOString(),
        category: 'food',
        type: 'mixed_diet',
        value: 1,
        unit: 'meals',
        co2: 2.5
      });
    }

    const baseline = GoalManager.calculateBaseline(logs, 'food', start.toISOString());
    // total CO2 = 6 * 2.5 = 15 kg
    // span days = 5 days
    // monthly rate = (15 / 5) * 30 = 90 kg
    expect(baseline).toBe(90);
  });

  it('should calculate progress percentage correctly', () => {
    const mockGoal: Goal = {
      id: 'g1',
      title: 'Reduce emissions',
      category: 'all',
      targetReductionPercent: 10,
      startDate: today,
      targetDate: today,
      baselineValue: 100,
      targetValue: 90,
      currentValue: 95,
      status: 'active',
      pointsReward: 100
    };

    // 95 currentValue is halfway between 100 baseline and 90 target -> progress is 50%
    expect(GoalManager.calculateProgress(mockGoal)).toBe(50.0);

    // If current value is below or equal to target -> progress is 100%
    mockGoal.currentValue = 85;
    expect(GoalManager.calculateProgress(mockGoal)).toBe(100.0);

    // If current value is above or equal to baseline -> progress is 0%
    mockGoal.currentValue = 105;
    expect(GoalManager.calculateProgress(mockGoal)).toBe(0.0);
    
    // If targetValue is greater than or equal to baselineValue -> progress is 100%
    mockGoal.baselineValue = 90;
    mockGoal.targetValue = 90;
    mockGoal.currentValue = 90;
    expect(GoalManager.calculateProgress(mockGoal)).toBe(100.0);
  });

  it('should estimate success probability accurately', () => {
    const start = new Date();
    const target = new Date();
    target.setDate(start.getDate() + 10); // 10 days duration

    const mockGoal: Goal = {
      id: 'g1',
      title: 'Reduce emissions',
      category: 'all',
      targetReductionPercent: 10,
      startDate: start.toISOString(),
      targetDate: target.toISOString(),
      baselineValue: 100,
      targetValue: 90,
      currentValue: 95,
      status: 'active',
      pointsReward: 100
    };

    // If goal period is not started or elapsed < 15% -> returns 50%
    expect(GoalManager.estimateSuccessProbability(mockGoal, [])).toBe(50);
  });

  it('should generate correct milestones list', () => {
    const mockGoal: Goal = {
      id: 'g1',
      title: 'Reduce emissions',
      category: 'all',
      targetReductionPercent: 10,
      startDate: today,
      targetDate: today,
      baselineValue: 100,
      targetValue: 90,
      currentValue: 95,
      status: 'active',
      pointsReward: 100
    };

    const milestones = GoalManager.getMilestones(mockGoal);
    expect(milestones.find(m => m.label === 'Initiated (Goal Created)')!.reached).toBe(true);
    expect(milestones.find(m => m.label === '50% Reduction Milestone')!.reached).toBe(true);
    expect(milestones.find(m => m.label === '75% Reduction Milestone')!.reached).toBe(false);
  });
});
