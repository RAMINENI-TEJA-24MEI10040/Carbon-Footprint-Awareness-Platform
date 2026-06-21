import { describe, it, expect } from 'vitest';
import { AuditLogger } from './AuditLogger';

describe('AuditLogger', () => {
  it('should create audit entry with correct details and action', () => {
    const entry = AuditLogger.createEntry('create', 'Logged transport activity');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('create');
    expect(entry.details).toBe('Logged transport activity');
    expect(entry.id).toContain('audit_');
    expect(entry.timestamp).not.toBeNull();
    
    const parsedTime = new Date(entry.timestamp).getTime();
    expect(isNaN(parsedTime)).toBe(false);
  });

  it('should support all standard audit actions', () => {
    const actions = ['create', 'update', 'delete', 'bulk_import', 'goal_achieved'] as const;
    
    actions.forEach(action => {
      const entry = AuditLogger.createEntry(action, `Action test: ${action}`);
      expect(entry.action).toBe(action);
      expect(entry.details).toBe(`Action test: ${action}`);
    });
  });
});
