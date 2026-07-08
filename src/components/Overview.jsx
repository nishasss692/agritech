import React from 'react';
import { Thermometer, Droplets, Activity, Flame, Leaf, CloudRain } from 'lucide-react';

const Overview = ({ temp, moisture, stress, applyPreset, setTemp, setMoisture }) => {
  // SVG Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.82

  const getOffset = (value, max) => {
    const percent = Math.min(max, Math.max(0, value)) / max;
    return circumference - percent * circumference;
  };

  // Status determinations
  const getTempStatus = (t) => {
    if (t > 40) return { text: 'Critical High', class: 'danger' };
    if (t > 35) return { text: 'Warning High', class: 'warning' };
    if (t < 15) return { text: 'Warning Low', class: 'warning' };
    return { text: 'Optimal', class: 'normal' };
  };

  const getMoistureStatus = (m) => {
    if (m < 15) return { text: 'Critical Dry', class: 'danger' };
    if (m < 30) return { text: 'Warning Dry', class: 'warning' };
    if (m > 85) return { text: 'Warning Saturation', class: 'warning' };
    return { text: 'Optimal', class: 'normal' };
  };

  const getStressStatus = (s) => {
    if (s > 4.0) return { text: 'Severe Stress', class: 'danger' };
    if (s > 1.5) return { text: 'Moderate Stress', class: 'warning' };
    return { text: 'Healthy', class: 'normal' };
  };

  const tempStatus = getTempStatus(temp);
  const moistureStatus = getMoistureStatus(moisture);
  const stressStatus = getStressStatus(stress);

  return (
    <>
      <div className="page-header">
        <div className="page-title-section">
          <h1>🌱 Farm Telemetry Overview</h1>
          <p>Real-time environment monitoring and simulated telemetry control board.</p>
        </div>
        <div className="status-badge-global">
          <div className="status-dot-pulse"></div>
          <span>System Live</span>
        </div>
      </div>

      {/* 3 Metric Gauges Grid */}
      <div className="overview-grid">
        {/* Temperature Card */}
        <div className="glass-card metric-card temp">
          <div className="metric-header">
            <Thermometer size={18} color="#f43f5e" />
            <span>Ambient Temperature</span>
          </div>
          <div className="metric-gauge-wrapper">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} className="metric-circle-bg" />
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="metric-circle-value"
                strokeDasharray={circumference}
                strokeDashoffset={getOffset(temp, 50)}
              />
            </svg>
            <div className="metric-gauge-text">
              <div className="metric-value-large">{temp.toFixed(1)}</div>
              <div className="metric-unit">°C</div>
            </div>
          </div>
          <div className={`metric-status-label ${tempStatus.class}`}>
            {tempStatus.text}
          </div>
        </div>

        {/* Moisture Card */}
        <div className="glass-card metric-card moisture">
          <div className="metric-header">
            <Droplets size={18} color="#3b82f6" />
            <span>Soil Moisture (0-7cm)</span>
          </div>
          <div className="metric-gauge-wrapper">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} className="metric-circle-bg" />
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="metric-circle-value"
                strokeDasharray={circumference}
                strokeDashoffset={getOffset(moisture, 100)}
              />
            </svg>
            <div className="metric-gauge-text">
              <div className="metric-value-large">{moisture.toFixed(1)}</div>
              <div className="metric-unit">%</div>
            </div>
          </div>
          <div className={`metric-status-label ${moistureStatus.class}`}>
            {moistureStatus.text}
          </div>
        </div>

        {/* Stress Card */}
        <div className="glass-card metric-card stress">
          <div className="metric-header">
            <Activity size={18} color="#f59e0b" />
            <span>Crop Stress Index</span>
          </div>
          <div className="metric-gauge-wrapper">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} className="metric-circle-bg" />
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="metric-circle-value"
                strokeDasharray={circumference}
                strokeDashoffset={getOffset(stress, 10)} // Cap at 10 on gauge
              />
            </svg>
            <div className="metric-gauge-text">
              <div className="metric-value-large">{stress.toFixed(2)}</div>
              <div className="metric-unit">Index</div>
            </div>
          </div>
          <div className={`metric-status-label ${stressStatus.class}`}>
            {stressStatus.text}
          </div>
        </div>
      </div>

      {/* Sliders and Presets Control Grid */}
      <div className="overview-bottom-row">
        {/* Sliders Card */}
        <div className="glass-card simulation-card">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-title)' }}>🎛️ Live Environment Simulator</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Adjust the sliders directly or select a quick environmental preset to test agricultural conditions.
          </p>
          
          <div className="sim-slider-row" style={{ marginTop: '0.5rem' }}>
            <div className="control-group">
              <div className="control-label-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Thermometer size={16} color="#f43f5e" /> Ambient Temp
                </span>
                <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>{temp}°C</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="50.0"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                className="control-slider temp"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>10°C (Cold)</span>
                <span>50°C (Hot)</span>
              </span>
            </div>

            <div className="control-group">
              <div className="control-label-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={16} color="#3b82f6" /> Soil Moisture
                </span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{moisture}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="100.0"
                step="0.5"
                value={moisture}
                onChange={(e) => setMoisture(parseFloat(e.target.value))}
                className="control-slider moisture"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>0% (Dry)</span>
                <span>100% (Wet)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Presets Card */}
        <div className="glass-card quick-action-card">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>🌡️ Simulation Presets</h3>
          <div className="environment-preset-grid">
            <button 
              className="preset-button" 
              onClick={() => applyPreset(42.0, 8.5)}
              title="Hot & Dry conditions"
            >
              <Flame size={16} color="#f43f5e" /> Hot & Dry
            </button>
            <button 
              className="preset-button" 
              onClick={() => applyPreset(24.5, 55.0)}
              title="Optimal growth conditions"
            >
              <Leaf size={16} color="#10b981" /> Optimal
            </button>
            <button 
              className="preset-button" 
              onClick={() => applyPreset(16.0, 92.0)}
              title="Humid morning environment"
            >
              <CloudRain size={16} color="#3b82f6" /> Humid Morn
            </button>
            <button 
              className="preset-button" 
              onClick={() => applyPreset(48.5, 1.5)}
              title="Extreme heat/drought stress"
            >
              <Flame size={16} color="#f59e0b" /> Drought Crisis
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview;
