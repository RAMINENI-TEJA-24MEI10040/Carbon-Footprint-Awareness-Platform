import React, { useState } from 'react';

// Common Chart Interfaces
interface PieSlice {
  label: string;
  value: number; // in kg CO2
  color: string;
}

interface BarData {
  label: string;
  value: number;
  baseline: number;
}

interface LineData {
  label: string;
  value: number;
}

interface PieSliceCalculated {
  pathData: string;
  color: string;
  label: string;
  percentage: string;
  value: string;
  lx: number;
  ly: number;
  index: number;
}

function calculatePieSlices(data: PieSlice[], total: number): PieSliceCalculated[] {
  let accumulatedAngle = 0;
  const cx = 100;
  const cy = 100;
  const radius = 80;
  const labelRadius = 55;

  const result: PieSliceCalculated[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (total === 0) continue;
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;

    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle = endAngle;

    const radStart = (startAngle - 90) * (Math.PI / 180);
    const radEnd = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(radStart);
    const y1 = cy + radius * Math.sin(radStart);
    const x2 = cx + radius * Math.cos(radEnd);
    const y2 = cy + radius * Math.sin(radEnd);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = `
      M ${cx} ${cy}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

    const midRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
    const lx = cx + labelRadius * Math.cos(midRad);
    const ly = cy + labelRadius * Math.sin(midRad);

    result.push({
      pathData,
      color: item.color,
      label: item.label,
      percentage: percentage.toFixed(1),
      value: item.value.toFixed(1),
      lx,
      ly,
      index: i
    });
  }

  return result;
}

// -------------------------------------------------------------
// 1. ACCESSIBLE PIE CHART
// -------------------------------------------------------------
export const AccessiblePieChart: React.FC<{ data: PieSlice[]; title: string }> = ({ data, title }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const slices = calculatePieSlices(data, total);

  return (
    <div className="chart-wrapper">
      <h3 id="pie-chart-title" className="sr-only">{title}</h3>
      
      {/* Fallback structured table for screen readers (WCAG 2.2 Requirement) */}
      <table className="sr-only" aria-describedby="pie-chart-title">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Emissions (kg CO2e)</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.value.toFixed(1)} kg</td>
              <td>{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {total === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No emission logs recorded in this period.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg 
            width="100%" 
            height="220" 
            viewBox="0 0 200 200" 
            role="img" 
            aria-labelledby="pie-chart-title pie-chart-desc"
            tabIndex={0}
          >
            <title>{title}</title>
            <desc id="pie-chart-desc">
              A pie chart representing carbon emissions breakdown. Total: {total.toFixed(0)} kg CO2e.
            </desc>
            {slices.map((slice, idx) => {
              if (!slice) return null;
              const isHovered = hoveredIndex === slice.index;
              return (
                <g key={idx}>
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.6}
                    stroke="var(--bg-secondary)"
                    strokeWidth="1.5"
                    style={{ 
                      cursor: 'pointer',
                      transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                      transformOrigin: '100px 100px',
                      transition: 'transform 0.2s ease, opacity 0.2s ease'
                    }}
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    aria-label={`${slice.label}: ${slice.value} kg CO2e (${slice.percentage}%)`}
                  />
                  {parseFloat(slice.percentage) > 6 && (
                    <text
                      x={slice.lx}
                      y={slice.ly}
                      fill="#ffffff"
                      fontSize="6.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {slice.percentage}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Chart Legends */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
            {data.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: hoveredIndex === idx ? 'bold' : 'normal'
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color, display: 'inline-block' }}></span>
                {item.label} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 2. ACCESSIBLE BAR COMPARISON CHART (Actual vs Baseline)
// -------------------------------------------------------------
export const AccessibleBarChart: React.FC<{ data: BarData[]; title: string }> = ({ data, title }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map(item => Math.max(item.value, item.baseline, 10)));
  const graphHeight = 150;
  const graphWidth = 400;
  const paddingLeft = 45;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingRight = 15;

  const chartHeight = graphHeight + paddingBottom + paddingTop;
  const chartWidth = graphWidth + paddingLeft + paddingRight;

  return (
    <div className="chart-wrapper">
      <h3 id="bar-chart-title" className="sr-only">{title}</h3>

      {/* Screen Reader Alternative Data Grid */}
      <table className="sr-only" aria-describedby="bar-chart-title">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Actual Emissions (kg CO2e)</th>
            <th scope="col">Baseline (kg CO2e)</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.value.toFixed(1)} kg</td>
              <td>{item.baseline.toFixed(1)} kg</td>
              <td>{item.value <= item.baseline ? 'Within Baseline' : 'Exceeded Baseline'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg 
        width="100%" 
        height="220" 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        role="img" 
        aria-labelledby="bar-chart-title bar-chart-desc"
        tabIndex={0}
      >
        <title>{title}</title>
        <desc id="bar-chart-desc">
          A bar chart comparing actual monthly carbon footprint in kilograms against target baselines per category.
        </desc>

        {/* Y Axis Gridlines & Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const val = maxVal * ratio;
          const y = chartHeight - paddingBottom - (ratio * graphHeight);
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={chartWidth - paddingRight} 
                y2={y} 
                stroke="var(--border)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 3} 
                textAnchor="end" 
                fontSize="9" 
                fill="var(--text-muted)"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Category Data Bars */}
        {data.map((item, idx) => {
          const colWidth = graphWidth / data.length;
          const colCenterX = paddingLeft + (idx * colWidth) + (colWidth / 2);
          
          // Scaled heights
          const barW = 20;
          const valH = (item.value / maxVal) * graphHeight;
          const valY = chartHeight - paddingBottom - valH;

          const baseH = (item.baseline / maxVal) * graphHeight;
          const baseY = chartHeight - paddingBottom - baseH;

          const isHovered = hoveredIdx === idx;

          return (
            <g key={idx}>
              {/* Target Baseline Marker Bar (Outline Sky Blue) */}
              <rect
                x={colCenterX - barW - 2}
                y={baseY}
                width={barW}
                height={baseH}
                fill="var(--bg-tertiary)"
                stroke="var(--secondary)"
                strokeWidth="1.5"
                rx="2"
                style={{ transition: 'all 0.3s ease' }}
                aria-hidden="true"
              />

              {/* Actual Logged Carbon Bar (Filled Emerald/Red depending on target comparison) */}
              <rect
                x={colCenterX + 2}
                y={valY}
                width={barW}
                height={valH}
                fill={item.value <= item.baseline ? 'var(--primary)' : 'var(--danger)'}
                rx="2"
                style={{ 
                  cursor: 'pointer',
                  transform: isHovered ? 'scaleY(1.02)' : 'none',
                  transformOrigin: 'bottom',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                aria-label={`${item.label}: actual ${item.value} kg, baseline ${item.baseline} kg`}
              />

              {/* X Axis Labels */}
              <text
                x={colCenterX}
                y={chartHeight - paddingBottom + 14}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="bold"
                fill="var(--text-secondary)"
              >
                {item.label}
              </text>

              {/* Hover Value Popups */}
              {isHovered && (
                <g>
                  <rect 
                    x={colCenterX - 45} 
                    y={Math.min(valY, baseY) - 25} 
                    width="90" 
                    height="20" 
                    fill="var(--text-primary)" 
                    rx="3" 
                  />
                  <text 
                    x={colCenterX} 
                    y={Math.min(valY, baseY) - 12} 
                    textAnchor="middle" 
                    fill="var(--bg-primary)" 
                    fontSize="8.5" 
                    fontWeight="bold"
                  >
                    Act: {Math.round(item.value)} | Base: {Math.round(item.baseline)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X Axis Baseline Line */}
        <line 
          x1={paddingLeft} 
          y1={chartHeight - paddingBottom} 
          x2={chartWidth - paddingRight} 
          y2={chartHeight - paddingBottom} 
          stroke="var(--border)" 
          strokeWidth="2"
        />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', border: '1.5px solid var(--secondary)', backgroundColor: 'var(--bg-tertiary)', display: 'inline-block' }}></span>
          Baseline Target
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
          Actual (Within Target)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--danger)', display: 'inline-block' }}></span>
          Actual (Exceeded Baseline)
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. ACCESSIBLE LINE CHART (Trend Graph)
// -------------------------------------------------------------
export const AccessibleLineChart: React.FC<{ data: LineData[]; title: string }> = ({ data, title }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No historical trend logs found.</div>;
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 20) * 1.15; // +15% margin for visual headroom
  
  const graphHeight = 140;
  const graphWidth = 400;
  const paddingLeft = 40;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingRight = 20;

  const chartHeight = graphHeight + paddingBottom + paddingTop;
  const chartWidth = graphWidth + paddingLeft + paddingRight;

  // Generate SVG Points mapping
  const points = data.map((item, idx) => {
    const segmentWidth = data.length > 1 ? graphWidth / (data.length - 1) : graphWidth;
    const x = paddingLeft + (idx * segmentWidth);
    const y = chartHeight - paddingBottom - ((item.value / maxVal) * graphHeight);
    return { x, y, label: item.label, value: item.value };
  });

  // SVG path construction
  const pathD = points.reduce((path, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  // Gradient area path construction
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z` 
    : '';

  return (
    <div className="chart-wrapper">
      <h3 id="line-chart-title" className="sr-only">{title}</h3>

      {/* Screen Reader fallback table */}
      <table className="sr-only" aria-describedby="line-chart-title">
        <thead>
          <tr>
            <th scope="col">Time Interval</th>
            <th scope="col">Carbon Footprint (kg CO2e)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.value.toFixed(1)} kg</td>
            </tr>
          ))}
        </tbody>
      </table>

      <svg 
        width="100%" 
        height="220" 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        role="img" 
        aria-labelledby="line-chart-title line-chart-desc"
        tabIndex={0}
      >
        <title>{title}</title>
        <desc id="line-chart-desc">
          A line graph showing total carbon footprint emissions over the past weeks/months.
        </desc>

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const val = maxVal * ratio;
          const y = chartHeight - paddingBottom - (ratio * graphHeight);
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={chartWidth - paddingRight} 
                y2={y} 
                stroke="var(--border)" 
                strokeWidth="1" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 3} 
                textAnchor="end" 
                fontSize="9" 
                fill="var(--text-muted)"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Area Gradient under curve */}
        {areaD && (
          <path 
            d={areaD} 
            fill="url(#line-gradient)" 
            style={{ transition: 'all 0.5s ease' }} 
            aria-hidden="true"
          />
        )}

        {/* Line Curve path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.5s ease' }}
            aria-hidden="true"
          />
        )}

        {/* Data Interactive Nodes */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill="var(--bg-secondary)"
                stroke="var(--primary)"
                strokeWidth={isHovered ? 3 : 2}
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                aria-label={`${p.label}: ${p.value.toFixed(1)} kg`}
              />
              
              {/* X Axis Labels */}
              {(idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2)) && (
                <text
                  x={p.x}
                  y={chartHeight - paddingBottom + 14}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="bold"
                  fill="var(--text-secondary)"
                >
                  {p.label}
                </text>
              )}

              {/* Hover Value Popups */}
              {isHovered && (
                <g>
                  <rect 
                    x={p.x - 35} 
                    y={p.y - 30} 
                    width="70" 
                    height="20" 
                    fill="var(--text-primary)" 
                    rx="3" 
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 17} 
                    textAnchor="middle" 
                    fill="var(--bg-primary)" 
                    fontSize="9" 
                    fontWeight="bold"
                  >
                    {Math.round(p.value)} kg
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Axis Baseline lines */}
        <line 
          x1={paddingLeft} 
          y1={chartHeight - paddingBottom} 
          x2={chartWidth - paddingRight} 
          y2={chartHeight - paddingBottom} 
          stroke="var(--border)" 
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
