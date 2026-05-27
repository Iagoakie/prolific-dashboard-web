import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection';
import SubmissionsTable from './components/SubmissionsTable';
import SettingsModal from './components/SettingsModal';
import { parseProlificCSV, calculateDashboardMetrics } from './utils/dataParser';
import { CloudUpload, User, Sun, Moon, Sliders, RefreshCw, ChevronRight } from 'lucide-react';
import './App.css';

// === FLOATING EMOJIS COMPONENT ===
const FLOAT_EMOJIS = ['💰', '📊', '🎯', '🚀', '💎', '⭐', '🔥', '💸', '📈', '🏆'];

function FloatingEmojis() {
  const emojis = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      emoji: FLOAT_EMOJIS[i % FLOAT_EMOJIS.length],
      left: `${Math.random() * 90 + 5}%`,
      size: Math.random() * 18 + 16,
      duration: Math.random() * 15 + 20,
      delay: Math.random() * 20,
      drift: Math.random() * 60 - 30
    }));
  }, []);

  return (
    <div className="floating-emojis-container" aria-hidden="true">
      {emojis.map((e) => (
        <span
          key={e.id}
          className="floating-emoji"
          style={{
            left: e.left,
            fontSize: `${e.size}px`,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            '--drift': `${e.drift}px`
          }}
        >
          {e.emoji}
        </span>
      ))}
    </div>
  );
}

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

  // Metas do Usuário
  const [dailyGoal, setDailyGoal] = useState(25); // Meta diária em BRL
  const [weeklyGoal, setWeeklyGoal] = useState(150); // Meta semanal em BRL

  // Estado da Dynamic Island
  const [islandState, setIslandState] = useState('compact'); // 'compact', 'expanded', 'menu'
  const [dynamicIsland, setDynamicIsland] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' // 'success', 'rate', 'goal'
  });

  // Estado dos confetes
  const [showConfetti, setShowConfetti] = useState(false);

  // Som Sintetizado via Web Audio API (iOS Chime)
  const playiOSChime = (type = 'success') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      const now = ctx.currentTime;
      
      gainNode.gain.setValueAtTime(0, now);
      
      if (type === 'goal') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde C-E-G-C em cascata
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          const oscGain = ctx.createGain();
          oscGain.connect(gainNode);
          
          oscGain.gain.setValueAtTime(0, now + idx * 0.08);
          oscGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);
          
          osc.connect(oscGain);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.6);
        });
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      } else if (type === 'rate') {
        const notes = [880, 1318.51]; // Dois tons agudos
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          const oscGain = ctx.createGain();
          oscGain.connect(gainNode);
          
          oscGain.gain.setValueAtTime(0, now + idx * 0.07);
          oscGain.gain.linearRampToValueAtTime(0.15, now + idx * 0.07 + 0.01);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.3);
          
          osc.connect(oscGain);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.4);
        });
        gainNode.gain.linearRampToValueAtTime(0.6, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      } else {
        const notes = [783.99, 1046.50]; // G5 -> C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          const oscGain = ctx.createGain();
          oscGain.connect(gainNode);
          
          oscGain.gain.setValueAtTime(0, now + idx * 0.1);
          oscGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.4);
          
          osc.connect(oscGain);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.5);
        });
        gainNode.gain.linearRampToValueAtTime(0.7, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  };

  // Dispara Dynamic Island Alert
  const triggerNotification = (title, message, type = 'success') => {
    setDynamicIsland({ show: true, title, message, type });
    setIslandState('expanded');
    playiOSChime(type);
    
    // Auto-hide e voltar para compacto
    setTimeout(() => {
      setIslandState(prev => prev === 'expanded' ? 'compact' : prev);
    }, 4500);
  };



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
        
        triggerNotification('Câmbio Sincronizado', `Dólar: R$ ${usdBid.toFixed(2)} | Libra: R$ ${gbpBid.toFixed(2)}`, 'rate');
        
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

  // Fecha o menu da Dynamic Island ao clicar fora
  useEffect(() => {
    const handleClickOutsideIsland = (e) => {
      if (islandState === 'menu' && !e.target.closest('.dynamic-island-container')) {
        setIslandState('compact');
      }
    };
    window.addEventListener('click', handleClickOutsideIsland);
    return () => {
      window.removeEventListener('click', handleClickOutsideIsland);
    };
  }, [islandState]);

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
      case 'efficiency': return 'Eficiência';
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

      {/* Emojis Flutuantes Animados */}
      <FloatingEmojis />

      {/* Confetes de Celebração */}
      {showConfetti && (
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
                backgroundColor: ['#ff2d55', '#007aff', '#30d158', '#ff9500', '#5856d6', '#ffcc00', '#00c7be'][i % 7],
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 12 + 6}px`,
                '--confetti-rotate': `${Math.random() * 720 - 360}deg`,
                '--confetti-drift': `${Math.random() * 200 - 100}px`
              }}
            />
          ))}
        </div>
      )}
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onSettingsOpen={() => setShowSettings(true)}
        onFileUpload={handleFileUpload}
        loadedCount={submissions.length}
        csvSource={csvSource}
        kpis={metrics?.kpis}
      />

      <main className="main-content-area">
        {metrics && (
          <header className="main-header animate-fade-in">
            <div className="header-info">
              <h1>{getPageTitle()}</h1>
              <span className="period-label">
                Período: {metrics.kpis.dataRangeLabel || 'N/A'}
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
                  <div className="profile-popover">
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
                      <a 
                        href="https://app.prolific.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="popover-menu-btn"
                        style={{ borderBottom: '1px solid var(--border-color)', borderRadius: '10px 10px 0 0', textDecoration: 'none' }}
                      >
                        <div className="popover-menu-btn-left">
                          <ChevronRight size={14} style={{ transform: 'rotate(-45deg)' }} />
                          <span>Ir para Prolific</span>
                        </div>
                        <ChevronRight size={14} />
                      </a>
                      
                      <button 
                        type="button" 
                        className="popover-menu-btn"
                        onClick={() => { setShowProfilePopover(false); setShowSettings(true); }}
                        style={{ borderBottom: '1px solid var(--border-color)' }}
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
                <ChartsSection 
                  activeTab="overview" 
                  chartsData={metrics.charts} 
                  kpis={metrics.kpis} 
                  dailyGoal={dailyGoal}
                  setDailyGoal={setDailyGoal}
                  weeklyGoal={weeklyGoal}
                  setWeeklyGoal={setWeeklyGoal}
                />
              </>
            )}

            {activeTab === 'analytics' && (
              <ChartsSection 
                activeTab="analytics" 
                chartsData={metrics.charts} 
                kpis={metrics.kpis} 
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                weeklyGoal={weeklyGoal}
                setWeeklyGoal={setWeeklyGoal}
              />
            )}

            {activeTab === 'submissions' && (
              <SubmissionsTable submissions={submissions} />
            )}

            {activeTab === 'efficiency' && (
              <ChartsSection 
                activeTab="efficiency" 
                chartsData={metrics.charts} 
                kpis={metrics.kpis} 
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                weeklyGoal={weeklyGoal}
                setWeeklyGoal={setWeeklyGoal}
              />
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
          onFileUpload={handleFileUpload}
          csvSource={csvSource}
        />
      )}

      {/* Dynamic Island */}
      <div 
        className={`dynamic-island-container show type-${dynamicIsland.type}`}
        style={{ cursor: islandState === 'compact' ? 'pointer' : 'default' }}
        onClick={() => {
          if (islandState === 'compact') {
            setIslandState('menu');
          }
        }}
      >
        <div className={`dynamic-island-bubble state-${islandState}`}>
          {islandState === 'compact' && (
            <div className="island-compact-content animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="island-dot pulse-green" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#30d158', display: 'inline-block' }}></span>
              <span className="island-compact-text" style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2px', textTransform: 'uppercase' }}>Prolific Live</span>
            </div>
          )}

          {islandState === 'expanded' && (
            <div className="island-expanded-content animate-fade-in" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="dynamic-island-icon">
                {dynamicIsland.type === 'goal' ? '🎉' : dynamicIsland.type === 'rate' ? '⚡' : '💰'}
              </div>
              <div className="dynamic-island-info">
                <span className="dynamic-island-title">{dynamicIsland.title}</span>
                <span className="dynamic-island-message">{dynamicIsland.message}</span>
              </div>
            </div>
          )}

          {islandState === 'menu' && (
            <div className="island-menu-content animate-fade-in" style={{ width: '100%' }}>
              <div className="island-menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="island-dot pulse-green" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#30d158', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.6 }}>Status Live</span>
                </div>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIslandState('compact');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer', lineHeight: 1, opacity: 0.6 }}
                >
                  ×
                </button>
              </div>
              
              <div className="island-menu-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                <div className="island-mini-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                    <span>Meta de Hoje:</span>
                    <span>{Math.round((metrics?.kpis.ganhosHojeBRL / dailyGoal) * 100)}%</span>
                  </div>
                  <div className="island-progress-bar" style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      className="island-progress-fill" 
                      style={{ 
                        height: '100%', 
                        backgroundColor: '#30d158', 
                        borderRadius: '99px',
                        width: `${Math.min(100, ((metrics?.kpis.ganhosHojeBRL || 0) / (dailyGoal || 25)) * 100)}%`,
                        transition: 'width 0.4s ease'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
