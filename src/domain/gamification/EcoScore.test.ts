import { describe, it, expect } from 'vitest';
import { EcoScore } from './EcoScore';
import { ActivityLog } from '../calculator/types';

describe('EcoScore', () => {
  it('should return default score 50 when no logs exist', () => {
    const logs: ActivityLog[] = [];
    const score = EcoScore.calculateEcoScore(logs);
    expect(score).toBe(50);
  });

  it('should calculate Eco Score correctly with logs', () => {
    const logs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'energy', type: 'electricity', value: 100, unit: 'kWh', co2: 38.0 },
      { id: '2', timestamp: new Date().toISOString(), category: 'waste', type: 'recycling', value: 20, unit: 'kg', co2: -7.0 }
    ];
    const score = EcoScore.calculateEcoScore(logs);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate XP levels correctly', () => {
    // Level 1: 0 - 150 XP
    const lv1 = EcoScore.getLevelAndProgress(50);
    expect(lv1.level).toBe(1);
    expect(lv1.xpInCurrentLevel).toBe(50);
    expect(lv1.xpForNextLevel).toBe(150);

    // Level 2: 150 - 450 XP (300 XP threshold for Level 2)
    const lv2 = EcoScore.getLevelAndProgress(200);
    expect(lv2.level).toBe(2);
    expect(lv2.xpInCurrentLevel).toBe(50); // 200 - 150 = 50
    expect(lv2.xpForNextLevel).toBe(300);
  });

  it('should return correct sustainability ratings and color classes', () => {
    expect(EcoScore.getSustainabilityRating(90).label).toBe('Climate Hero');
    expect(EcoScore.getSustainabilityRating(75).label).toBe('Eco Guardian');
    expect(EcoScore.getSustainabilityRating(60).label).toBe('Sustaining Citizen');
    expect(EcoScore.getSustainabilityRating(40).label).toBe('High Emitter');
    expect(EcoScore.getSustainabilityRating(10).label).toBe('Carbon Heavy');
  });

  it('should calculate logging streaks correctly', () => {
    // Create logs on consecutive days
    const today = new Date().toISOString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);

    const logs: ActivityLog[] = [
      { id: '1', timestamp: today, category: 'food', type: 'vegan', value: 1, unit: 'meals', co2: 0.6 },
      { id: '2', timestamp: yesterday.toISOString(), category: 'food', type: 'vegetarian', value: 1, unit: 'meals', co2: 1.35 },
      { id: '3', timestamp: dayBefore.toISOString(), category: 'food', type: 'mixed_diet', value: 1, unit: 'meals', co2: 2.5 }
    ];

    const streak = EcoScore.calculateLoggingStreak(logs);
    expect(streak).toBe(3); // 3 consecutive days
  });

  it('should return 0 streak for empty logs', () => {
    expect(EcoScore.calculateLoggingStreak([])).toBe(0);
  });

  it('should break streak when logs are too far apart', () => {
    const today = new Date().toISOString();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const logs: ActivityLog[] = [
      { id: '1', timestamp: today, category: 'food', type: 'vegan', value: 1, unit: 'meals', co2: 0.6 },
      { id: '2', timestamp: fourDaysAgo.toISOString(), category: 'food', type: 'vegan', value: 1, unit: 'meals', co2: 0.6 }
    ];

    const streak = EcoScore.calculateLoggingStreak(logs);
    expect(streak).toBe(1); // just today, streak was broken
  });

  it('should return 0 streak if latest log is older than yesterday', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const logs: ActivityLog[] = [
      { id: '1', timestamp: threeDaysAgo.toISOString(), category: 'food', type: 'vegan', value: 1, unit: 'meals', co2: 0.6 }
    ];

    const streak = EcoScore.calculateLoggingStreak(logs);
    expect(streak).toBe(0);
  });

  it('should unlock badges correctly under different user actions', () => {
    const logs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'food', type: 'vegan', value: 1, unit: 'meals', co2: 0.6 }
    ];

    let badges = EcoScore.evaluateBadges(logs, 0, 1);
    expect(badges.find(b => b.id === 'badge_first_log')!.unlocked).toBe(true);
    expect(badges.find(b => b.id === 'badge_commute_clean')!.unlocked).toBe(false);

    // Unlocking commute clean badge
    const transitLogs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'transportation', type: 'bicycle', value: 5, unit: 'km', co2: 0 }
    ];
    badges = EcoScore.evaluateBadges(transitLogs, 0, 1);
    expect(badges.find(b => b.id === 'badge_commute_clean')!.unlocked).toBe(true);

    // Unlocking solar power badge
    const solarLogs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'energy', type: 'solar_offset', value: 10, unit: 'kWh', co2: -3.8 }
    ];
    badges = EcoScore.evaluateBadges(solarLogs, 0, 1);
    expect(badges.find(b => b.id === 'badge_solar_power')!.unlocked).toBe(true);

    // Unlocking goal getter badge
    badges = EcoScore.evaluateBadges(logs, 1, 1);
    expect(badges.find(b => b.id === 'badge_goal_getter')!.unlocked).toBe(true);

    // Unlocking streak badge
    badges = EcoScore.evaluateBadges(logs, 0, 3);
    expect(badges.find(b => b.id === 'badge_streak_3')!.unlocked).toBe(true);
  });
});
