import React from 'react';
import { LayoutDashboard, TrendingUp, List, Sun, Moon, Settings, Zap } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  onSettingsOpen, 
  loadedCount,
  csvSource,
  kpis
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
  const achievements = kpis?.achievements || [];

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

      {/* Achievements Section */}
      {kpis && achievements.length > 0 && (() => {
        const totalAchievements = achievements.length;
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const unlockedPercent = Math.round((unlockedCount / totalAchievements) * 100);

        return (
          <div className="sidebar-achievements-linear">
            <div className="achievements-progress-header">
              <span className="achievements-title">🏅 Conquistas</span>
              <span className="achievements-count">{unlockedCount}/{totalAchievements}</span>
            </div>
            <div className="achievements-progress-bar-bg">
              <div className="achievements-progress-bar-fill" style={{ width: `${unlockedPercent}%` }}></div>
            </div>
            <div className="achievements-emojis-row">
              {achievements.map((ach) => (
                <span 
                  key={ach.id} 
                  className={`achievement-emoji-item ${ach.unlocked ? 'unlocked' : 'locked'}`}
                  title={`${ach.label}: ${ach.unlocked ? 'Desbloqueada' : 'Bloqueada'}`}
                >
                  {ach.unlocked ? ach.emoji : '🔒'}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="sidebar-footer">
        <button className="nav-item spring-click" onClick={onSettingsOpen}>
          <Settings size={20} />
          <span>Ajustes</span>
        </button>

        <button className="nav-item theme-toggle spring-click" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>
    </aside>
  );
}
