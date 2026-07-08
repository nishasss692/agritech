import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  Cpu, 
  Thermometer, 
  Droplets, 
  Activity,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const Chatbot = ({ temp, moisture, stress }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Agronomist Advisor. Ask me anything about tomato plant care, disease identification (like early blight), soil moisture levels, or NPK fertilizing recommendations. I am aware of your active smart farm simulation telemetry!',
      timestamp: new Date().toLocaleTimeString(),
      demoMode: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickStarters = [
    { label: 'Prevent blight', query: 'How do I identify and deal with tomato leaf blight?' },
    { label: 'Optimize watering', query: 'What irrigation schedule is best for my current soil moisture?' },
    { label: 'Fertilizer advice', query: 'What NPK fertilizer ratio should I use once tomatoes start fruiting?' },
    { label: 'Analyze stress', query: 'What does my current crop stress index indicate, and how do I reduce it?' }
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // Prepare request payload
      const history = messages
        .filter(m => m.id !== 'welcome') // Skip welcome message in API history
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const body = {
        message: query,
        history: history,
        temperature: includeContext ? temp : null,
        moisture: includeContext ? moisture : null
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to connect to the agronomy chatbot service.');
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp || new Date()).toLocaleTimeString(),
        demoMode: data.demo_mode
      }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Connection Error: ${err.message || 'Could not reach the chatbot endpoint. Please check if your backend server is running.'}`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your AI Agronomist Advisor. Ask me anything about tomato plant care, disease identification (like early blight), soil moisture levels, or NPK fertilizing recommendations. I am aware of your active smart farm simulation telemetry!',
        timestamp: new Date().toLocaleTimeString(),
        demoMode: false
      }
    ]);
  };

  const formatMessageText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, lineIdx) => {
      // Parse bold elements **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Parse list items
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const content = line.replace(/^[-*]\s*/, '');
        const formattedContent = content.split(/(\*\*.*?\*\*)/g).map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <li key={lineIdx} className="chat-list-item">
            {formattedContent}
          </li>
        );
      }

      // Return regular paragraph
      return (
        <p key={lineIdx} className="chat-paragraph">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-section">
          <h1>💬 SmartFarm AI Chatbot</h1>
          <p>Have an interactive conversation with our telemetry-aware Agronomist Advisor powered by Gemini.</p>
        </div>
      </div>

      <div className="chat-layout">
        {/* Chat Main Window */}
        <div className="glass-card chat-card-container">
          <div className="chat-header">
            <div className="chat-header-info">
              <Sparkles size={18} color="#10b981" />
              <span>AI Advisor Agent</span>
            </div>
            
            <button onClick={handleClear} className="chat-clear-btn" title="Reset chat history">
              <Trash2 size={16} />
              <span>Clear Conversation</span>
            </button>
          </div>

          {/* Messages scroll box */}
          <div className="chat-messages-box">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chat-bubble-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                <div className="chat-avatar">
                  {msg.role === 'user' ? (
                    <User size={16} color="#fff" />
                  ) : (
                    <Bot size={16} color="#10b981" />
                  )}
                </div>

                <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'} ${msg.isError ? 'error' : ''}`}>
                  <div className="chat-bubble-content">
                    {msg.role === 'assistant' ? (
                      formatMessageText(msg.content)
                    ) : (
                      <p className="chat-paragraph">{msg.content}</p>
                    )}
                  </div>
                  
                  <div className="chat-bubble-footer">
                    <span>{msg.timestamp}</span>
                    {msg.demoMode && (
                      <span className="demo-badge">Demo Mode</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chat-bubble-row assistant-row">
                <div className="chat-avatar">
                  <Bot size={16} color="#10b981" />
                </div>
                <div className="chat-bubble assistant">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick starter queries */}
          {messages.length === 1 && !loading && (
            <div className="quick-starters-container">
              <span className="quick-starter-title">Common Questions:</span>
              <div className="quick-starter-grid">
                {quickStarters.map((qs, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(qs.query)}
                    className="quick-starter-card"
                  >
                    <span>{qs.label}</span>
                    <ArrowRight size={14} className="arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Form Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }} 
            className="chat-input-form"
          >
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about blight, irrigation schedules, crop stress, NPK values..." 
              className="chat-text-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !inputValue.trim()} 
              className="chat-send-btn"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Chat Control Sidebar (Context Info) */}
        <div className="glass-card chat-sidebar-card">
          <h2 className="chat-sidebar-title">⚙️ Chat Context Configuration</h2>
          <p className="chat-sidebar-desc">
            Enable telemetry injection to supply live sensor values into the chatbot's prompts.
          </p>

          <div className="context-toggle-row">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={includeContext} 
                onChange={(e) => setIncludeContext(e.target.checked)} 
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Inject Live Simulation Telemetry</span>
          </div>

          {includeContext && (
            <div className="context-stats-preview">
              <span className="context-preview-header">Active context payload:</span>
              
              <div className="context-preview-item">
                <span className="label">
                  <Thermometer size={14} color="#f43f5e" style={{ marginRight: '4px' }} /> Temperature
                </span>
                <span className="value temp">{temp.toFixed(1)} °C</span>
              </div>

              <div className="context-preview-item">
                <span className="label">
                  <Droplets size={14} color="#3b82f6" style={{ marginRight: '4px' }} /> Soil Moisture
                </span>
                <span className="value moisture">{moisture.toFixed(1)} %</span>
              </div>

              <div className="context-preview-item">
                <span className="label">
                  <Activity size={14} color="#f59e0b" style={{ marginRight: '4px' }} /> Stress Index
                </span>
                <span className="value stress">{stress.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="context-notes">
            <Cpu size={14} style={{ marginRight: '4px' }} />
            <span>
              If Gemini API key is not configured, the app falls back to interactive simulated responses.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
