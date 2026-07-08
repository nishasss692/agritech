import React from 'react';
import { 
  LayoutDashboard, 
  HeartPulse, 
  LineChart, 
  Map, 
  MessageSquare,
  ChevronLeft, 
  ChevronRight, 
  Sprout,
  Thermometer,
  Droplets
} from 'lucide-react';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed, 
  temp, 
  setTemp, 
  moisture, 
  setMoisture 
}) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'diagnose', label: 'Live Diagnostics', icon: HeartPulse },
    { id: 'analytics', label: 'Analytics Trends', icon: LineChart },
    { id: 'fleet', label: 'Sensor Fleet', icon: Map },
    { id: 'chatbot', label: 'AI Chat Advisor', icon: MessageSquare },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Sprout className="text-emerald-500" size={24} color="#10b981" />
          <span>SmartFarm AI</span>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="sidebar-toggle-btn"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`menu-item-button ${activeTab === item.id ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-controls">
        <p className="control-title">📍 Simulation controls</p>
        
        <div className="control-group">
          <div className="control-label-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Thermometer size={14} color="#f43f5e" /> Temp
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
        </div>

        <div className="control-group">
          <div className="control-label-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Droplets size={14} color="#3b82f6" /> Moisture
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
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
