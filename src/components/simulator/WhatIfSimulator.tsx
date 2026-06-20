import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EMISSION_FACTORS } from '../../domain/calculator/constants';
import { ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const { logs } = useApp();

  // Slider Simulation States
  const [reduceDrivingPercent, setReduceDrivingPercent] = useState<number>(0); // 0 to 100%
  const [flightsEliminated, setFlightsEliminated] = useState<number>(0); // 0 to 10
  const [renewableEnergy, setRenewableEnergy] = useState<boolean>(false);
  const [vegMealsPerWeek, setVegMealsPerWeek] = useState<number>(0); // 0 to 21 meals
  const [recycleKgPerWeek, setRecycleKgPerWeek] = useState<number>(0); // 0 to 20 kg
  const [reduceElectricityPercent, setReduceElectricityPercent] = useState<number>(0); // 0 to 50%

  // 1. Calculate baseline current emissions (annualized)
  const totalLogsCo2 = logs.reduce((sum, l) => sum + l.co2, 0);
  
  // Find log timespan in days to annualize
  let timeSpanDays = 30; // default to 30 days if logs are empty or single
  if (logs.length > 1) {
    const times = logs.map(l => new Date(l.timestamp).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    timeSpanDays = Math.max(7, (maxTime - minTime) / (1000 * 60 * 60 * 24));
  }

  // Annualized Baseline Footprint (kg CO2e / year)
  const baselineAnnual = Math.round((totalLogsCo2 / timeSpanDays) * 365);

  // Calculate category-specific annual baselines
  const getAnnualCategoryFootprint = (category: string, type?: string) => {
    const catLogs = logs.filter(l => l.category === category && (!type || l.type === type));
    const catTotal = catLogs.reduce((sum, l) => sum + l.co2, 0);
    return Math.round((catTotal / timeSpanDays) * 365);
  };

  const annualDriving = getAnnualCategoryFootprint('transportation', 'petrol_car') + getAnnualCategoryFootprint('transportation', 'diesel_car');
  const annualElectricity = getAnnualCategoryFootprint('energy', 'electricity');

  // 2. Compute simulated reductions (kg CO2e / year)
  // Reduction A: Driving less
  const drivingReduction = annualDriving * (reduceDrivingPercent / 100);

  // Reduction B: Eliminate flights (assume average domestic/int flight average = 450 kg CO2e)
  const flightReduction = flightsEliminated * 450;

  // Reduction C: Renewable energy (eliminates 100% of current electricity emissions)
  const renewableReduction = renewableEnergy ? annualElectricity : 0;

  // Reduction D: Reduce electricity by percentage (only applies if not already 100% renewable)
  const electricityPercentReduction = !renewableEnergy 
    ? annualElectricity * (reduceElectricityPercent / 100) 
    : 0;

  // Reduction E: Vegetarian meals swap
  // Swap from mixed_diet (2.50) to vegetarian (1.35) -> delta is 1.15 kg CO2e per meal
  const foodMealDelta = 2.50 - 1.35;
  const foodReduction = vegMealsPerWeek * foodMealDelta * 52;

  // Reduction F: Recycling offset (recycling factor is -0.35 kg CO2e offset per kg recycled)
  const recyclingOffset = Math.abs(EMISSION_FACTORS.waste.recycling);
  const wasteReduction = recycleKgPerWeek * recyclingOffset * 52;

  // Total annual reduction
  const totalReduction = Math.round(
    drivingReduction + 
    flightReduction + 
    renewableReduction + 
    electricityPercentReduction + 
    foodReduction + 
    wasteReduction
  );

  const simulatedAnnual = Math.max(0, baselineAnnual - totalReduction);
  const percentSaved = baselineAnnual > 0 ? ((totalReduction / baselineAnnual) * 100).toFixed(1) : '0.0';

  // Reset simulator
  const handleReset = () => {
    setReduceDrivingPercent(0);
    setFlightsEliminated(0);
    setRenewableEnergy(false);
    setVegMealsPerWeek(0);
    setRecycleKgPerWeek(0);
    setReduceElectricityPercent(0);
  };

  // SVG Chart drawing details for Before vs After comparison
  const maxChartVal = Math.max(baselineAnnual, simulatedAnnual, 1000);
  const beforeH = (baselineAnnual / maxChartVal) * 120;
  const afterH = (simulatedAnnual / maxChartVal) * 120;

  return (
    <div className="what-if-simulator-panel">
      <h2 className="sr-only">What-If Emissions Simulator</h2>

      <div className="dashboard-grid">
        {/* Left Side: Sliders Controls */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Behavioral Adjustments</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={handleReset}>
              <RefreshCw size={12} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Driving reduction slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span className="form-label">Reduce driving (Car)</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{reduceDrivingPercent}% less</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="form-control"
                value={reduceDrivingPercent}
                onChange={(e) => setReduceDrivingPercent(parseInt(e.target.value))}
                aria-label="Reduce driving percentage"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Your current driving emissions: {annualDriving} kg CO₂e / yr
              </span>
            </div>

            {/* Reduce electricity percentage */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span className="form-label">Reduce household electricity</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{reduceElectricityPercent}% less</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                className="form-control"
                value={reduceElectricityPercent}
                onChange={(e) => setReduceElectricityPercent(parseInt(e.target.value))}
                disabled={renewableEnergy}
                aria-label="Reduce household electricity percentage"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Your current electricity emissions: {annualElectricity} kg CO₂e / yr
              </span>
            </div>

            {/* Clean energy toggle */}
            <div className="form-group" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={14} style={{ color: 'var(--accent)' }} /> 100% Renewable electricity
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offsets entire electricity grid footprint</span>
              </div>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={renewableEnergy}
                onChange={(e) => setRenewableEnergy(e.target.checked)}
                aria-label="Toggle 100% Renewable electricity"
              />
            </div>

            {/* Switch flights */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span className="form-label">Eliminate flights</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{flightsEliminated} flights / yr</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                className="form-control"
                value={flightsEliminated}
                onChange={(e) => setFlightsEliminated(parseInt(e.target.value))}
                aria-label="Eliminate flights annually"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assumes average flight trip emissions is 450 kg CO₂e</span>
            </div>

            {/* Diet meals slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span className="form-label">Eat vegetarian meals</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{vegMealsPerWeek} meals / week</span>
              </div>
              <input
                type="range"
                min="0"
                max="21"
                step="1"
                className="form-control"
                value={vegMealsPerWeek}
                onChange={(e) => setVegMealsPerWeek(parseInt(e.target.value))}
                aria-label="Vegetarian meals per week"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Replaces standard mixed diet meals (-1.15 kg CO₂e per meal)</span>
            </div>

            {/* Recycle slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span className="form-label">Recycle household waste</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{recycleKgPerWeek} kg / week</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                className="form-control"
                value={recycleKgPerWeek}
                onChange={(e) => setRecycleKgPerWeek(parseInt(e.target.value))}
                aria-label="Recycling weight per week"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avoids raw manufacturing carbon intensity (-0.35 kg CO₂e offset/kg)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Impact Results Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '400px' }}>
          <div>
            <h3>Simulated Impact Analysis</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Real-time projection showing cumulative savings based on behavioral inputs.
            </p>

            {/* Impact score cards */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div className="card" style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Reduction</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                  -{totalReduction} kg
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CO₂e saved annually</span>
              </div>

              <div className="card" style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Percentage Offset</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                  {percentSaved}%
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>of baseline footprint</span>
              </div>
            </div>

            {/* Before vs After comparative SVG graph */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', alignItems: 'flex-end', height: '160px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '30px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{baselineAnnual} kg</span>
                <svg width="45" height="120" style={{ marginTop: '8px' }}>
                  <rect x="5" y={120 - beforeH} width="35" height={beforeH} fill="var(--text-secondary)" rx="4" />
                </svg>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Before</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{simulatedAnnual} kg</span>
                <svg width="45" height="120" style={{ marginTop: '8px' }}>
                  <rect x="5" y={120 - afterH} width="35" height={afterH} fill="var(--primary)" rx="4" />
                </svg>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>After</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px', border: '1px dashed var(--primary)', backgroundColor: 'var(--primary-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              {totalReduction > 0 ? (
                <>
                  Applying these changes reduces your footprint by <strong>{totalReduction} kg</strong>. 
                  This is equivalent to planting <strong>{Math.round(totalReduction / 22)}</strong> mature hardwood trees!
                </>
              ) : (
                'Adjust the sliders on the left to simulate changes in your travel, eating, energy, and recycling habits.'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WhatIfSimulator;
