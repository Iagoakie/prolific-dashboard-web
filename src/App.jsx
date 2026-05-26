import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection';
import SubmissionsTable from './components/SubmissionsTable';
import SettingsModal from './components/SettingsModal';
import { parseProlificCSV, calculateDashboardMetrics } from './utils/dataParser';
import { CloudUpload, User, Sun, Moon, Sliders, RefreshCw, ChevronRight } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('light');
  const [exchangeRates, setExchangeRates] = useState({ usd: 4.9128, gbp: 6.6638 });
  const [exchangeSource, setExchangeSource] = useState('default'); // 'default', 'api', 'fallback', 'manual'
  const [lastExchangeFetch, setLastExchangeFetch] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [csvSource, setCsvSource] = useState('default'); // 'default' ou 'uploaded'
  const [showSettings, setShowSettings] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // Estados dos Upgrades Premium
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const dragCounter = useRef(0);

  const fetchRealTimeRates = async () => {
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,GBP-BRL');
      if (!response.ok) throw new Error('Falha ao obter câmbio em tempo real');
      const data = await response.json();
      const usdBid = parseFloat(data.USDBRL.bid);
      const gbpBid = parseFloat(data.GBPBRL.bid);
      
      if (!isNaN(usdBid) && !isNaN(gbpBid)) {
        const ratesObj = { usd: usdBid, gbp: gbpBid };
        setExchangeRates(ratesObj);
        setExchangeSource('api');
        const now = new Date();
        const formattedTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(now);
        setLastExchangeFetch(formattedTime);
        console.log(`Câmbio atualizado com sucesso via API: USD=${usdBid}, GBP=${gbpBid} às ${formattedTime}`);
        return ratesObj;
      }
    } catch (error) {
      console.error('Erro ao buscar cotação de câmbio:', error);
      setExchangeSource('fallback');
      return null;
    }
  };

  // Carrega cotações de câmbio automáticas na inicialização
  useEffect(() => {
    fetchRealTimeRates();
  }, []);

  // Gerenciamento do Drag-and-Drop Global
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingFile(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.csv')) {
          handleFileUpload(file);
        } else {
          alert('Por favor, solte apenas arquivos no formato CSV da Prolific.');
        }
        e.dataTransfer.clearData();
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Fecha o Popover do perfil ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfilePopover && !e.target.closest('.avatar-popover-container')) {
        setShowProfilePopover(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showProfilePopover]);

  const handleSaveRates = (newRates, source = 'manual') => {
    setExchangeRates(newRates);
    setExchangeSource(source);
  };

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
              
              {/* Contêiner do Popover de Perfil */}
              <div className="avatar-popover-container">
                <button 
                  className="user-profile-avatar spring-click" 
                  onClick={() => setShowProfilePopover(!showProfilePopover)}
                  title="Menu de Perfil e Ajustes"
                >
                  I
                </button>
                
                {showProfilePopover && (
                  <div className="profile-popover glass-panel">
                    <div className="popover-header">
                      <div className="popover-avatar">I</div>
                      <div className="popover-info">
                        <span className="popover-name">Iago Caldas</span>
                        <span className="popover-title">Data Analyst</span>
                      </div>
                    </div>

                    <div className="popover-stats-grid">
                      <div className="popover-stat-item">
                        <span className="popover-stat-lbl">Ganhos Aprovados</span>
                        <span className="popover-stat-val">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(metrics.kpis.ganhosAprovadosBRL)}
                        </span>
                      </div>
                      <div className="popover-stat-item">
                        <span className="popover-stat-lbl">Total Estudos</span>
                        <span className="popover-stat-val">{metrics.kpis.totalEstudos}</span>
                      </div>
                    </div>

                    <div className="theme-popover-row">
                      <div className="theme-popover-lbl">
                        {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                        <span>Tema Escuro</span>
                      </div>
                      <div className="segmented-control theme-segmented">
                        <button 
                          type="button" 
                          className={`segmented-button ${theme === 'light' ? 'active' : ''}`}
                          onClick={() => { if (theme === 'dark') toggleTheme(); }}
                        >
                          Não
                        </button>
                        <button 
                          type="button" 
                          className={`segmented-button ${theme === 'dark' ? 'active' : ''}`}
                          onClick={() => { if (theme === 'light') toggleTheme(); }}
                        >
                          Sim
                        </button>
                      </div>
                    </div>

                    <div className="popover-menu-list">
                      <button 
                        type="button" 
                        className="popover-menu-btn"
                        onClick={() => { setShowProfilePopover(false); setShowSettings(true); }}
                      >
                        <div className="popover-menu-btn-left">
                          <Sliders size={14} />
                          <span>Ajustes de Câmbio</span>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                      
                      <button 
                        type="button" 
                        className="popover-menu-btn"
                        onClick={async () => {
                          const result = await fetchRealTimeRates();
                          if (result) {
                            alert(`Câmbio atualizado via API: Dólar R$ ${result.usd.toFixed(2)} | Libra R$ ${result.gbp.toFixed(2)}`);
                          } else {
                            alert('Erro ao sincronizar câmbio com o servidor.');
                          }
                        }}
                      >
                        <div className="popover-menu-btn-left">
                          <RefreshCw size={14} />
                          <span>Atualizar Cotação</span>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {!metrics ? (
          <div className="skeleton-dashboard animate-fade-in">
            {/* Esqueleto dos KPIs */}
            <div className="skeleton-grid">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-header-row">
                    <div className="skeleton-bar skeleton-title"></div>
                    <div className="skeleton-bar skeleton-circle"></div>
                  </div>
                  <div>
                    <div className="skeleton-bar skeleton-value"></div>
                    <div className="skeleton-bar skeleton-subtext"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Esqueleto dos Gráficos */}
            <div className="skeleton-charts-grid">
              <div className="skeleton-chart-card">
                <div className="skeleton-chart-header">
                  <div className="skeleton-bar skeleton-chart-title"></div>
                  <div className="skeleton-bar skeleton-chart-sub"></div>
                </div>
                <div className="skeleton-chart-body skeleton-bar"></div>
              </div>
              <div className="skeleton-chart-card">
                <div className="skeleton-chart-header">
                  <div className="skeleton-bar skeleton-chart-title"></div>
                  <div className="skeleton-bar skeleton-chart-sub"></div>
                </div>
                <div className="skeleton-chart-body skeleton-bar"></div>
              </div>
            </div>
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
          onSave={handleSaveRates} 
          onClose={() => setShowSettings(false)} 
          exchangeSource={exchangeSource}
          lastExchangeFetch={lastExchangeFetch}
          onFetchRates={fetchRealTimeRates}
        />
      )}

      {/* Overlay global para Drag and Drop */}
      {isDraggingFile && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-card glass-panel">
            <div className="drag-drop-icon-container">
              <CloudUpload size={42} />
            </div>
            <h2>Importar Histórico Prolific</h2>
            <p>Solte seu arquivo CSV aqui para atualizar o dashboard</p>
          </div>
        </div>
      )}
    </div>
  );
}
