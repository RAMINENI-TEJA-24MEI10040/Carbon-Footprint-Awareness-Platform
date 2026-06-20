import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccessibleLineChart, AccessibleBarChart } from '../charts/AccessibleCharts';
import { CATEGORY_LABELS } from '../../domain/calculator/constants';
import { ActivityCategory } from '../../domain/calculator/types';
import { BarChart3, TrendingUp, ArrowDownLeft, Calendar, FileText, Download } from 'lucide-react';

export const InsightsPanel: React.FC = () => {
  const { logs, exportLogs, resetAllData } = useApp();
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // 1. Annualize and categorize log values for trends
  const getWeeklyDataPoints = () => {
    // Group logs into last 4 weeks
    const dataPoints = [
      { label: '3 Weeks Ago', value: 0 },
      { label: '2 Weeks Ago', value: 0 },
      { label: '1 Week Ago', value: 0 },
      { label: 'Current Week', value: 0 }
    ];

    const now = new Date();
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const diffTime = Math.abs(now.getTime() - logDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        dataPoints[3].value += log.co2;
      } else if (diffDays < 14) {
        dataPoints[2].value += log.co2;
      } else if (diffDays < 21) {
        dataPoints[1].value += log.co2;
      } else if (diffDays < 28) {
        dataPoints[0].value += log.co2;
      }
    });

    return dataPoints;
  };

  const getCategoryComparisonData = () => {
    // Group actual vs baseline
    const categories = Object.keys(CATEGORY_LABELS) as ActivityCategory[];
    
    // Average baselines per category (kg/month)
    const baselines: Record<ActivityCategory, number> = {
      transportation: 150,
      energy: 120,
      food: 80,
      waste: 20,
      shopping: 40,
      water: 8
    };

    const actuals: Record<string, number> = {};
    logs.forEach(log => {
      actuals[log.category] = (actuals[log.category] || 0) + log.co2;
    });

    // Determine weeks logged to get monthly rate
    let weeks = 4;
    if (logs.length > 0) {
      const times = logs.map(l => new Date(l.timestamp).getTime());
      const min = Math.min(...times);
      const max = Math.max(...times);
      weeks = Math.max(1, (max - min) / (1000 * 60 * 60 * 24 * 7));
    }

    return categories.map(cat => {
      const totalActual = actuals[cat] || 0;
      const monthlyRate = (totalActual / weeks) * 4.33;
      return {
        label: CATEGORY_LABELS[cat].split(' ')[0], // short label
        value: Math.max(0, Math.round(monthlyRate)),
        baseline: baselines[cat]
      };
    });
  };

  const lineData = getWeeklyDataPoints();
  const barData = getCategoryComparisonData();

  // 2. Identify highest emission source
  const typeEmissions: Record<string, number> = {};
  logs.forEach(log => {
    typeEmissions[log.type] = (typeEmissions[log.type] || 0) + log.co2;
  });

  let topContributorType = 'None';
  let topContributorVal = 0;
  Object.entries(typeEmissions).forEach(([type, val]) => {
    if (val > topContributorVal) {
      topContributorVal = val;
      topContributorType = type;
    }
  });

  const topContributorLabel = topContributorType.replace(/_/g, ' ').toUpperCase();

  // 3. Export CSV handler
  const handleCSVDownload = () => {
    const csvContent = exportLogs();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `carbon_assistant_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="insights-view">
      <h2 className="sr-only">Carbon Insights and Analytical Reports</h2>

      <div className="dashboard-grid">
        {/* Left: Trend Graphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Weekly Line Trend */}
          <div className="card">
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              Weekly Carbon Trend (kg CO₂e)
            </h3>
            <AccessibleLineChart data={lineData} title="Rolling weekly carbon footprint trend line graph" />
          </div>

          {/* Category Monthly comparison */}
          <div className="card">
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} style={{ color: 'var(--secondary)' }} />
              Actual vs Target Baselines (kg/month)
            </h3>
            <AccessibleBarChart data={barData} title="Category comparison bar chart of actual rate versus target baseline" />
          </div>
        </div>

        {/* Right: Structural Reports & Data Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Carbon Report */}
          <div className="card">
            <h3>Executive Carbon Analysis</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Detailed insights compiled by our sustainability auditing engine.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Highlight 1: Largest Contributor */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <TrendingUp size={20} style={{ color: 'var(--danger)', marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Largest Emission Contributor</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Your largest localized carbon driver is <strong>{topContributorLabel}</strong>, producing{' '}
                    <strong>{Math.round(topContributorVal)} kg CO₂e</strong> overall. Transitioning this habit is your quickest route to sustainability.
                  </p>
                </div>
              </div>

              {/* Highlight 2: Fastest savings */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <ArrowDownLeft size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Fastest Reduction Opportunity</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Switching commuting to trains/metro or reducing household thermostat settings by 1°C offsets up to{' '}
                    <strong>150 kg CO₂e / yr</strong> with zero upfront costs.
                  </p>
                </div>
              </div>

              {/* Highlight 3: Seasonal habits */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Calendar size={20} style={{ color: 'var(--accent)', marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Seasonal Behavior Warning</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Heating accounts for ~65% of winter utility spikes. Offset grid dependency now by exploring solar credits or heat pump upgrades during summer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Export and Database Maintenance Panel */}
          <div className="card">
            <h3>Data Management & Exports</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Download your complete audit history or clean local databases.
            </p>

            {exportSuccess && (
              <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginBottom: '12px' }}>
                ✓ CSV file downloaded successfully!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={handleCSVDownload} style={{ justifyContent: 'flex-start' }}>
                <Download size={16} /> Export Logs to CSV format
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
                  const link = document.createElement('a');
                  link.setAttribute("href", dataStr);
                  link.setAttribute("download", `carbon_logs_${Date.now()}.json`);
                  link.click();
                }}
                style={{ justifyContent: 'flex-start' }}
              >
                <FileText size={16} /> Export Logs to JSON format
              </button>

              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete all logs, goals, and history? This resets database back to mock defaults.")) {
                    resetAllData();
                  }
                }}
                style={{ justifyContent: 'flex-start', marginTop: '15px' }}
              >
                Reset Database to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InsightsPanel;
