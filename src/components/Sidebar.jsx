import React from 'react';
import { LayoutDashboard, TrendingUp, List, Sun, Moon, Settings, Zap, UploadCloud } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  onSettingsOpen, 
  onFileUpload,
  loadedCount,
  csvSource,
  kpis,
  onExport,
  prolificAccount
}) {
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const streak = kpis?.streak || 0;
  const ganhosHoje = kpis?.ganhosHojeBRL || 0;
  const gamification = kpis?.gamification || null;

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-dot"></div>
          <span className="logo-text">Prolific<span className="logo-sub">Dash</span></span>
        </div>
        <div className="badge-csv">
          <span className={`status-dot ${loadedCount > 0 ? 'active' : ''}`}></span>
          {csvSource === 'uploaded' ? 'CSV Importado' : 'CSV Padrão'}
        </div>
      </div>

      {/* Saúde da Conta Prolific */}
      {prolificAccount ? (
        <div className="sidebar-account-health">
          {/* Domain Expert Badge */}
          {prolificAccount.isSpecialised && (
            <div className="account-health-badge expert" data-tooltip="Você foi qualificado como especialista em um domínio específico. Isso dá acesso a estudos exclusivos com remuneração geralmente superior.">
              <span className="health-badge-icon">⭐</span>
              <span className="health-badge-text">Domain Expert</span>
            </div>
          )}
          {/* Smart Frozen Logic */}
          {prolificAccount.frozen && prolificAccount.status === 'OK' && !prolificAccount.banned ? (
            <div className="account-health-badge idle" data-tooltip="Não há estudos disponíveis para o seu perfil agora. Isso é normal e muda ao longo do dia conforme pesquisadores publicam novos estudos.">
              <span className="health-badge-icon">⏸️</span>
              <span className="health-badge-text">Sem estudos no momento</span>
            </div>
          ) : prolificAccount.frozen ? (
            <div className="account-health-badge frozen" data-tooltip="O Prolific pausou a distribuição de novos estudos para você. Verifique se há pendências ou restrições na sua conta.">
              <span className="health-badge-icon">❄️</span>
              <span className="health-badge-text">Distribuição Congelada</span>
            </div>
          ) : (
            <div className="account-health-badge active" data-tooltip="Sua conta está ativa e recebendo novos estudos normalmente. Fique de olho no Prolific para participar.">
              <span className="health-badge-icon">✅</span>
              <span className="health-badge-text">Distribuição Ativa</span>
            </div>
          )}
          {prolificAccount.banned && (
            <div className="account-health-badge banned" data-tooltip="Sua conta foi banida pelo Prolific. Entre em contato com o suporte para mais informações.">
              <span className="health-badge-icon">🚫</span>
              <span className="health-badge-text">Conta Banida</span>
            </div>
          )}

          {/* Saldo Detalhado */}
          <div className="account-health-details">
            <div className="health-detail-row" data-tooltip="Valor já aprovado pelos pesquisadores e creditado na sua conta Prolific, pronto para saque.">
              <span className="health-detail-icon">💰</span>
              <div className="health-detail-info">
                <span className="health-detail-value">£{(prolificAccount.balance / 100).toFixed(2)}</span>
                <span className="health-detail-label">Saldo Aprovado</span>
              </div>
            </div>
            <div className="health-detail-row" data-tooltip="Valor de estudos concluídos aguardando aprovação do pesquisador. Geralmente é aprovado em até 14 dias úteis.">
              <span className="health-detail-icon">⏳</span>
              <div className="health-detail-info">
                <span className="health-detail-value">£{(prolificAccount.pendingBalance / 100).toFixed(2)}</span>
                <span className="health-detail-label">Aguardando Aprovação</span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso de Saque */}
          {(() => {
            const balancePounds = prolificAccount.balance / 100;
            const minWithdraw = (prolificAccount.minWithdraw || 500) / 100;
            const progress = Math.min(100, (balancePounds / minWithdraw) * 100);
            const canCashout = prolificAccount.canCashout || balancePounds >= minWithdraw;
            return (
              <div className="cashout-progress-section">
                <div className="cashout-progress-header">
                  <span className="cashout-progress-label">Progresso p/ Saque</span>
                  <span className="cashout-progress-amount">£{balancePounds.toFixed(2)} / £{minWithdraw.toFixed(2)}</span>
                </div>
                <div className="cashout-progress-bar-bg">
                  <div 
                    className={`cashout-progress-bar-fill ${canCashout ? 'ready' : ''}`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {canCashout ? (
                  <div className="cashout-status ready" data-tooltip="Seu saldo atingiu o valor mínimo. Você pode solicitar o saque diretamente no site do Prolific.">
                    <span>✅</span>
                    <span>Saque Disponível</span>
                  </div>
                ) : (
                  <div className="cashout-status pending" data-tooltip={`O mínimo para solicitar saque no Prolific é £${minWithdraw.toFixed(2)}. Continue completando estudos para atingir esse valor.`}>
                    <span>⏳</span>
                    <span>Faltam £{(minWithdraw - balancePounds).toFixed(2)} para sacar</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Timestamp */}
          {prolificAccount.lastUpdated && (
            <div className="health-last-updated">
              Atualizado {(() => {
                try {
                  const diff = Date.now() - new Date(prolificAccount.lastUpdated).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return 'agora';
                  if (mins < 60) return `há ${mins} min`;
                  const hours = Math.floor(mins / 60);
                  if (hours < 24) return `há ${hours}h`;
                  return `há ${Math.floor(hours / 24)}d`;
                } catch { return ''; }
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="sidebar-account-health">
          <div className="account-health-badge disconnected">
            <span className="health-badge-icon">⚪</span>
            <span className="health-badge-text">API não conectada</span>
          </div>
        </div>
      )}

      {/* Quick Stats Section */}
      {kpis && (
        <div className="sidebar-quick-stats">
          <div className="quick-stat-row">
            <span className="quick-stat-icon fire-icon">🔥</span>
            <div className="quick-stat-info">
              <span className="quick-stat-value">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
              <span className="quick-stat-label">Streak</span>
            </div>
          </div>
          <div className="quick-stat-row">
            <span className="quick-stat-icon">💰</span>
            <div className="quick-stat-info">
              <span className="quick-stat-value">{formatBRL(ganhosHoje)}</span>
              <span className="quick-stat-label">Ganhos Hoje</span>
            </div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        <button 
          className={`nav-item spring-click ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={20} />
          <span>Visão Geral</span>
        </button>

        <button 
          className={`nav-item spring-click ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={20} />
          <span>Análise Temporal</span>
        </button>

        <button 
          className={`nav-item spring-click ${activeTab === 'efficiency' ? 'active' : ''}`}
          onClick={() => setActiveTab('efficiency')}
        >
          <Zap size={20} />
          <span>Eficiência</span>
        </button>

        <button 
          className={`nav-item spring-click ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <List size={20} />
          <span>Estudos ({loadedCount})</span>
        </button>
      </nav>

      {/* Gamification / Níveis */}
      {kpis && gamification && (
        <div className="sidebar-achievements-linear" style={{ padding: '12px' }}>
          <div className="achievements-progress-header" style={{ marginBottom: '6px' }}>
            <span className="achievements-title" style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
              ⭐ Lvl {gamification.currentLevel} • {gamification.levelTitle}
            </span>
            <span className="achievements-count" style={{ color: '#ff9500', fontWeight: 'bold' }}>
              {gamification.totalXP.toLocaleString('pt-BR')} XP
            </span>
          </div>
          <div className="achievements-progress-bar-bg" style={{ height: '8px' }}>
            <div 
              className="achievements-progress-bar-fill" 
              style={{ width: `${Math.min(100, gamification.levelProgress)}%`, background: 'linear-gradient(90deg, #ff9500, #ffcc00)' }}
            ></div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'right', fontWeight: '500' }}>
            Faltam {(gamification.nextLevelXP - gamification.totalXP).toLocaleString('pt-BR')} XP para o Nível {gamification.currentLevel + 1}
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <label className="upload-btn nav-item spring-click">
          <UploadCloud size={20} />
          <span>Atualizar CSV</span>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                onFileUpload(file);
              }
            }} 
            style={{ display: 'none' }} 
          />
        </label>

        <button className="nav-item spring-click" onClick={onSettingsOpen}>
          <Settings size={20} />
          <span>Ajustes</span>
        </button>

        <button className="nav-item spring-click" onClick={onExport} style={{ color: 'var(--accent-color)' }}>
          <UploadCloud size={20} style={{ transform: 'rotate(180deg)' }} />
          <span>Exportar Resumo</span>
        </button>

        <button className="nav-item theme-toggle spring-click" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>
    </aside>
  );
}
