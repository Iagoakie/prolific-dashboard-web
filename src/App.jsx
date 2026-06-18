import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection';
import SubmissionsTable from './components/SubmissionsTable';
import SettingsModal from './components/SettingsModal';
import { parseProlificCSV, calculateDashboardMetrics } from './utils/dataParser';
import { audioManager } from './utils/audio';
import html2canvas from 'html2canvas';
import { Bell, CloudUpload, Sun, Moon, Sliders, RefreshCw, ChevronRight, Zap } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('prolific_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [exchangeRates, setExchangeRates] = useState({ usd: 4.9128, gbp: 6.6638 });
  const [exchangeSource, setExchangeSource] = useState('default'); // 'default', 'api', 'fallback', 'manual'
  const [lastExchangeFetch, setLastExchangeFetch] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [csvSource, setCsvSource] = useState('default'); // 'default' ou 'uploaded'
  const [showSettings, setShowSettings] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  
  // Taxas e Spread para Calculadora de Liquidez
  const [taxes, setTaxes] = useState({ spread: 0, iof: 0 });

  // Estado da Conta Prolific (dados salvos)
  const [prolificAccount, setProlificAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('prolific_account');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Credenciais Prolific para Sincronização Automática
  const [prolificUserId, setProlificUserId] = useState(() => localStorage.getItem('prolific_user_id') || '');
  const [prolificToken, setProlificToken] = useState(() => localStorage.getItem('prolific_token') || '');
  const [prolificSyncing, setProlificSyncing] = useState(false);

  const handleSyncProlific = async (userId = prolificUserId, token = prolificToken) => {
    if (!userId || !token) {
      return { success: false, error: 'User ID e Token de API são obrigatórios para sincronizar.' };
    }
    
    setProlificSyncing(true);
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const url = isLocal 
        ? `/api/prolific/api/v1/users/${userId.trim()}/` 
        : `https://internal-api.prolific.com/api/v1/users/${userId.trim()}/`;

      // Formata o header de autorização dinamicamente (suporta Bearer JWT e Token)
      let authHeader = token.trim();
      if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('Token ')) {
        if (authHeader.startsWith('eyJ')) {
          authHeader = `Bearer ${authHeader}`;
        } else {
          authHeader = `Token ${authHeader}`;
        }
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Token inválido ou expirado (Não autorizado 401).');
        }
        if (res.status === 404) {
          throw new Error('Usuário não encontrado. Verifique seu Prolific User ID.');
        }
        throw new Error(`Erro na API Prolific: Código ${res.status}`);
      }
      
      const data = await res.json();
      
      const account = {
        name: data.name || null,
        frozen: !!data.is_study_distribution_frozen,
        banned: !!data.is_banned,
        status: data.status || 'UNKNOWN',
        onHold: !!data.on_hold,
        balance: typeof data.balance === 'number' ? data.balance : 0,
        pendingBalance: typeof data.pending_balance === 'number' ? data.pending_balance : 0,
        currencyCode: data.currency_code || 'GBP',
        minWithdraw: typeof data.min_balance_to_withdraw === 'number' ? data.min_balance_to_withdraw : 500,
        canCashout: !!data.can_instant_cashout,
        canInstantCashoutEnabled: typeof data.can_instant_cashout_enabled !== 'undefined' ? !!data.can_instant_cashout_enabled : true,
        canCashoutEnabled: typeof data.can_cashout_enabled !== 'undefined' ? !!data.can_cashout_enabled : true,
        payeeStatus: data.payee_status || null,
        isSpecialised: !!data.is_specialised_participant,
        lastUpdated: new Date().toISOString()
      };
      
      setProlificAccount(account);
      localStorage.setItem('prolific_account', JSON.stringify(account));
      
      // Salva as credenciais se forem válidas
      setProlificUserId(userId);
      setProlificToken(token);
      localStorage.setItem('prolific_user_id', userId);
      localStorage.setItem('prolific_token', token);

      // Sincronizar o CSV de submissions também (via proxy se local, ou direto)
      let csvSynced = false;
      try {
        const csvUrl = isLocal 
          ? '/api/prolific/api/v1/submissions/export/?ordering=-started_at' 
          : 'https://internal-api.prolific.com/api/v1/submissions/export/?ordering=-started_at';

        const csvRes = await fetch(csvUrl, {
          headers: {
            'Authorization': authHeader
          }
        });

        if (csvRes.ok) {
          const csvContent = await csvRes.text();
          if (csvContent && csvContent.includes('Study')) {
            setCsvText(csvContent);
            setCsvSource('uploaded');
            localStorage.setItem('prolific_csv_cache', csvContent);
            localStorage.setItem('prolific_csv_date', new Date().toISOString());
            csvSynced = true;
          }
        }
      } catch (csvErr) {
        console.warn("Could not sync CSV directly via API (likely CORS in hosted mode):", csvErr);
      }

      if (account.frozen) {
        triggerNotification('⚠️ Atenção', 'Sua distribuição de estudos está congelada!', 'goal');
      } else {
        const syncMsg = csvSynced 
          ? 'Dados e Histórico CSV atualizados com sucesso!' 
          : 'Dados do Prolific atualizados com sucesso!';
        triggerNotification('✅ Sincronizado', syncMsg, 'success');
      }
      return { success: true, account };
    } catch (err) {
      console.error("Error syncing Prolific profile:", err);
      triggerNotification('❌ Falha na Sincronização', err.message, 'rate');
      return { success: false, error: err.message };
    } finally {
      setProlificSyncing(false);
    }
  };

  const handleSaveProlificData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      const account = {
        name: data.name || null,
        frozen: !!data.is_study_distribution_frozen,
        banned: !!data.is_banned,
        status: data.status || 'UNKNOWN',
        onHold: !!data.on_hold,
        balance: typeof data.balance === 'number' ? data.balance : 0,
        pendingBalance: typeof data.pending_balance === 'number' ? data.pending_balance : 0,
        currencyCode: data.currency_code || 'GBP',
        minWithdraw: typeof data.min_balance_to_withdraw === 'number' ? data.min_balance_to_withdraw : 500,
        canCashout: !!data.can_instant_cashout,
        canInstantCashoutEnabled: typeof data.can_instant_cashout_enabled !== 'undefined' ? !!data.can_instant_cashout_enabled : true,
        canCashoutEnabled: typeof data.can_cashout_enabled !== 'undefined' ? !!data.can_cashout_enabled : true,
        payeeStatus: data.payee_status || null,
        isSpecialised: !!data.is_specialised_participant,
        lastUpdated: new Date().toISOString()
      };
      setProlificAccount(account);
      localStorage.setItem('prolific_account', JSON.stringify(account));
      
      if (account.frozen) {
        triggerNotification('⚠️ Atenção', 'Sua distribuição de estudos está congelada!', 'goal');
      } else {
        triggerNotification('✅ Conta OK', 'Distribuição de estudos ativa', 'success');
      }
      return { success: true, account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleClearProlificData = () => {
    setProlificAccount(null);
    setProlificUserId('');
    setProlificToken('');
    localStorage.removeItem('prolific_account');
    localStorage.removeItem('prolific_user_id');
    localStorage.removeItem('prolific_token');
  };

  // Estados dos Upgrades Premium
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const dragCounter = useRef(0);

  // Metas do Usuário
  const [dailyGoal, setDailyGoal] = useState(25); // Meta diária em BRL
  const [weeklyGoal, setWeeklyGoal] = useState(150); // Meta semanal em BRL

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    localStorage.setItem('prolific_theme', theme);
  }, [theme]);

  // Estado da Dynamic Island
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
  const triggerNotification = (...notification) => {
    playiOSChime(notification[2] || 'success');
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

  // Auto-sync Prolific Account on mount if credentials exist
  useEffect(() => {
    const savedUserId = localStorage.getItem('prolific_user_id');
    const savedToken = localStorage.getItem('prolific_token');
    if (savedUserId && savedToken) {
      const timer = setTimeout(() => {
        handleSyncProlific(savedUserId, savedToken);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Verifica se há dados importados via URL (Atalho/Bookmarklet) ou via postMessage (Cross-Origin Handshake)
  useEffect(() => {
    // 1. Tratamento via URL (legado/fallback)
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import_data');
    const importCsv = params.get('import_csv');
    let hadData = false;

    if (importData) {
      try {
        const decoded = decodeURIComponent(importData);
        const result = handleSaveProlificData(decoded);
        hadData = true;
        if (!importCsv && result.success) {
          triggerNotification('✅ Sincronizado', 'Dados do Prolific importados via Atalho!', 'success');
        }
      } catch (err) {
        console.error("Falha ao importar dados da conta via URL:", err);
      }
    }

    if (importCsv) {
      try {
        const decodedCsv = decodeURIComponent(importCsv);
        setCsvText(decodedCsv);
        setCsvSource('uploaded');
        localStorage.setItem('prolific_csv_cache', decodedCsv);
        localStorage.setItem('prolific_csv_date', new Date().toISOString());
        hadData = true;
        triggerNotification('🔄 Sync Completo', 'Conta + CSV atualizados via Bookmarklet!', 'success');
      } catch (err) {
        console.error("Falha ao importar CSV via URL:", err);
      }
    }

    if (hadData) {
      // Limpa a URL sem recarregar a página
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }

    // 2. Tratamento via postMessage (handshake moderno para evitar limites de URL)
    const handleMessage = (event) => {
      const { type, account, csv } = event.data || {};
      
      if (type === 'prolific_import') {
        let msgSaved = false;
        
        if (account) {
          try {
            const accountStr = typeof account === 'string' ? account : JSON.stringify(account);
            const result = handleSaveProlificData(accountStr);
            if (result.success) {
              msgSaved = true;
            }
          } catch (err) {
            console.error("Falha ao salvar dados da conta via postMessage:", err);
          }
        }
        
        if (csv) {
          try {
            setCsvText(csv);
            setCsvSource('uploaded');
            localStorage.setItem('prolific_csv_cache', csv);
            localStorage.setItem('prolific_csv_date', new Date().toISOString());
            msgSaved = true;
          } catch (err) {
            console.error("Falha ao salvar CSV via postMessage:", err);
          }
        }

        if (msgSaved) {
          triggerNotification('🔄 Sync Completo', 'Conta + CSV atualizados via Bookmarklet!', 'success');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Se fomos abertos por outra janela (ex: o bookmarklet no Prolific), avisa que estamos prontos!
    if (window.opener) {
      window.opener.postMessage('dashboard_ready', '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
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

  // Carrega o CSV (prioridade: cache do bookmarklet > padrão)
  useEffect(() => {
    const cachedCsv = localStorage.getItem('prolific_csv_cache');
    if (cachedCsv) {
      setCsvText(cachedCsv);
      setCsvSource('uploaded');
      return;
    }
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
      const parsed = parseProlificCSV(csvText, exchangeRates, taxes);
      const computed = calculateDashboardMetrics(parsed);
      
      // Checar se o usuário subiu de nível na atualização do csv
      if (metrics && computed && computed.kpis.gamification.currentLevel > metrics.kpis.gamification.currentLevel) {
        audioManager.playLevelUp();
        triggerNotification('Parabéns! Nível Subiu', `Você alcançou o Nível ${computed.kpis.gamification.currentLevel}`, 'goal');
      }

      setSubmissions(parsed);
      setMetrics(computed);
    } catch (err) {
      console.error('Erro no processamento dos dados:', err);
      triggerNotification('Erro ao processar CSV', err.message, 'goal');
    }
  }, [csvText, exchangeRates, taxes]);

  // Alterna o tema
  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light');
    audioManager.playToggle();
  };

  // Upload manual de novo CSV
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvText(e.target.result);
      setCsvSource('uploaded');
      audioManager.playCoin();
      triggerNotification('Importação Concluída', 'Seus ganhos foram atualizados', 'success');
    };
    reader.readAsText(file);
  };

  // Exportar Relatório (Screenshot)
  const handleExportImage = async () => {
    try {
      const element = document.querySelector('.main-content-area');
      if (!element) return;
      const canvas = await html2canvas(element, { backgroundColor: theme === 'dark' ? '#000000' : '#fbfbfd', scale: 2 });
      const link = document.createElement('a');
      link.download = `ProlificDash_Resumo_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      audioManager.playSuccess();
      triggerNotification('Exportação Concluída', 'Relatório salvo com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
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
    <div className="app-layout min-h-screen">
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
        onExport={handleExportImage}
        prolificAccount={prolificAccount}
      />

      <main className="main-content-area min-w-0">
        {metrics && (
          <header className="main-header animate-fade-in">
            <div className="header-info">
              <h1>{getPageTitle()}</h1>
              <span className="period-label">
                Período: {metrics.kpis.dataRangeLabel || 'N/A'}
              </span>
            </div>

            <button
              type="button"
              className="exchange-status-pill"
              onClick={fetchRealTimeRates}
              title="Atualizar cotação"
            >
              <span className="exchange-status-icon"><Zap size={17} fill="currentColor" /></span>
              <span className="exchange-status-copy">
                <strong>Câmbio Sincronizado</strong>
                <small>Dólar: R$ {exchangeRates.usd.toFixed(2)} | Libra: R$ {exchangeRates.gbp.toFixed(2)}</small>
              </span>
            </button>

            <div className="header-actions">
              <span className="last-updated">
                Atualizado às {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
              </span>

              <button
                type="button"
                className="header-icon-button spring-click"
                onClick={fetchRealTimeRates}
                title="Atualizar dados"
                aria-label="Atualizar dados"
              >
                <RefreshCw size={18} />
              </button>

              <div className="avatar-popover-container">
                <button 
                  className="header-icon-button notification-button spring-click"
                  onClick={() => setShowProfilePopover(!showProfilePopover)}
                  title="Notificações e perfil"
                  aria-label="Notificações e perfil"
                >
                  <Bell size={18} />
                  <span className="notification-dot"></span>
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
          <div className="page-content w-full">
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
          taxes={taxes}
          onSaveTaxes={setTaxes}
          prolificAccount={prolificAccount}
          onSaveProlificData={handleSaveProlificData}
          onClearProlificData={handleClearProlificData}
          prolificUserId={prolificUserId}
          prolificToken={prolificToken}
          prolificSyncing={prolificSyncing}
          onSyncProlific={handleSyncProlific}
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
