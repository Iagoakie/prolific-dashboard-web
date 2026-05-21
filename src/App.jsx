import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection';
import SubmissionsTable from './components/SubmissionsTable';
import SettingsModal from './components/SettingsModal';
import { parseProlificCSV, calculateDashboardMetrics } from './utils/dataParser';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('light');
  const [exchangeRates, setExchangeRates] = useState({ usd: 4.9128, gbp: 6.6638 });
  const [csvText, setCsvText] = useState('');
  const [csvSource, setCsvSource] = useState('default'); // 'default' ou 'uploaded'
  const [showSettings, setShowSettings] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // Carrega o CSV padrão
  useEffect(() => {
    fetch('/default_data.csv')
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar o CSV padrão.');
        return res.text();
      })
      .then((text) => {
        setCsvText(text);
        setCsvSource('default');
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Processa o CSV sempre que o texto ou taxas de câmbio mudarem
  useEffect(() => {
    if (!csvText) return;
    try {
      const parsed = parseProlificCSV(csvText, exchangeRates);
      const computed = calculateDashboardMetrics(parsed);
      setSubmissions(parsed);
      setMetrics(computed);
    } catch (err) {
      console.error('Erro no processamento dos dados:', err);
    }
  }, [csvText, exchangeRates]);

  // Alterna o tema
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Upload manual de novo CSV
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvText(e.target.result);
      setCsvSource('uploaded');
    };
    reader.readAsText(file);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Visão Geral';
      case 'analytics': return 'Análise Temporal';
      case 'submissions': return 'Lista de Estudos';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-layout">
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onSettingsOpen={() => setShowSettings(true)}
        onFileUpload={handleFileUpload}
        loadedCount={submissions.length}
        csvSource={csvSource}
      />

      <main className="main-content-area">
        {metrics && (
          <header className="main-header animate-fade-in">
            <div className="header-info">
              <h1>{getPageTitle()}</h1>
              <span className="period-label">
                Período: {metrics.kpis.melhorDiaLabel !== '-' ? metrics.kpis.melhorDiaLabel.split(' • ')[0] : 'N/A'}
              </span>
            </div>
            <div className="header-actions">
              <span className="last-updated">
                Atualizado às {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
              </span>
              <button 
                className="user-profile-avatar spring-click" 
                onClick={() => setShowSettings(true)}
                title="Ajustes e Câmbio"
              >
                I
              </button>
            </div>
          </header>
        )}

        {!metrics ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando seus dados da Prolific...</p>
          </div>
        ) : (
          <div className="page-content">
            {activeTab === 'overview' && (
              <>
                <KPICards kpis={metrics.kpis} />
                <ChartsSection activeTab="overview" chartsData={metrics.charts} kpis={metrics.kpis} />
              </>
            )}

            {activeTab === 'analytics' && (
              <ChartsSection activeTab="analytics" chartsData={metrics.charts} kpis={metrics.kpis} />
            )}

            {activeTab === 'submissions' && (
              <SubmissionsTable submissions={submissions} />
            )}
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsModal 
          rates={exchangeRates} 
          onSave={setExchangeRates} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}
