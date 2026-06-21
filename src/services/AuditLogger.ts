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
    const cryptoProvider = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? crypto
      : (typeof window !== 'undefined' && window.crypto ? window.crypto : null);

    if (cryptoProvider) {
      cryptoProvider.getRandomValues(randomArray);
    } else {
      randomArray[0] = Math.floor(Math.random() * 0x100000000);
    }
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
