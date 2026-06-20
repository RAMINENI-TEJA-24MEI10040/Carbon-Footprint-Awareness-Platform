import { describe, it, expect } from 'vitest';
import { EcoScore } from './EcoScore';
import { ActivityLog } from '../calculator/types';

describe('EcoScore', () => {
  it('should return default score 50 when no logs exist', () => {
    const logs: ActivityLog[] = [];
    const score = EcoScore.calculateEcoScore(logs);
    expect(score).toBe(50);
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

  it('should unlock first steps badge on first log entry', () => {
    const logs: ActivityLog[] = [
      { id: '1', timestamp: new Date().toISOString(), category: 'food', type: 'vegan', value: 1, unit: 'meals', co2: 0.6 }
    ];

    const badges = EcoScore.evaluateBadges(logs, 0, 1);
    const firstLogBadge = badges.find(b => b.id === 'badge_first_log');
    expect(firstLogBadge!.unlocked).toBe(true);
    
    // Streak badge should remain locked (streak is 1, needs 3)
    const streakBadge = badges.find(b => b.id === 'badge_streak_3');
    expect(streakBadge!.unlocked).toBe(false);
  });
});
