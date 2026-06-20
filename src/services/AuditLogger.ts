import { HistoricalAuditEntry } from '../domain/calculator/types';

export class AuditLogger {
  /**
   * Generates a new cryptographically robust audit entry.
   * 
   * @param action The operation performed (create, delete, import, etc.).
   * @param details Human-readable trace information.
   */
  static createEntry(
    action: 'create' | 'update' | 'delete' | 'bulk_import' | 'goal_achieved',
    details: string
  ): HistoricalAuditEntry {
    const randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    const randomHex = randomArray[0].toString(36);
    
    return {
      id: `audit_${Date.now()}_${randomHex}`,
      timestamp: new Date().toISOString(),
      action,
      details
    };
  }
}
export default AuditLogger;
