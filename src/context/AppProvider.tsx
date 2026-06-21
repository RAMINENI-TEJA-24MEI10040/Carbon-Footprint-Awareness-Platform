import React, { useState, useEffect } from 'react';
import { ActivityLog, UserProfile, HistoricalAuditEntry, ActivityCategory } from '../domain/calculator/types';
import { Goal, GoalManager } from '../domain/goals/GoalManager';
import { StorageService, AppState } from '../services/StorageService';
import { AuditLogger } from '../services/AuditLogger';
import { CarbonCalculator } from '../domain/calculator/CarbonCalculator';
import { EcoScore } from '../domain/gamification/EcoScore';
import { AppContext } from './AppContext';
import { JwtAuthService } from '../services/JwtAuthService';

/**
 * Pure helper function to evaluate goals and update state atomically.
 * Prevents calling setState synchronously inside a useEffect.
 */
function evaluateGoalProgress(state: AppState): AppState {
  let stateChanged = false;
  const now = Date.now();

  const updatedGoals = state.goals.map(goal => {
    if (goal.status !== 'active') return goal;

    // 1. Calculate current emission rates inside the goal window
    const currentRate = GoalManager.calculateCurrentRate(
      state.logs,
      goal.category,
      goal.startDate,
      goal.targetDate
    );

    // 2. Check if goal elapsed time has expired
    const targetTime = new Date(goal.targetDate).getTime();
    let status: Goal['status'] = goal.status;
    
    if (now >= targetTime) {
      status = currentRate <= goal.targetValue ? 'completed' : 'failed';
    }

    if (currentRate !== goal.currentValue || status !== goal.status) {
      stateChanged = true;
      return {
        ...goal,
        currentValue: currentRate,
        status
      };
    }

    return goal;
  });

  if (!stateChanged) {
    return state;
  }

  // Find newly completed goals to reward points
  let pointsRewardSum = 0;
  const newAuditLogs: HistoricalAuditEntry[] = [];
  
  updatedGoals.forEach((ug, i) => {
    const prevGoal = state.goals[i];
    if (prevGoal && prevGoal.status === 'active' && ug.status === 'completed') {
      pointsRewardSum += ug.pointsReward;
      newAuditLogs.push(
        AuditLogger.createEntry('goal_achieved', `Goal achieved! "${ug.title}" completed successfully. Earned ${ug.pointsReward} XP.`)
      );
    } else if (prevGoal && prevGoal.status === 'active' && ug.status === 'failed') {
      newAuditLogs.push(
        AuditLogger.createEntry('update', `Goal period expired for "${ug.title}". Target was not achieved.`)
      );
    }
  });

  return {
    ...state,
    goals: updatedGoals,
    points: state.points + pointsRewardSum,
    auditLogs: [...newAuditLogs, ...state.auditLogs]
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const rawState = StorageService.loadState();
    return evaluateGoalProgress(rawState);
  });

  // Apply theme to HTML tag on startup and state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Synchronize state changes to Local Storage
  const updateStateAndPersist = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const nextRaw = updater(prev);
      const next = evaluateGoalProgress(nextRaw);
      StorageService.saveState(next);
      return next;
    });
  };

  // Gamification Metrics derived from state
  const streak = EcoScore.calculateLoggingStreak(state.logs);
  const ecoScore = EcoScore.calculateEcoScore(state.logs);
  
  // Calculate completed goals count
  const completedGoalsCount = state.goals.filter(g => g.status === 'completed').length;
  const badges = EcoScore.evaluateBadges(state.logs, completedGoalsCount, streak);

  // Profile actions
  const updateProfile = (profile: UserProfile) => {
    updateStateAndPersist(prev => {
      // If grid override changed, recalculate all existing electricity logs
      const logsUpdated = prev.logs.map(log => {
        if (log.category === 'energy' && (log.type === 'electricity' || log.type === 'solar_offset')) {
          const newCo2 = CarbonCalculator.calculateCo2(
            'energy',
            log.type,
            log.value,
            profile.gridFactorOverride
          );
          return { ...log, co2: newCo2 };
        }
        return log;
      });

      const audit = AuditLogger.createEntry(
        'update', 
        `Updated profile parameters: Household Size = ${profile.householdSize}, Country = ${profile.country}.`
      );

      return {
        ...prev,
        profile,
        logs: logsUpdated,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Add Log
  const addLog = (logInput: Omit<ActivityLog, 'id' | 'co2'>) => {
    updateStateAndPersist(prev => {
      const co2 = CarbonCalculator.calculateCo2(
        logInput.category,
        logInput.type,
        logInput.value,
        prev.profile.gridFactorOverride
      );

      const randomArray = new Uint32Array(1);
      window.crypto.getRandomValues(randomArray);
      const newLog: ActivityLog = {
        ...logInput,
        id: `log_${Date.now()}_${randomArray[0].toString(36)}`,
        co2
      } as ActivityLog;

      // Base log gives +10 XP, sustainable eco actions give +25 XP
      const isEco = ['walking', 'bicycle', 'vegan', 'vegetarian', 'recycling', 'composting', 'solar_offset'].includes(logInput.type);
      const pointsEarned = isEco ? 25 : 10;

      const audit = AuditLogger.createEntry(
        'create',
        `Logged ${logInput.category} activity (${logInput.type}): ${logInput.value} ${logInput.unit}. Generated ${co2} kg CO2e.`
      );

      return {
        ...prev,
        logs: [newLog, ...prev.logs],
        points: prev.points + pointsEarned,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Edit Log
  const updateLog = (id: string, updatedFields: Partial<ActivityLog>) => {
    updateStateAndPersist(prev => {
      const logsUpdated = prev.logs.map(log => {
        if (log.id === id) {
          const mergedLog = { ...log, ...updatedFields } as ActivityLog;
          const newCo2 = CarbonCalculator.calculateCo2(
            mergedLog.category,
            mergedLog.type,
            mergedLog.value,
            prev.profile.gridFactorOverride
          );
          return { ...mergedLog, co2: newCo2 };
        }
        return log;
      });

      const originalLog = prev.logs.find(l => l.id === id);
      const auditMsg = originalLog 
        ? `Modified log ${id}. Value changed from ${originalLog.value} to ${updatedFields.value ?? originalLog.value}.`
        : `Modified log ${id}.`;
      
      const audit = AuditLogger.createEntry('update', auditMsg);

      return {
        ...prev,
        logs: logsUpdated,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Delete Log
  const deleteLog = (id: string) => {
    updateStateAndPersist(prev => {
      const deletedLog = prev.logs.find(l => l.id === id);
      const logsUpdated = prev.logs.filter(l => l.id !== id);
      const auditMsg = deletedLog 
        ? `Deleted log: ${deletedLog.category} (${deletedLog.type}) - ${deletedLog.value} ${deletedLog.unit}.`
        : `Deleted log ${id}.`;

      const audit = AuditLogger.createEntry('delete', auditMsg);

      return {
        ...prev,
        logs: logsUpdated,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Bulk Import
  const bulkImportLogs = (importedLogs: Omit<ActivityLog, 'id' | 'co2'>[]) => {
    updateStateAndPersist(prev => {
      const parsedLogs: ActivityLog[] = importedLogs.map((log, index) => {
        const co2 = CarbonCalculator.calculateCo2(
          log.category,
          log.type,
          log.value,
          prev.profile.gridFactorOverride
        );
        return {
          ...log,
          id: `log_import_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
          co2
        } as ActivityLog;
      });

      const audit = AuditLogger.createEntry(
        'bulk_import',
        `Bulk imported ${parsedLogs.length} activity records into database.`
      );

      return {
        ...prev,
        logs: [...parsedLogs, ...prev.logs],
        points: prev.points + (parsedLogs.length * 5), // +5 XP per imported record
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Export CSV
  const exportLogs = (): string => {
    if (state.logs.length === 0) return 'id,timestamp,category,type,value,unit,co2,notes\n';
    
    const headers = ['id', 'timestamp', 'category', 'type', 'value', 'unit', 'co2', 'notes'];
    const rows = state.logs.map(log => [
      log.id,
      log.timestamp,
      log.category,
      log.type,
      log.value,
      log.unit,
      log.co2,
      `"${(log.notes ?? '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // Add Smart Goal
  const addGoal = (goalInput: { category: ActivityCategory | 'all'; targetReductionPercent: number; targetDate: string }) => {
    updateStateAndPersist(prev => {
      const today = new Date().toISOString();
      const baseline = GoalManager.calculateBaseline(prev.logs, goalInput.category, today);
      const target = Number((baseline * (1 - goalInput.targetReductionPercent / 100)).toFixed(2));
      
      const categoryName = goalInput.category === 'all' ? 'Overall' : goalInput.category;
      const title = `Reduce ${categoryName} emissions by ${goalInput.targetReductionPercent}%`;
      
      const randomArray = new Uint32Array(1);
      window.crypto.getRandomValues(randomArray);
      const newGoal: Goal = {
        id: `goal_${Date.now()}_${randomArray[0].toString(36)}`,
        title,
        category: goalInput.category,
        targetReductionPercent: goalInput.targetReductionPercent,
        startDate: today,
        targetDate: new Date(goalInput.targetDate).toISOString(),
        baselineValue: baseline,
        targetValue: target,
        currentValue: baseline, // starts at baseline
        status: 'active',
        pointsReward: goalInput.targetReductionPercent * 15 // rewards higher effort
      };

      const audit = AuditLogger.createEntry(
        'create',
        `Created new smart reduction goal: "${title}" targetting ${target} kg CO2e/month by ${new Date(goalInput.targetDate).toLocaleDateString()}.`
      );

      return {
        ...prev,
        goals: [newGoal, ...prev.goals],
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Manually force goal completeness checking
  const completeGoal = (id: string) => {
    updateStateAndPersist(prev => {
      const goal = prev.goals.find(g => g.id === id);
      if (!goal || goal.status !== 'active') return prev;

      const updated = prev.goals.map(g => {
        if (g.id === id) {
          return { ...g, status: 'completed' as const };
        }
        return g;
      });

      const audit = AuditLogger.createEntry(
        'goal_achieved',
        `Manually marked goal "${goal.title}" as achieved. Rewarded ${goal.pointsReward} XP.`
      );

      return {
        ...prev,
        goals: updated,
        points: prev.points + goal.pointsReward,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Delete Goal
  const deleteGoal = (id: string) => {
    updateStateAndPersist(prev => {
      const deletedGoal = prev.goals.find(g => g.id === id);
      const updated = prev.goals.filter(g => g.id !== id);
      
      const auditMsg = deletedGoal ? `Removed goal: "${deletedGoal.title}".` : `Removed goal ${id}.`;
      const audit = AuditLogger.createEntry('delete', auditMsg);

      return {
        ...prev,
        goals: updated,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Toggle Theme
  const toggleTheme = () => {
    updateStateAndPersist(prev => {
      const nextTheme = prev.theme === 'light' ? 'dark' : 'light';
      return {
        ...prev,
        theme: nextTheme
      };
    });
  };

  // Hard Reset
  const resetAllData = () => {
    const freshState = StorageService.resetState();
    setState(freshState);
  };

  // Verify and set JWT token
  const verifyAndSetToken = async (token: string): Promise<boolean> => {
    const isValid = await JwtAuthService.verifySignature(token);
    if (isValid) {
      const payload = JwtAuthService.decodeToken(token);
      if (payload && payload.admin) {
        updateStateAndPersist(prev => {
          const audit = AuditLogger.createEntry(
            'goal_achieved',
            `Admin access granted to ${payload.name} via verified JWT.`
          );
          return {
            ...prev,
            token,
            isAdmin: true,
            profile: {
              ...prev.profile,
              name: payload.name
            },
            auditLogs: [audit, ...prev.auditLogs]
          };
        });
        return true;
      }
    }
    return false;
  };

  // Logout Admin
  const logoutAdmin = () => {
    updateStateAndPersist(prev => {
      const audit = AuditLogger.createEntry('update', 'Administrator logged out. Reverted to standard profile.');
      return {
        ...prev,
        token: undefined,
        isAdmin: false,
        profile: {
          ...prev.profile,
          name: 'Eco Explorer'
        },
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // Administrator Actions
  const adminUnlockAllBadges = () => {
    updateStateAndPersist(prev => {
      const today = new Date();
      const mockLogsToUnlock: ActivityLog[] = [];
      let logIdx = prev.logs.length + 1;

      // Seed logs for streaks
      for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        mockLogsToUnlock.push({
          id: `log_admin_badge_streak_${Date.now()}_${logIdx++}`,
          timestamp: d.toISOString(),
          category: 'transportation',
          type: 'bicycle',
          value: 10,
          unit: 'km',
          co2: 0,
          notes: 'Admin Badge Streaker Log'
        } as ActivityLog);
      }

      // Food meals
      for (let i = 0; i < 5; i++) {
        mockLogsToUnlock.push({
          id: `log_admin_badge_food_${Date.now()}_${logIdx++}`,
          timestamp: today.toISOString(),
          category: 'food',
          type: 'vegan',
          value: 1,
          unit: 'meals',
          co2: CarbonCalculator.calculateCo2('food', 'vegan', 1),
          notes: 'Admin Badge Food Log'
        } as ActivityLog);
      }

      // Solar offset
      mockLogsToUnlock.push({
        id: `log_admin_badge_solar_${Date.now()}_${logIdx++}`,
        timestamp: today.toISOString(),
        category: 'energy',
        type: 'solar_offset',
        value: 15,
        unit: 'kWh',
        co2: CarbonCalculator.calculateCo2('energy', 'solar_offset', 15),
        notes: 'Admin Badge Solar Log'
      } as ActivityLog);

      // Waste recycling
      for (let i = 0; i < 5; i++) {
        mockLogsToUnlock.push({
          id: `log_admin_badge_waste_${Date.now()}_${logIdx++}`,
          timestamp: today.toISOString(),
          category: 'waste',
          type: 'recycling',
          value: 2,
          unit: 'kg',
          co2: CarbonCalculator.calculateCo2('waste', 'recycling', 2),
          notes: 'Admin Badge Waste Log'
        } as ActivityLog);
      }

      // Add a completed smart goal
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);
      const completedGoal: Goal = {
        id: `goal_admin_badge_${Date.now()}`,
        title: 'Admin Smart Goal Override',
        category: 'all',
        targetReductionPercent: 10,
        startDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        targetDate: futureDate.toISOString(),
        baselineValue: 300,
        targetValue: 270,
        currentValue: 250,
        status: 'completed',
        pointsReward: 500
      };

      const audit = AuditLogger.createEntry('goal_achieved', 'Administrator executed batch gamification state unlock.');
      return {
        ...prev,
        logs: [...mockLogsToUnlock, ...prev.logs],
        goals: [completedGoal, ...prev.goals],
        points: prev.points + 500,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  const adminClearAuditTrail = () => {
    updateStateAndPersist(prev => {
      const audit = AuditLogger.createEntry('delete', 'Administrator cleared the historical audit log trail.');
      return {
        ...prev,
        auditLogs: [audit]
      };
    });
  };

  const adminSeedLoadLogs = () => {
    updateStateAndPersist(prev => {
      const extraLogs: ActivityLog[] = [];
      const categories: ActivityCategory[] = ['transportation', 'energy', 'food', 'waste', 'shopping', 'water'];
      const typesMap: Record<ActivityCategory, string[]> = {
        transportation: ['petrol_car', 'ev', 'bus', 'metro'],
        energy: ['electricity', 'natural_gas'],
        food: ['vegan', 'mixed_diet', 'high_meat'],
        waste: ['recycling', 'organic_waste'],
        shopping: ['clothing', 'electronics'],
        water: ['daily_consumption', 'heated_water']
      };
      const unitsMap: Record<ActivityCategory, string> = {
        transportation: 'km',
        energy: 'kWh',
        food: 'meals',
        waste: 'kg',
        shopping: 'items',
        water: 'liters'
      };

      for (let i = 1; i <= 100; i++) {
        const cat = categories[i % categories.length];
        const subTypes = typesMap[cat];
        const type = subTypes[i % subTypes.length];
        const val = 5 + (i * 7) % 50;
        const daysAgo = Math.floor((i / 100) * 180);
        const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        const co2 = CarbonCalculator.calculateCo2(cat, type, val, prev.profile.gridFactorOverride);

        extraLogs.push({
          id: `log_admin_seed_${Date.now()}_${i}`,
          timestamp,
          category: cat,
          type,
          value: val,
          unit: unitsMap[cat],
          co2,
          notes: `Admin performance load-test seed #${i}`
        } as ActivityLog);
      }

      const audit = AuditLogger.createEntry('bulk_import', `Admin loaded 100 benchmark activity records into database.`);
      return {
        ...prev,
        logs: [...extraLogs, ...prev.logs],
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  return (
    <AppContext.Provider value={{
      profile: state.profile,
      logs: state.logs,
      goals: state.goals,
      points: state.points,
      theme: state.theme,
      auditLogs: state.auditLogs,
      badges,
      ecoScore,
      streak,
      token: state.token,
      isAdmin: state.isAdmin,
      updateProfile,
      addLog,
      updateLog,
      deleteLog,
      bulkImportLogs,
      exportLogs,
      addGoal,
      completeGoal,
      deleteGoal,
      toggleTheme,
      resetAllData,
      verifyAndSetToken,
      logoutAdmin,
      adminUnlockAllBadges,
      adminClearAuditTrail,
      adminSeedLoadLogs
    }}>
      {children}
    </AppContext.Provider>
  );
};
