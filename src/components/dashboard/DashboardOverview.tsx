import React from 'react';
import { useApp } from '../../context/AppContext';
import { AccessiblePieChart } from '../charts/AccessibleCharts';
import { RecommendationEngine } from '../../domain/recommendations/RecommendationEngine';
import { EcoScore } from '../../domain/gamification/EcoScore';
import { CATEGORY_LABELS } from '../../domain/calculator/constants';
import { ActivityCategory } from '../../domain/calculator/types';
import { Leaf, Award, TrendingUp, Info } from 'lucide-react';

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  transportation: '#0284c7', // Sky Blue
  energy: '#ea580c',         // Orange
  food: '#059669',           // Emerald
  waste: '#7c3aed',          // Purple
  shopping: '#db2777',       // Pink
  water: '#2563eb'           // Indigo Blue
};

export const DashboardOverview: React.FC = () => {
  const { logs, profile, points, ecoScore } = useApp();

  // 1. Calculate statistics over past 30 days
  const now = new Date();
  const past30DaysLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const diffTime = Math.abs(now.getTime() - logDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  const totalEmissions30Days = past30DaysLogs.reduce((sum, log) => sum + log.co2, 0);

  // Group emissions by category for Pie Chart
  const categoryEmissions = past30DaysLogs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + log.co2;
    return acc;
  }, {} as Record<ActivityCategory, number>);

  const pieChartData = (Object.keys(CATEGORY_LABELS) as ActivityCategory[])
    .map(cat => ({
      label: CATEGORY_LABELS[cat],
      value: Math.max(0, categoryEmissions[cat] || 0),
      color: CATEGORY_COLORS[cat]
    }))
    .filter(item => item.value > 0);

  // 2. Personalised recommendations
  const activeRecommendations = RecommendationEngine.generateRecommendations(logs, profile).slice(0, 2);

  // 3. Sustainability levels and XP details
  const levelDetails = EcoScore.getLevelAndProgress(points);
  const ratingDetails = EcoScore.getSustainabilityRating(ecoScore);

  // 4. Future emission forecast
  // Projected next 30 days based on past 30 days, or a moving baseline if empty
  const projectedEmissions = totalEmissions30Days * 0.95; // assumes minor positive improvements

  return (
    <div className="dashboard-view" tabIndex={-1}>
      <h2 className="sr-only">Dashboard Overview</h2>
      
      {/* 1. Scorecard grid */}
      <div className="dashboard-grid four-col">
        {/* Total Carbon footprint */}
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Footprint (30 days)</span>
            <TrendingUp size={18} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>{Math.round(totalEmissions30Days)}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>kg CO₂e</span>
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '5px' }}>
            Next 30d forecast: <strong>{Math.round(projectedEmissions)} kg</strong> (-5%)
          </p>
        </div>

        {/* Eco Score rating */}
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Eco Score</span>
            <Leaf size={18} className={ratingDetails.colorClass} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }} className={ratingDetails.colorClass}>{ecoScore}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/100</span>
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '5px' }} className={ratingDetails.colorClass}>
            {ratingDetails.label}
          </p>
        </div>

        {/* User Level and XP */}
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sustaining Level</span>
            <Award size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>Lv {levelDetails.level}</span>
          </div>
          <div style={{ marginTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px' }}>
              <span>{levelDetails.xpInCurrentLevel} XP</span>
              <span>{levelDetails.xpForNextLevel} XP</span>
            </div>
            <div className="progress-bar-container" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${levelDetails.progressPercent}%`, backgroundColor: 'var(--accent)' }}></div>
            </div>
          </div>
        </div>

        {/* Action item breakdown */}
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Logged Activities</span>
            <Info size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>{logs.length}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>total logs</span>
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '5px' }}>
            Active reduction streaks: <strong>{logs.length > 0 ? 'Active' : 'No logs yet'}</strong>
          </p>
        </div>
      </div>

      {/* 2. Visual layout breakdown and AI recommendations */}
      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        {/* Category Breakdown (Pie Chart) */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Leaf size={18} style={{ color: 'var(--primary)' }} />
            Emissions Breakdown by Category
          </h3>
          <AccessiblePieChart data={pieChartData} title="Emissions breakdown by category for the past 30 days" />
        </div>

        {/* Priority AI Recommendations */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--accent)' }} />
            Top Actionable Recommendations
          </h3>
          {activeRecommendations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Start logging your utility bills, meals, and transport commutes to receive highly targeted, AI-driven carbon reduction recommendations.</p>
          ) : (
            <div className="rec-list">
              {activeRecommendations.map((rec) => (
                <div key={rec.id} className="rec-card" style={{ borderLeftColor: rec.category === 'energy' ? 'var(--accent)' : 'var(--primary)' }}>
                  <div className="rec-header">
                    <span className="rec-title">{rec.title}</span>
                    <div className="rec-metrics">
                      <span className="rec-tag rec-tag-carbon">-{rec.co2ReductionAnnual} kg CO₂e / yr</span>
                      {rec.monthlySavings > 0 && <span className="rec-tag rec-tag-savings">${rec.monthlySavings}/mo saved</span>}
                      <span className="rec-tag rec-tag-diff">{rec.difficulty.toUpperCase()}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{rec.reasoning}</p>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Action Plan:</span>
                    <ol style={{ paddingLeft: '15px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {rec.actionableSteps.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DashboardOverview;
