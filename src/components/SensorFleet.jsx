import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Battery, 
  Wifi, 
  Thermometer, 
  Droplets,
  AlertTriangle,
  Radio,
  RefreshCw,
  Compass,
  Zap
} from 'lucide-react';

const SensorFleet = () => {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sonarTriggered, setSonarTriggered] = useState(false);

  const fetchSensors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sensors');
      if (!response.ok) {
        throw new Error('Failed to retrieve sensor fleet status.');
      }
      const data = await response.json();
      setSensors(data);
      
      // Auto-select first active sensor
      if (data.length > 0) {
        const active = data.find(s => s.status === 'Active') || data[0];
        setSelectedSensor(active);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const triggerSonar = () => {
    setSonarTriggered(true);
    setTimeout(() => setSonarTriggered(false), 1200);
  };

  // Convert geographical Coordinates to SVG canvas (800 x 400)
  // Bengaluru bounds in mock: Lat 13.090 to 13.110, Lon 77.590 to 77.610
  const minLat = 13.090;
  const maxLat = 13.110;
  const minLon = 77.590;
  const maxLon = 77.610;

  const mapCoords = (lat, lon) => {
    const w = 800;
    const h = 400;
    
    // Scale longitude to X (0 to 800)
    const x = ((lon - minLon) / (maxLon - minLon)) * w;
    // Scale latitude to Y (height to 0 because Y increases downwards)
    const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
    
    return { x: Math.round(x), y: Math.round(y) };
  };

  const getBatteryColor = (level) => {
    if (level > 70) return '#10b981'; // Green
    if (level > 20) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getSignalColor = (strength) => {
    switch (strength.toLowerCase()) {
      case 'excellent': return '#10b981';
      case 'good': return '#34d399';
      case 'fair': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-section">
          <h1>🗺️ IoT Sensor Fleet Map</h1>
          <p>Digital Twin layout of deployed sensors and telemetry hardware nodes.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={triggerSonar} 
            disabled={loading}
            className="action-btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            <Radio size={16} /> Ping Fleet
          </button>
          <button 
            onClick={fetchSensors} 
            disabled={loading}
            className="action-btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Scanning IoT grid beacons...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-title)' }}>Grid Offline</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      ) : (
        <div className="fleet-layout">
          {/* SVG Map Canvas */}
          <div className="glass-card map-card">
            <div className="map-header">
              <h2 style={{ margin: 0, fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={20} color="#10b981" /> Agricultural Grid Digital Twin
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Scale: 1 grid square = 50m
              </div>
            </div>

            <div className="map-view-wrapper">
              {/* Sonar Ping Ring */}
              <div className={`sonar-wave-overlay ${sonarTriggered ? 'trigger' : ''}`}></div>

              <svg viewBox="0 0 800 400" className="svg-farm-grid">
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="40" y2="0" className="svg-grid-line" />
                    <line x1="0" y1="0" x2="0" y2="40" className="svg-grid-line" />
                  </pattern>
                </defs>

                {/* Grid Background */}
                <rect width="800" height="400" fill="url(#grid-pattern)" />

                {/* Natural Features */}
                {/* Wavy River Path */}
                <path d="M 0,220 Q 200,280 400,200 T 800,280" className="svg-river" />
                
                {/* Access Road */}
                <path d="M 120,0 L 120,400" className="svg-road" />

                {/* Field Patches (Zones) */}
                <rect x="200" y="40" width="180" height="130" rx="10" className={`svg-patch ${selectedSensor?.id === 'SN-101' ? 'selected' : ''}`} />
                <text x="290" y="110" fill="rgba(255,255,255,0.15)" textAnchor="middle" fontSize="12" fontWeight="600" style={{ pointerEvents: 'none' }}>NORTH TOMATO PATCH</text>

                <rect x="480" y="50" width="220" height="150" rx="10" className={`svg-patch ${selectedSensor?.id === 'SN-102' ? 'selected' : ''}`} />
                <text x="590" y="130" fill="rgba(255,255,255,0.15)" textAnchor="middle" fontSize="12" fontWeight="600" style={{ pointerEvents: 'none' }}>EAST GREENHOUSE</text>

                <rect x="250" y="240" width="200" height="130" rx="10" className={`svg-patch ${selectedSensor?.id === 'SN-105' ? 'selected' : ''}`} />
                <text x="350" y="310" fill="rgba(255,255,255,0.15)" textAnchor="middle" fontSize="12" fontWeight="600" style={{ pointerEvents: 'none' }}>HYDROPONICS GRID</text>

                <rect x="520" y="260" width="210" height="110" rx="10" className={`svg-patch ${selectedSensor?.id === 'SN-104' ? 'selected' : ''}`} />
                <text x="625" y="320" fill="rgba(255,255,255,0.15)" textAnchor="middle" fontSize="12" fontWeight="600" style={{ pointerEvents: 'none' }}>WEST ORCHARD</text>

                {/* Farm Field Boundary Grid */}
                <polygon points="50,30 750,30 750,370 50,370" className="svg-farm-boundary" />

                {/* Sensor Beacons */}
                {sensors.map((sensor) => {
                  const { x, y } = mapCoords(sensor.latitude, sensor.longitude);
                  const isSelected = selectedSensor?.id === sensor.id;
                  const isActive = sensor.status === 'Active';
                  return (
                    <g 
                      key={sensor.id}
                      transform={`translate(${x}, ${y})`}
                      className={`map-beacon ${isActive ? 'active' : 'offline'}`}
                      onClick={() => setSelectedSensor(sensor)}
                    >
                      {/* Outer pulse indicator ring */}
                      {isActive && (
                        <circle 
                          r="14" 
                          className="beacon-pulse-ring" 
                          strokeWidth="2.5" 
                          fill="var(--color-primary-glow)"
                        />
                      )}
                      {/* Selection highlight ring */}
                      {isSelected && (
                        <circle 
                          r="18" 
                          fill="none" 
                          stroke="#ffffff" 
                          strokeWidth="1.5" 
                          strokeDasharray="3, 3"
                        />
                      )}
                      {/* Node Center Dot */}
                      <circle 
                        r="6" 
                        className="beacon-center-dot"
                      />
                      {/* Text Label overlay */}
                      <text 
                        y="-22" 
                        fill={isSelected ? '#ffffff' : 'var(--color-text-muted)'}
                        fontSize="10" 
                        fontWeight="700" 
                        fontFamily="var(--font-mono)"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.6)' }}
                      >
                        {sensor.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Sidebar Detail Card */}
          <div className="glass-card fleet-details-card">
            {!selectedSensor ? (
              <div className="sensor-selection-prompt">
                <Map size={48} strokeWidth={1} />
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '1.1rem', fontFamily: 'var(--font-title)' }}>
                    No Sensor Selected
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Select a node on the digital map to inspect real-time telemetry metrics.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="sensor-detail-header">
                  <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h3 style={{ flexGrow: 1 }}>{selectedSensor.name}</h3>
                    <span 
                      className="status-dot-pulse" 
                      style={{ 
                        animation: selectedSensor.status === 'Active' ? 'pulse-glow 2s infinite' : 'none',
                        backgroundColor: selectedSensor.status === 'Active' ? 'var(--color-primary)' : 'var(--color-offline)'
                      }}
                    ></span>
                  </div>
                  <div className="sensor-detail-id">{selectedSensor.id}</div>
                </div>

                <div className="sensor-detail-body">
                  {/* Status pills */}
                  <div className="detail-list-item">
                    <span className="detail-list-label">Node Status</span>
                    <span 
                      className="risk-pill" 
                      style={{ 
                        backgroundColor: selectedSensor.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: selectedSensor.status === 'Active' ? 'var(--color-primary)' : 'var(--color-offline)',
                        borderColor: selectedSensor.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                        borderStyle: 'solid',
                        borderWidth: '1px'
                      }}
                    >
                      {selectedSensor.status}
                    </span>
                  </div>

                  {/* Hardware details */}
                  <div className="detail-list-item">
                    <span className="detail-list-label">Battery Level</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getBatteryColor(selectedSensor.battery) }}>
                      <Battery size={16} /> <strong>{selectedSensor.battery}%</strong>
                    </span>
                  </div>

                  <div className="detail-list-item">
                    <span className="detail-list-label">Signal Quality</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getSignalColor(selectedSensor.signal) }}>
                      <Wifi size={16} /> <strong>{selectedSensor.signal}</strong>
                    </span>
                  </div>

                  <div className="detail-list-item">
                    <span className="detail-list-label">Coordinates</span>
                    <span className="detail-list-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {selectedSensor.latitude.toFixed(4)}, {selectedSensor.longitude.toFixed(4)}
                    </span>
                  </div>

                  <h4 style={{ margin: '1rem 0 0.5rem 0', fontFamily: 'var(--font-title)', fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                    Live Environment Feeds
                  </h4>

                  {selectedSensor.status === 'Active' ? (
                    <div className="detail-row-grid">
                      <div className="detail-sub-card">
                        <span className="detail-sub-label">Temperature</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Thermometer size={14} color="#f43f5e" />
                          <span className="detail-sub-value temp">{selectedSensor.temperature}°C</span>
                        </div>
                      </div>

                      <div className="detail-sub-card">
                        <span className="detail-sub-label">Soil Moisture</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplets size={14} color="#3b82f6" />
                          <span className="detail-sub-value moisture">{selectedSensor.moisture}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '1.25rem', 
                      backgroundColor: 'rgba(107, 114, 128, 0.05)', 
                      borderRadius: '8px', 
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Zap size={24} color="var(--color-offline)" />
                      <span>Node is offline. Live environmental telemetry feed is currently suspended.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SensorFleet;
