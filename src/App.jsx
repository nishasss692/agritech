import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Diagnostics from './components/Diagnostics';
import Analytics from './components/Analytics';
import SensorFleet from './components/SensorFleet';
import Chatbot from './components/Chatbot';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Shared Live Telemetry simulation states
  const [temp, setTemp] = useState(38.5);
  const [moisture, setMoisture] = useState(9.2);
  const [stress, setStress] = useState(0.0);

  // Recalculate stress index whenever telemetry updates
  useEffect(() => {
    const calculatedStress = temp / (moisture + 0.001);
    setStress(calculatedStress);
  }, [temp, moisture]);

  // Handler to apply environmental presets
  const applyPreset = (presetTemp, presetMoisture) => {
    setTemp(presetTemp);
    setMoisture(presetMoisture);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview 
            temp={temp} 
            moisture={moisture} 
            stress={stress} 
            applyPreset={applyPreset}
            setTemp={setTemp}
            setMoisture={setMoisture}
          />
        );
      case 'diagnose':
        return (
          <Diagnostics 
            temp={temp} 
            moisture={moisture} 
            stress={stress} 
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'fleet':
        return <SensorFleet />;
      case 'chatbot':
        return (
          <Chatbot 
            temp={temp} 
            moisture={moisture} 
            stress={stress} 
          />
        );
      default:
        return <Overview temp={temp} moisture={moisture} stress={stress} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        temp={temp}
        setTemp={setTemp}
        moisture={moisture}
        setMoisture={setMoisture}
      />
      
      <main className="main-content">
        {renderActiveTabContent()}
      </main>
    </div>
  );
}

export default App;
