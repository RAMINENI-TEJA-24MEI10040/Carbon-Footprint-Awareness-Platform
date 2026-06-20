import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoalManager } from '../../domain/goals/GoalManager';
import { ActivityCategory } from '../../domain/calculator/types';
import { CATEGORY_LABELS } from '../../domain/calculator/constants';
import { Target, Award, Calendar, Check, Plus, Trash2 } from 'lucide-react';

export const GoalTracker: React.FC = () => {
  const { 
    goals, 
    addGoal, 
    deleteGoal, 
    points, 
    streak, 
    badges, 
    logs 
  } = useApp();

  // New Goal Input States
  const [goalCategory, setGoalCategory] = useState<ActivityCategory | 'all'>('all');
  const [reductionPercent, setReductionPercent] = useState<number>(15); // default 15%
  const [targetDurationDays, setTargetDurationDays] = useState<number>(30); // default 30 days
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Success Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Submit Goal creation
  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + targetDurationDays);

    addGoal({
      category: goalCategory,
      targetReductionPercent: reductionPercent,
      targetDate: targetDate.toISOString()
    });

    setSuccessMsg('Smart Goal created successfully!');
    setShowAddForm(false);
    
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const finishedGoals = goals.filter(g => g.status !== 'active');

  return (
    <div className="goal-tracker-view">
      <h2 className="sr-only">Smart Goals and Gamification Achievements</h2>

      {/* Gamification Dashboard (Score Header) */}
      <div className="dashboard-grid three-col" style={{ marginBottom: '20px' }}>
        {/* Eco XP balance */}
        <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Eco XP Points</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{points} XP</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Earned via logging & goals</span>
          </div>
        </div>

        {/* Logging Streaks */}
        <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.5rem' }}>🔥</div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Logging Streak</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{streak} Days</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {streak > 0 ? 'Keep logging daily to protect streak!' : 'Log today to start a streak!'}
            </span>
          </div>
        </div>

        {/* Badges Count */}
        <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.5rem' }}>🌟</div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Badges Unlocked</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {badges.filter(b => b.unlocked).length} / {badges.length}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Explore achievements below</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Smart Goals lists */}
        <div>
          {/* Header & Add Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Active Reduction Goals ({activeGoals.length})</h3>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={14} /> Create Goal
            </button>
          </div>

          {successMsg && (
            <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '15px' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Goal Creator Form */}
          {showAddForm && (
            <div className="card" style={{ marginBottom: '20px', border: '1.5px solid var(--primary)' }}>
              <h4 style={{ marginBottom: '10px' }}>Setup Smart Reduction Target</h4>
              <form onSubmit={handleAddGoalSubmit}>
                <div className="form-group">
                  <label htmlFor="goal-cat-select" className="form-label">Target Category</label>
                  <select
                    id="goal-cat-select"
                    className="form-control"
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as ActivityCategory | 'all')}
                  >
                    <option value="all">Overall (Total Footprint)</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="goal-reduce-select" className="form-label">Reduction Target (%)</label>
                  <select
                    id="goal-reduce-select"
                    className="form-control"
                    value={reductionPercent}
                    onChange={(e) => setReductionPercent(parseInt(e.target.value))}
                  >
                    <option value="5">5% Reduction</option>
                    <option value="10">10% Moderate Reduction</option>
                    <option value="15">15% Recommended Target</option>
                    <option value="20">20% Stretch Goal</option>
                    <option value="30">30% Carbon Crusher</option>
                    <option value="50">50% Half-Carbon Lifestyle</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="goal-duration-select" className="form-label">Duration</label>
                  <select
                    id="goal-duration-select"
                    className="form-control"
                    value={targetDurationDays}
                    onChange={(e) => setTargetDurationDays(parseInt(e.target.value))}
                  >
                    <option value="14">14 Days (Short Sprints)</option>
                    <option value="30">30 Days (Standard Month)</option>
                    <option value="90">90 Days (Quarterly Shift)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Activate Goal
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Goal Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {activeGoals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active carbon reduction goals. Set one up using the button above to earn bonus Eco XP!
              </p>
            ) : (
              activeGoals.map(goal => {
                const progress = GoalManager.calculateProgress(goal);
                const prob = GoalManager.estimateSuccessProbability(goal, logs);
                const milestones = GoalManager.getMilestones(goal);

                return (
                  <div key={goal.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ color: 'var(--primary)' }}>{goal.title}</h4>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={12} /> Ends {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Target size={12} /> Target: {goal.targetValue} kg/mo
                          </span>
                        </div>
                      </div>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '3px', border: 'none', backgroundColor: 'transparent' }}
                        onClick={() => deleteGoal(goal.id)}
                        aria-label={`Cancel goal ${goal.title}`}
                      >
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>Current Rate: <strong>{goal.currentValue}</strong> kg CO₂e / mo</span>
                        <span>{progress}% complete</span>
                      </div>
                      
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Baseline: {goal.baselineValue} kg/mo</span>
                        <span>Success Probability: <strong style={{ color: prob > 70 ? 'var(--primary)' : prob > 40 ? 'var(--accent)' : 'var(--danger)' }}>{prob}%</strong></span>
                      </div>
                    </div>

                    {/* Checklist Milestones */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Milestones Progress:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        {milestones.map((ms, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '3px', 
                              fontSize: '0.65rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              backgroundColor: ms.reached ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                              color: ms.reached ? 'var(--primary)' : 'var(--text-muted)',
                              border: `1px solid ${ms.reached ? 'var(--primary)' : 'var(--border)'}`
                            }}
                          >
                            {ms.reached && <Check size={10} />}
                            {ms.label.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Finished goals */}
          {finishedGoals.length > 0 && (
            <div style={{ marginTop: '25px' }}>
              <h3 style={{ marginBottom: '10px' }}>Historical Achievements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {finishedGoals.map(goal => (
                  <div key={goal.id} className="card" style={{ padding: '10px 15px', borderLeft: `4px solid ${goal.status === 'completed' ? 'var(--primary)' : 'var(--danger)'}`, backgroundColor: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{goal.title}</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Baseline: {goal.baselineValue} kg/mo | Target: {goal.targetValue} kg/mo
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: goal.status === 'completed' ? 'var(--primary)' : 'var(--danger)' }}>
                        {goal.status.toUpperCase()} {goal.status === 'completed' && `(+${goal.pointsReward} XP)`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Achievements & Badges */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--accent)' }} />
            Eco Badges & Trophies
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Earn badges by logging eco-friendly activities, completing smart targets, and saving carbon.
          </p>

          <div className="badge-grid">
            {badges.map(badge => (
              <div key={badge.id} className={`badge-item ${badge.unlocked ? 'unlocked' : ''}`} tabIndex={0} aria-label={`${badge.title}: ${badge.description}. ${badge.unlocked ? 'Unlocked' : 'Locked'}`}>
                <span className="badge-icon" role="img" aria-hidden="true">{badge.icon}</span>
                <span className="badge-title">{badge.title}</span>
                <span className="badge-desc">{badge.description}</span>
                {badge.unlocked && badge.unlockedAt && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '4px', fontWeight: 'bold' }}>
                    UNLOCKED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GoalTracker;
