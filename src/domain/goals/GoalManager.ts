import { ActivityLog, ActivityCategory } from '../calculator/types';

export interface Goal {
  id: string;
  title: string;
  category: ActivityCategory | 'all';
  targetReductionPercent: number; // e.g., 15 for 15% reduction
  startDate: string;
  targetDate: string;
  baselineValue: number;          // kg CO2e per month baseline
  targetValue: number;            // kg CO2e target per month
  currentValue: number;           // kg CO2e current monthly rate (extrapolated from logged items)
  status: 'active' | 'completed' | 'failed';
  pointsReward: number;
}

export class GoalManager {
  /**
   * Calculates the baseline emissions (kg CO2e per month) in a given category.
   * If there are insufficient logs, defaults to a standard reference baseline.
   */
  static calculateBaseline(
    logs: ActivityLog[],
    category: ActivityCategory | 'all',
    startDate: string
  ): number {
    const startMs = new Date(startDate).getTime();
    
    // Select logs before the goal start date
    const baselineLogs = logs.filter(log => new Date(log.timestamp).getTime() < startMs);
    
    if (baselineLogs.length === 0) {
      // Default standard monthly baseline references (in kg CO2e per month)
      // based on average footprints.
      const defaults: Record<string, number> = {
        all: 650,
        transportation: 250,
        energy: 220,
        food: 120,
        waste: 25,
        shopping: 45,
        water: 10
      };
      return defaults[category] || 100;
    }

    // Determine the baseline time range
    const times = baselineLogs.map(l => new Date(l.timestamp).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    // Standardize to monthly rate (30 days)
    const timeSpanDays = Math.max(3, (maxTime - minTime) / (1000 * 60 * 60 * 24));
    
    const totalBaselineCo2 = baselineLogs
      .filter(log => category === 'all' || log.category === category)
      .reduce((sum, log) => sum + log.co2, 0);

    return Number(((totalBaselineCo2 / timeSpanDays) * 30).toFixed(2));
  }

  /**
   * Calculates the current emissions rate (kg CO2e per month) during the active goal period.
   * Extrapolates based on elapsed days in the goal range.
   */
  static calculateCurrentRate(
    logs: ActivityLog[],
    category: ActivityCategory | 'all',
    startDate: string,
    targetDate: string
  ): number {
    const startMs = new Date(startDate).getTime();
    const targetMs = new Date(targetDate).getTime();
    const nowMs = Date.now();
    const endBoundMs = Math.min(nowMs, targetMs);

    // Get logs during the goal active window
    const activeLogs = logs.filter(log => {
      const time = new Date(log.timestamp).getTime();
      return time >= startMs && time <= endBoundMs;
    });

    const totalCo2 = activeLogs
      .filter(log => category === 'all' || log.category === category)
      .reduce((sum, log) => sum + log.co2, 0);

    const elapsedDays = Math.max(1, (endBoundMs - startMs) / (1000 * 60 * 60 * 24));
    
    // Extrapolate daily rate to monthly rate (30 days)
    return Number(((totalCo2 / elapsedDays) * 30).toFixed(2));
  }

  /**
   * Computes the current completion progress percent (0 - 100).
   */
  static calculateProgress(goal: Goal): number {
    const baseline = goal.baselineValue;
    const current = goal.currentValue;
    const target = goal.targetValue;
    
    if (current <= target) {
      return 100;
    }
    if (current >= baseline) {
      return 0;
    }

    const totalNeededReduction = baseline - target;
    const actualReduction = baseline - current;

    if (totalNeededReduction <= 0) return 100;

    const progress = (actualReduction / totalNeededReduction) * 100;
    return Math.max(0, Math.min(100, Number(progress.toFixed(1))));
  }

  /**
   * Forecasts the success probability of the goal (0 - 100).
   * Relies on the remaining time, rate of progress, and current state.
   */
  static estimateSuccessProbability(goal: Goal, logs: ActivityLog[]): number {
    const now = Date.now();
    const start = new Date(goal.startDate).getTime();
    const target = new Date(goal.targetDate).getTime();
    
    if (now >= target) {
      return goal.currentValue <= goal.targetValue ? 100 : 0;
    }

    const totalDuration = target - start;
    const elapsed = now - start;
    const ratioElapsed = Math.min(1, elapsed / totalDuration);

    const progress = this.calculateProgress(goal);

    if (ratioElapsed < 0.15) {
      // Too early to project with high certainty. Return a standard 50% baseline.
      return 50;
    }

    // Success factor is a function of progress relative to time elapsed
    // E.g. if we are 50% through the time, and have 60% progress, we are highly likely to succeed.
    const expectedProgress = ratioElapsed * 100;
    const deviation = progress - expectedProgress;

    // Map deviation to a probability between 10% and 95%
    let prob = 50 + (deviation * 1.5);
    
    // Boost probability if current rate is already below or at target
    if (goal.currentValue <= goal.targetValue) {
      prob += 20;
    }

    // Check if the user has logged any activities in this goal period to verify active engagement
    const hasActiveLogs = logs.some(log => {
      const time = new Date(log.timestamp).getTime();
      return time >= start && time <= now;
    });

    if (!hasActiveLogs) {
      prob -= 15; // penalize inactive engagement
    }

    return Math.max(10, Math.min(98, Math.round(prob)));
  }

  /**
   * Checks milestones achieved based on current completion.
   */
  static getMilestones(goal: Goal): { label: string; reached: boolean }[] {
    const progress = this.calculateProgress(goal);
    return [
      { label: 'Initiated (Goal Created)', reached: true },
      { label: '25% Reduction Milestone', reached: progress >= 25 },
      { label: '50% Reduction Milestone', reached: progress >= 50 },
      { label: '75% Reduction Milestone', reached: progress >= 75 },
      { label: 'Completed (Target Achieved)', reached: progress >= 100 }
    ];
  }
}
export default GoalManager;
