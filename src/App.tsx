import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import DashboardOverview from './components/dashboard/DashboardOverview';
import ActivityLogger from './components/logging/ActivityLogger';
import WhatIfSimulator from './components/simulator/WhatIfSimulator';
import GoalTracker from './components/goals/GoalTracker';
import InsightsPanel from './components/insights/InsightsPanel';
import { Leaf, Moon, Sun, Settings, User, Sparkles } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { theme, toggleTheme, profile, updateProfile, streak } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logging' | 'simulator' | 'goals' | 'insights' | 'settings'>('dashboard');

  // Local state for Settings form
  const [profileName, setProfileName] = useState<string>(profile.name);
  const [householdSize, setHouseholdSize] = useState<number>(profile.householdSize);
  const [country, setCountry] = useState<string>(profile.country);
  const [gridFactor, setGridFactor] = useState<string>(profile.gridFactorOverride?.toString() || '0.38');
  
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const factorNum = parseFloat(gridFactor);
    updateProfile({
      name: profileName.trim() || 'Eco Citizen',
      householdSize: Math.max(1, householdSize),
      country: country.trim() || 'Global',
      gridFactorOverride: isNaN(factorNum) ? undefined : factorNum
    });

    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  return (
    <div className="app-container">
      {/* WCAG 2.2 Requirement: Skip-to-content Link for keyboard navigation */}
      <a href="#main-content" className="skip-link">Skip to Main Content</a>

      {/* Header Shell */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo" tabIndex={0} aria-label="Carbon Footprint Assistant Home">
            <Leaf size={24} style={{ fill: 'var(--primary)' }} />
            <span>CarbonIQ</span>
          </div>

          <nav className="nav-links" aria-label="Main Navigation">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            >
              Dashboard
            </button>
            <button 
              className={`nav-item ${activeTab === 'logging' ? 'active' : ''}`}
              onClick={() => setActiveTab('logging')}
              aria-current={activeTab === 'logging' ? 'page' : undefined}
            >
              Logging
            </button>
            <button 
              className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
              aria-current={activeTab === 'simulator' ? 'page' : undefined}
            >
              What-If Simulator
            </button>
            <button 
              className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
              aria-current={activeTab === 'goals' ? 'page' : undefined}
            >
              Goals & Badges
            </button>
            <button 
              className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
              aria-current={activeTab === 'insights' ? 'page' : undefined}
            >
              Reports & Insights
            </button>
          </nav>

          {/* Right Header: Streaks, Theme Toggle, Settings Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {streak > 0 && (
              <div className="streak-badge" aria-label={`Logging streak: ${streak} days`}>
                <span>🔥</span>
                <span>{streak}d</span>
              </div>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px', border: 'none', backgroundColor: 'transparent' }}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: 'var(--accent)' }} />}
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'settings' ? 'active' : ''}`}
              style={{ padding: '8px', border: 'none', backgroundColor: 'transparent' }}
              onClick={() => setActiveTab('settings')}
              aria-label="Profile and Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1}>
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'logging' && <ActivityLogger />}
        {activeTab === 'simulator' && <WhatIfSimulator />}
        {activeTab === 'goals' && <GoalTracker />}
        {activeTab === 'insights' && <InsightsPanel />}

        {activeTab === 'settings' && (
          <div className="settings-view" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="sr-only">Settings and Customizations</h2>
            <div className="card">
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: 'var(--primary)' }} />
                Profile Settings
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Customize factors and demographics used to personalize emissions thresholds and AI recommendation matrices.
              </p>

              {settingsSuccess && (
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '15px' }}>
                  ✓ Profile settings updated successfully!
                </div>
              )}

              <form onSubmit={handleSettingsSubmit}>
                <div className="form-group">
                  <label htmlFor="settings-name" className="form-label">Full Name</label>
                  <input
                    id="settings-name"
                    type="text"
                    className="form-control"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-household" className="form-label">Household Size (people)</label>
                  <input
                    id="settings-household"
                    type="number"
                    min="1"
                    max="20"
                    className="form-control"
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-country" className="form-label">Country</label>
                  <input
                    id="settings-country"
                    type="text"
                    className="form-control"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-grid" className="form-label">
                    Grid Electricity Factor (kg CO₂e per kWh)
                  </label>
                  <input
                    id="settings-grid"
                    type="number"
                    step="0.001"
                    min="0"
                    max="3"
                    className="form-control"
                    value={gridFactor}
                    onChange={(e) => setGridFactor(e.target.value)}
                    placeholder="e.g. 0.38"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Defaults to global standard of 0.380. Modify if you have direct clean provider tariffs.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>
                  Save Profile Settings
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer landmarks */}
      <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '20px 0', marginTop: '40px' }}>
        <div style={{ maxWidth: 'var(--max-width-content)', margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} CarbonIQ Assistant. Built with planet-positive engineering standards.
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} /> Zero Carbon Host Compliant
          </span>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <AppContent />
    </div>
  );
};

export default App;
