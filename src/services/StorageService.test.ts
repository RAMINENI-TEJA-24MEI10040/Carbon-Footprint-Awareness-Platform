import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, AppState } from './StorageService';

// Mock localStorage globally for Node test environment
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null
  };
}

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load initial state with defaults when localStorage is empty', () => {
    const state = StorageService.loadState();
    expect(state).toBeDefined();
    expect(state.profile.name).toBe('Eco Explorer');
    expect(state.logs.length).toBeGreaterThan(0);
    expect(state.goals.length).toBeGreaterThan(0);
    expect(state.points).toBe(220);
    expect(state.theme).toBe('dark');
  });

  it('should successfully save and load state', () => {
    const testState: AppState = {
      profile: { name: 'Alice', householdSize: 1, country: 'Germany' },
      logs: [],
      goals: [],
      points: 100,
      theme: 'light',
      auditLogs: []
    };

    StorageService.saveState(testState);
    const loaded = StorageService.loadState();
    expect(loaded.profile.name).toBe('Alice');
    expect(loaded.profile.householdSize).toBe(1);
    expect(loaded.theme).toBe('light');
    expect(loaded.points).toBe(100);
  });

  it('should reset state to defaults successfully', () => {
    const testState: AppState = {
      profile: { name: 'Alice', householdSize: 1, country: 'Germany' },
      logs: [],
      goals: [],
      points: 100,
      theme: 'light',
      auditLogs: []
    };

    StorageService.saveState(testState);
    const reset = StorageService.resetState();
    expect(reset.profile.name).toBe('Eco Explorer');
    expect(reset.points).toBe(220);
  });
});
