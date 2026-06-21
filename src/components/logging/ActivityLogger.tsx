import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityCategory, ActivityLog } from '../../domain/calculator/types';
import { CATEGORY_LABELS, UNIT_LABELS, DEFAULT_UNITS } from '../../domain/calculator/constants';
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle, UploadCloud, X, ArrowLeft, ArrowRight, Clipboard } from 'lucide-react';
import CarbonCalculator from '../../domain/calculator/CarbonCalculator';

export const ActivityLogger: React.FC = () => {
  const { logs, addLog, updateLog, deleteLog, bulkImportLogs, auditLogs } = useApp();

  // Form State
  const [category, setCategory] = useState<ActivityCategory>('transportation');
  const [type, setType] = useState<string>('petrol_car');
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Validation States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab State: 'single' | 'bulk' | 'audit'
  const [logTab, setLogTab] = useState<'single' | 'bulk' | 'audit'>('single');

  // Bulk Import State
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkSuccessCount, setBulkSuccessCount] = useState<number | null>(null);

  // Table Pagination & Editing
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string>('');

  // Handle Category Change (updates default sub-types)
  const handleCategoryChange = (cat: ActivityCategory) => {
    setCategory(cat);
    const subTypes = Object.keys(DEFAULT_UNITS[cat]);
    if (subTypes.length > 0) {
      setType(subTypes[0]);
    }
    setErrorMsg(null);
  };

  // Submit Single Log Form
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const validatedVal = CarbonCalculator.validateLogValue(value);
    if (validatedVal === null) {
      setErrorMsg('Please enter a valid numeric value greater than zero and less than 10,000,000.');
      return;
    }

    const timestamp = new Date(date).toISOString();
    const unit = DEFAULT_UNITS[category][type] || '';

    addLog({
      timestamp,
      category,
      type: type as ActivityLog['type'],
      value: validatedVal,
      unit,
      notes: notes.trim()
    });

    // Reset Form
    setValue('');
    setNotes('');
    setSuccessMsg('Activity logged successfully!');
    
    // Auto-clear success message
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Parse CSV Bulk Entry
  const handleBulkImport = () => {
    setBulkErrors([]);
    setBulkSuccessCount(null);

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setBulkErrors(['Input is empty. Please enter CSV data.']);
      return;
    }

    const parsedLogs: Omit<ActivityLog, 'id' | 'co2'>[] = [];
    const errors: string[] = [];

    // Expected format: category, type, value, notes, date (optional)
    lines.forEach((line, index) => {
      // Basic CSV split ignoring commas inside quotes
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
      
      if (parts.length < 3) {
        errors.push(`Row ${index + 1}: Malformed line. Must have at least category, type, and value.`);
        return;
      }

      const catInput = parts[0].toLowerCase() as ActivityCategory;
      const typeInput = parts[1];
      const valInput = parts[2];
      const noteInput = parts[3] || '';
      const dateInput = parts[4] || new Date().toISOString().split('T')[0];

      // Validate Category
      if (!Object.keys(DEFAULT_UNITS).includes(catInput)) {
        errors.push(`Row ${index + 1}: Invalid category "${catInput}".`);
        return;
      }

      // Validate Type
      const availableTypes = Object.keys(DEFAULT_UNITS[catInput]);
      if (!availableTypes.includes(typeInput)) {
        errors.push(`Row ${index + 1}: Subtype "${typeInput}" is invalid for category "${catInput}".`);
        return;
      }

      // Validate Value
      const validatedVal = CarbonCalculator.validateLogValue(valInput);
      if (validatedVal === null) {
        errors.push(`Row ${index + 1}: Invalid value "${valInput}". Must be a number > 0.`);
        return;
      }

      const unit = DEFAULT_UNITS[catInput][typeInput];
      
      parsedLogs.push({
        timestamp: new Date(dateInput).toISOString(),
        category: catInput,
        type: typeInput as ActivityLog['type'],
        value: validatedVal,
        unit,
        notes: noteInput
      });
    });

    if (errors.length > 0) {
      setBulkErrors(errors);
    } else {
      bulkImportLogs(parsedLogs);
      setBulkSuccessCount(parsedLogs.length);
      setBulkText('');
    }
  };

  // Inline edit actions
  const startEdit = (log: ActivityLog) => {
    setEditingId(log.id);
    setEditingValue(log.value.toString());
    setEditingNotes(log.notes || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const validatedVal = CarbonCalculator.validateLogValue(editingValue);
    if (validatedVal === null) {
      alert('Invalid number value.');
      return;
    }

    updateLog(id, {
      value: validatedVal,
      notes: editingNotes
    });
    setEditingId(null);
  };

  // Table pagination math
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="activity-logger-panel">
      {/* Tab Switcher */}
      <div className="tabs">
        <button className={`tab ${logTab === 'single' ? 'active' : ''}`} onClick={() => setLogTab('single')}>
          Single Activity Log
        </button>
        <button className={`tab ${logTab === 'bulk' ? 'active' : ''}`} onClick={() => setLogTab('bulk')}>
          Bulk CSV Import
        </button>
        <button className={`tab ${logTab === 'audit' ? 'active' : ''}`} onClick={() => setLogTab('audit')}>
          Audit Trail Log
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Logger Forms */}
        <div>
          {logTab === 'single' && (
            <div className="card">
              <h3 style={{ marginBottom: '15px' }}>Log New Activity</h3>
              
              {errorMsg && (
                <div style={{ display: 'flex', gap: '8px', color: 'var(--danger)', marginBottom: '15px', fontSize: '0.875rem' }}>
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div style={{ display: 'flex', gap: '8px', color: 'var(--primary)', marginBottom: '15px', fontSize: '0.875rem' }}>
                  <CheckCircle size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitSingle} aria-label="Single Log Form">
                <div className="form-group">
                  <label htmlFor="log-category" className="form-label">Category</label>
                  <select
                    id="log-category"
                    className="form-control"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as ActivityCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="log-type" className="form-label">Activity Type</label>
                  <select
                    id="log-type"
                    className="form-control"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {Object.keys(DEFAULT_UNITS[category]).map((subType) => (
                      <option key={subType} value={subType}>
                        {subType.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="log-value" className="form-label">
                    Value ({UNIT_LABELS[DEFAULT_UNITS[category][type]?.toLowerCase()] || DEFAULT_UNITS[category][type]})
                  </label>
                  <input
                    id="log-value"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="e.g. 15.5"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="log-date" className="form-label">Date</label>
                  <input
                    id="log-date"
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="log-notes" className="form-label">Notes (Optional)</label>
                  <textarea
                    id="log-notes"
                    rows={2}
                    className="form-control"
                    placeholder="e.g. Weekly highway driving..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  <Plus size={16} /> Save Activity
                </button>
              </form>
            </div>
          )}

          {logTab === 'bulk' && (
            <div className="card">
              <h3 style={{ marginBottom: '10px' }}>CSV Bulk Upload</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Paste comma-separated rows in this format:<br />
                <code>category, type, value, notes (optional), YYYY-MM-DD (optional)</code>
              </p>

              <div className="card" style={{ padding: '8px', marginBottom: '15px', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong>Example Format:</strong>
                  <button 
                    className="btn" 
                    style={{ padding: '2px', fontSize: '0.7rem' }}
                    onClick={() => setBulkText('transportation,petrol_car,45,Commuted to office,2026-06-15\nfood,vegan,2,Vegan options dinner\nenergy,electricity,85,Monthly meter reading')}
                  >
                    <Clipboard size={10} /> Load Example
                  </button>
                </div>
                <code>
                  transportation, petrol_car, 45, Commuted to office, 2026-06-15<br />
                  food, vegan, 2, Vegan options dinner<br />
                  energy, electricity, 85, Monthly meter reading
                </code>
              </div>

              {bulkSuccessCount !== null && (
                <div style={{ display: 'flex', gap: '8px', color: 'var(--primary)', marginBottom: '15px', fontSize: '0.875rem' }}>
                  <CheckCircle size={18} />
                  <span>Successfully imported {bulkSuccessCount} logs!</span>
                </div>
              )}

              {bulkErrors.length > 0 && (
                <div style={{ padding: '10px', border: '1px solid var(--danger)', borderRadius: '6px', backgroundColor: 'var(--danger-light)', marginBottom: '15px' }}>
                  <h4 style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '5px' }}>Import Errors:</h4>
                  <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '15px' }}>
                    {bulkErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <textarea
                  id="bulk-csv-input"
                  rows={8}
                  className="form-control"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                  placeholder="Paste CSV rows here..."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  aria-label="CSV input box"
                />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleBulkImport}>
                <UploadCloud size={16} /> Import Records
              </button>
            </div>
          )}

          {logTab === 'audit' && (
            <div className="card">
              <h3 style={{ marginBottom: '15px' }}>System Audit Trail</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                A chronological register of actions and calculations performed by the carbon footprint engine.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                {auditLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No audit trails recorded yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem', backgroundColor: 'var(--bg-tertiary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
                        <span style={{ color: log.action === 'delete' ? 'var(--danger)' : log.action === 'create' ? 'var(--primary)' : 'var(--accent)' }}>
                          {log.action.toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-primary)' }}>{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Paginated Activity Registry Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <h3 style={{ marginBottom: '15px' }}>Logged Activities History ({logs.length})</h3>

          <div className="table-responsive" style={{ flex: 1 }}>
            {logs.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No activities logged. Use the left form to add your first record.
              </div>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Category</th>
                    <th scope="col">Subtype</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Emissions</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => {
                    const isEditing = editingId === log.id;
                    return (
                      <tr key={log.id}>
                        <td>{new Date(log.timestamp).toLocaleDateString()}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                            {CATEGORY_LABELS[log.category]}
                          </span>
                        </td>
                        <td>{log.type.replace(/_/g, ' ')}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem' }}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                            />
                          ) : (
                            `${log.value} ${log.unit}`
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: log.co2 < 0 ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {log.co2 > 0 ? `+${log.co2}` : log.co2} kg
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => saveEdit(log.id)}>
                                Save
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={cancelEdit}>
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px', border: 'none', backgroundColor: 'transparent' }} 
                                onClick={() => startEdit(log)}
                                aria-label={`Edit log ${log.id}`}
                              >
                                <Edit2 size={14} style={{ color: 'var(--text-secondary)' }} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px', border: 'none', backgroundColor: 'transparent' }} 
                                onClick={() => deleteLog(log.id)}
                                aria-label={`Delete log ${log.id}`}
                              >
                                <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={prevPage} disabled={currentPage === 1}>
                  <ArrowLeft size={12} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={nextPage} disabled={currentPage === totalPages}>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ActivityLogger;
