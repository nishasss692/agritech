import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  LineChart as ChartIcon, 
  Search, 
  ArrowUpDown, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Download
} from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState('combined'); // 'combined', 'temp', 'moisture'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/historical');
      if (!response.ok) {
        throw new Error('Failed to fetch historical telemetry trends.');
      }
      const json = await response.json();
      setData(json);
      setFilteredData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  // Filter and sort effect
  useEffect(() => {
    let result = [...data];

    // Filter query
    if (searchQuery) {
      result = result.filter(item => {
        const dateStr = new Date(item.timestamp).toLocaleDateString().toLowerCase();
        const timeStr = new Date(item.timestamp).toLocaleTimeString().toLowerCase();
        return dateStr.includes(searchQuery.toLowerCase()) || 
               timeStr.includes(searchQuery.toLowerCase()) ||
               item.temperature.toString().includes(searchQuery) ||
               item.moisture.toString().includes(searchQuery);
      });
    }

    // Sort sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle dates comparison
      if (sortField === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    setFilteredData(result);
  }, [data, searchQuery, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getAnomalyCount = () => {
    return data.filter(item => item.temperature > 38.0 || item.moisture < 15.0).length;
  };

  const formatXAxis = (tickItem) => {
    const d = new Date(tickItem);
    // Return month/day hour:00
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
  };

  const exportCSV = () => {
    if (!data.length) return;
    let csv = 'Timestamp,Temperature (°C),Soil Moisture (%)\n';
    data.forEach(item => {
      csv += `${item.timestamp},${item.temperature},${item.moisture}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_telemetry_history_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{date.toLocaleString()}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="tooltip-value" style={{ color: p.color }}>
              {p.name}: {p.value} {p.name.includes('Temp') ? '°C' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-section">
          <h1>📈 Historical Analytics Trends</h1>
          <p>Retrieve 7-day environmental telemetry history compiled from IoT nodes.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={fetchHistoricalData} 
            disabled={loading}
            className="action-btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button 
            onClick={exportCSV} 
            disabled={loading || !data.length}
            className="action-btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Retrieving telemetry history logs...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-title)' }}>Failed to Load History</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      ) : (
        <div className="analytics-layout">
          {/* Recharts Graphical View */}
          <div className="glass-card chart-card">
            <div className="chart-header">
              <h2 style={{ margin: 0, fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChartIcon size={20} color="#10b981" /> Telemetry Charts
              </h2>
              <div className="chart-toggle-group">
                <button 
                  onClick={() => setChartView('combined')} 
                  className={`chart-toggle-btn ${chartView === 'combined' ? 'active' : ''}`}
                >
                  Combined
                </button>
                <button 
                  onClick={() => setChartView('temp')} 
                  className={`chart-toggle-btn ${chartView === 'temp' ? 'active' : ''}`}
                >
                  Temp Only
                </button>
                <button 
                  onClick={() => setChartView('moisture')} 
                  className={`chart-toggle-btn ${chartView === 'moisture' ? 'active' : ''}`}
                >
                  Moisture Only
                </button>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                <TrendingUp size={14} color="#10b981" />
                <span>Total Samples: <strong style={{ color: '#fff' }}>{data.length}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: getAnomalyCount() > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', color: getAnomalyCount() > 0 ? 'var(--color-stress)' : 'var(--color-text-muted)' }}>
                <AlertTriangle size={14} />
                <span>Anomalies flagged: <strong>{getAnomalyCount()}</strong></span>
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxis} 
                    minTickGap={30}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[10, 50]}
                    label={chartView === 'temp' || chartView === 'combined' ? { value: 'Temp (°C)', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'var(--color-text-muted)' } } : null}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    label={chartView === 'moisture' || chartView === 'combined' ? { value: 'Moisture (%)', angle: 90, position: 'insideRight', offset: 10, style: { fill: 'var(--color-text-muted)' } } : null}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                  {(chartView === 'temp' || chartView === 'combined') && (
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="temperature" 
                      name="Temperature" 
                      stroke="var(--color-temp)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {(chartView === 'moisture' || chartView === 'combined') && (
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="moisture" 
                      name="Soil Moisture" 
                      stroke="var(--color-moisture)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabular Searchable Data grid */}
          <div className="glass-card table-card">
            <h2 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-title)' }}>📜 Telemetry Logs</h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Searchable timeline database.
            </p>

            <div className="table-search-bar">
              <Search size={16} color="var(--color-text-muted)" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by date, value..." 
                className="table-search-input"
              />
            </div>

            <div className="table-wrapper">
              <table className="sleek-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>
                      Timestamp <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                    </th>
                    <th onClick={() => handleSort('temperature')} style={{ cursor: 'pointer' }}>
                      Temp (°C) <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                    </th>
                    <th onClick={() => handleSort('moisture')} style={{ cursor: 'pointer' }}>
                      Moist (%) <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                    </th>
                    <th>Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        No records match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => {
                      const dateObj = new Date(row.timestamp);
                      const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      const isTempAlert = row.temperature > 38.0;
                      const isMoistAlert = row.moisture < 15.0;
                      return (
                        <tr key={idx}>
                          <td className="cell-time">{displayDate}</td>
                          <td className="cell-value temp" style={{ color: isTempAlert ? 'var(--color-temp)' : 'inherit' }}>
                            {row.temperature.toFixed(1)}°
                          </td>
                          <td className="cell-value moisture" style={{ color: isMoistAlert ? 'var(--color-moisture)' : 'inherit' }}>
                            {row.moisture.toFixed(1)}%
                          </td>
                          <td>
                            {(isTempAlert || isMoistAlert) ? (
                              <AlertTriangle size={14} color="#f59e0b" title="Anomaly flagged" />
                            ) : (
                              <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Analytics;
