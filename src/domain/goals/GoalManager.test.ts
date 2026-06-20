import { describe, it, expect } from 'vitest';
import { GoalManager, Goal } from './GoalManager';
import { ActivityLog } from '../calculator/types';

describe('GoalManager', () => {
  it('should calculate baseline fallback when no historical logs exist', () => {
    const logs: ActivityLog[] = [];
    const baseline = GoalManager.calculateBaseline(logs, 'all', new Date().toISOString());
    expect(baseline).toBe(650); // overall default fallback
  });

  it('should calculate progress percentage accurately', () => {
    const mockGoal: Goal = {
      id: 'g_1',
      title: 'Reduce Carbon',
      category: 'all',
      targetReductionPercent: 20,
      startDate: new Date().toISOString(),
      targetDate: new Date().toISOString(),
      baselineValue: 100,
      targetValue: 80,
      currentValue: 90, // halfway down to target (10kg saved out of 20kg target)
      status: 'active',
      pointsReward: 100
    };

    const progress = GoalManager.calculateProgress(mockGoal);
    expect(progress).toBe(50.0); // 50% completed

    const achievedGoal = { ...mockGoal, currentValue: 75 };
    expect(GoalManager.calculateProgress(achievedGoal)).toBe(100); // capped at 100%

    const regressionGoal = { ...mockGoal, currentValue: 110 };
    expect(GoalManager.calculateProgress(regressionGoal)).toBe(0); // clamped at 0%
  });

  it('should evaluate milestones status lists correctly', () => {
    const mockGoal: Goal = {
      id: 'g_2',
      title: 'Reduce Carbon',
      category: 'all',
      targetReductionPercent: 20,
      startDate: new Date().toISOString(),
      targetDate: new Date().toISOString(),
      baselineValue: 100,
      targetValue: 80,
      currentValue: 90,
      status: 'active',
      pointsReward: 100
    };

    const milestones = GoalManager.getMilestones(mockGoal);
    expect(milestones[0].reached).toBe(true); // initiated is true
    expect(milestones[1].reached).toBe(true); // 25% is true
    expect(milestones[2].reached).toBe(true); // 50% is true
    expect(milestones[3].reached).toBe(false); // 75% is false
    expect(milestones[4].reached).toBe(false); // 100% is false
  });
});
