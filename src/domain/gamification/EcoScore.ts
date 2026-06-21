import { ActivityLog } from '../calculator/types';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji representing badge
  unlocked: boolean;
  unlockedAt?: string;
}

export class EcoScore {
  /**
   * Calculates the Eco Score (0 - 100) based on emissions intensity and positive offsets.
   * 100 is an ideal sustainable footprint; 0 is extremely carbon-intensive.
   */
  static calculateEcoScore(logs: ActivityLog[]): number {
    if (logs.length === 0) {
      return 50; // Neutral starting score
    }

    // 1. Calculate average monthly emissions rate
    const times = logs.map(l => new Date(l.timestamp).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeSpanDays = Math.max(1, (maxTime - minTime) / (1000 * 60 * 60 * 24));
    
    const totalEmissions = logs.reduce((sum, l) => sum + (l.co2 > 0 ? l.co2 : 0), 0);
    const totalOffsets = logs.reduce((sum, l) => sum + (l.co2 < 0 ? Math.abs(l.co2) : 0), 0);
    
    const monthlyRate = (totalEmissions / timeSpanDays) * 30;
    const monthlyOffsetRate = (totalOffsets / timeSpanDays) * 30;

    // Standard baseline is 600 kg CO2e/month per person
    // If user produces 0, score is 100. If user produces 1200+ kg, score is reduced to 10.
    const baseScore = 100 - (monthlyRate / 600) * 50;

    // Boost score for offsets and eco actions (composting, recycling, solar)
    const offsetBonus = (monthlyOffsetRate / 100) * 15; // +15 points for every 100kg offset per month
    
    // Add bonus for logging sustainable options (walking, vegan, cycling)
    const ecoActionCount = logs.filter(l => 
      l.type === 'walking' || 
      l.type === 'bicycle' || 
      l.type === 'vegan' || 
      l.type === 'vegetarian' || 
      l.type === 'recycling' || 
      l.type === 'composting' || 
      l.type === 'metro' || 
      l.type === 'high_speed_rail'
    ).length;
    
    const actionBonus = Math.min(15, ecoActionCount * 0.5); // 0.5 points per eco action, up to 15 points

    const finalScore = baseScore + offsetBonus + actionBonus;
    
    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, Math.round(finalScore)));
  }

  /**
   * Translates an Eco Score to a user-friendly sustainability grade.
   */
  static getSustainabilityRating(score: number): { label: string; colorClass: string; desc: string } {
    if (score >= 85) return { label: 'Climate Hero', colorClass: 'score-excellent', desc: 'Outstanding! Your footprint is well within planetary boundaries.' };
    if (score >= 70) return { label: 'Eco Guardian', colorClass: 'score-good', desc: 'Great job! You make active low-carbon choices.' };
    if (score >= 50) return { label: 'Sustaining Citizen', colorClass: 'score-fair', desc: 'Moderate. Minor changes can push you to the next tier.' };
    if (score >= 30) return { label: 'High Emitter', colorClass: 'score-poor', desc: 'Your footprint is above average. Check recommendations.' };
    return { label: 'Carbon Heavy', colorClass: 'score-critical', desc: 'Critical footprint. Substantial action is recommended immediately.' };
  }

  /**
   * Calculates Level and XP thresholds.
   * Progression formula: XP required = level^2 * 100
   */
  static getLevelAndProgress(points: number): { level: number; xpInCurrentLevel: number; xpForNextLevel: number; progressPercent: number } {
    let level = 1;
    let xpRemaining = points;
    
    while (true) {
      const threshold = level * 150; // Level 1 needs 150XP, Level 2 needs 300XP, etc.
      if (xpRemaining < threshold) {
        return {
          level,
          xpInCurrentLevel: xpRemaining,
          xpForNextLevel: threshold,
          progressPercent: Math.round((xpRemaining / threshold) * 100)
        };
      }
      xpRemaining -= threshold;
      level++;
    }
  }

  /**
   * Calculates current consecutive days active.
   */
  static calculateLoggingStreak(logs: ActivityLog[]): number {
    if (logs.length === 0) return 0;

    // Extract unique dates in YYYY-MM-DD format, sorted descending
    const uniqueDates = Array.from(new Set(logs.map(log => log.timestamp.split('T')[0])))
      .map(d => new Date(d).getTime())
      .sort((a, b) => b - a);

    const oneDayMs = 24 * 60 * 60 * 1000;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();
    
    const latestLogDate = uniqueDates[0];
    const diffFromToday = todayMs - latestLogDate;

    // If latest log is older than yesterday, streak is broken
    if (diffFromToday > oneDayMs) {
      return 0;
    }

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const diff = uniqueDates[i] - uniqueDates[i + 1];
      if (diff === oneDayMs) {
        streak++;
      } else if (diff > oneDayMs) {
        // Gap detected, break sequence
        break;
      }
    }

    return streak;
  }

  /**
   * Scans log records to unlock dynamic badges.
   */
  static evaluateBadges(logs: ActivityLog[], completedGoalsCount: number, currentStreak: number): Badge[] {
    const defaultBadges: Badge[] = [
      { id: 'badge_first_log', title: 'First Steps', description: 'Log your first carbon activity.', icon: '🌱', unlocked: false },
      { id: 'badge_commute_clean', title: 'Transit Pioneer', description: 'Log an active transit or walking commute.', icon: '🚲', unlocked: false },
      { id: 'badge_eco_chef', title: 'Green Gastronome', description: 'Log 5 vegan or vegetarian meals.', icon: '🥗', unlocked: false },
      { id: 'badge_solar_power', title: 'Solar Flare', description: 'Log a solar offset generation event.', icon: '☀️', unlocked: false },
      { id: 'badge_waste_warrior', title: 'Zero Waster', description: 'Log 5 recycling or composting events.', icon: '♻️', unlocked: false },
      { id: 'badge_goal_getter', title: 'Goal Crusher', description: 'Achieve at least 1 smart reduction goal.', icon: '🏆', unlocked: false },
      { id: 'badge_streak_3', title: 'Habit Builder', description: 'Maintain a 3-day logging streak.', icon: '🔥', unlocked: false }
    ];

    if (logs.length === 0) return defaultBadges;

    const hasLog = logs.length > 0;
    const hasTransit = logs.some(l => l.category === 'transportation' && ['walking', 'bicycle', 'bus', 'metro', 'local_train', 'high_speed_rail'].includes(l.type));
    const ecoMealsCount = logs.filter(l => l.category === 'food' && ['vegan', 'vegetarian'].includes(l.type)).length;
    const hasSolar = logs.some(l => l.category === 'energy' && l.type === 'solar_offset');
    const wasteRecycleCount = logs.filter(l => l.category === 'waste' && ['recycling', 'composting'].includes(l.type)).length;
    const hasGoal = completedGoalsCount > 0;
    const hasStreak = currentStreak >= 3;

    return defaultBadges.map(badge => {
      let unlock = false;
      switch (badge.id) {
        case 'badge_first_log': unlock = hasLog; break;
        case 'badge_commute_clean': unlock = hasTransit; break;
        case 'badge_eco_chef': unlock = ecoMealsCount >= 5; break;
        case 'badge_solar_power': unlock = hasSolar; break;
        case 'badge_waste_warrior': unlock = wasteRecycleCount >= 5; break;
        case 'badge_goal_getter': unlock = hasGoal; break;
        case 'badge_streak_3': unlock = hasStreak; break;
      }
      return {
        ...badge,
        unlocked: unlock,
        unlockedAt: unlock ? new Date().toISOString() : undefined
      };
    });
  }
}
export default EcoScore;
