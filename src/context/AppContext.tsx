import { createContext, useContext } from 'react';
import { ActivityLog, UserProfile, HistoricalAuditEntry, ActivityCategory } from '../domain/calculator/types';
import { Goal } from '../domain/goals/GoalManager';
import { Badge } from '../domain/gamification/EcoScore';

export interface AppContextType {
  profile: UserProfile;
  logs: ActivityLog[];
  goals: Goal[];
  points: number;
  theme: 'light' | 'dark';
  auditLogs: HistoricalAuditEntry[];
  badges: Badge[];
  ecoScore: number;
  streak: number;
  token?: string;
  isAdmin?: boolean;
  updateProfile: (profile: UserProfile) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'co2'>) => void;
  updateLog: (id: string, updatedFields: Partial<ActivityLog>) => void;
  deleteLog: (id: string) => void;
  bulkImportLogs: (importedLogs: Omit<ActivityLog, 'id' | 'co2'>[]) => void;
  exportLogs: () => string;
  addGoal: (goalInput: { category: ActivityCategory | 'all'; targetReductionPercent: number; targetDate: string }) => void;
  completeGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  toggleTheme: () => void;
  resetAllData: () => void;
  verifyAndSetToken: (token: string) => Promise<boolean>;
  logoutAdmin: () => void;
  adminUnlockAllBadges: () => void;
  adminClearAuditTrail: () => void;
  adminSeedLoadLogs: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
