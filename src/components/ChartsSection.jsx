import { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { TrendingUp, Clock, Calendar, CheckCircle, ChevronDown, DollarSign, Target } from 'lucide-react';
import './ChartsSection.css';
import './KPICards.css';

// Cores base para os gráficos matching com o CSS
// Custom Tooltip estilo Apple (Frosted Glass)
const CustomTooltip = ({ active, payload, label, prefix = 'R$ ' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-panel">
        <p className="tooltip-label">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="tooltip-value" style={{ color: item.color || '#007aff' }}>
            {item.name}: {prefix}{typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartsSection({ 
  activeTab, 
  chartsData, 
  kpis, 
  dailyGoal, 
  setDailyGoal, 
  weeklyGoal, 
  setWeeklyGoal 
}) {
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  if (activeTab === 'overview') {
    const dailyProgress = Math.min(1.5, Math.max(0, (kpis.ganhosHojeBRL || 0) / (dailyGoal || 25)));
    const weeklyProgress = Math.min(1.5, Math.max(0, (kpis.ganhosSemanaBRL || 0) / (weeklyGoal || 150)));
    const overallProgress = Math.round(((Math.min(1, dailyProgress) + Math.min(1, weeklyProgress)) / 2) * 100);

    // Anéis SVG
    const ringsSize = 130;
    const strokeWidth = 12;
    const center = ringsSize / 2;
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - Math.min(1, overallProgress / 100));

    return (
      <div className="overview-layout-stack animate-fade-in">
        {/* Gráfico Principal: Ganhos Acumulados */}
        <div className="chart-card glass-panel main-chart-full" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <TrendingUp size={18} className="chart-title-icon" />
              <h3>Curva de ganhos (acumulado)</h3>
            </div>
            <span className="chart-subtitle">Progresso em BRL ao longo do tempo</span>
            <button type="button" className="chart-filter">BRL <ChevronDown size={13} /></button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.acumulado} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16c784" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#16c784" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8edf5" />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={50}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `R$ ${val}`} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="ganhoAcumulado" 
                  name="Total Acumulado"
                  isAnimationActive={false}
                  stroke="#16c784" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#earningsGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linha 2 dividida */}
        <div className="overview-row-two">
          {/* Faturamento por Dia da Semana */}
          <div className="chart-card glass-panel secondary-chart-split" onMouseMove={handleMouseMove}>
            <div className="chart-header">
              <div className="chart-header-left">
                <Calendar size={18} className="chart-title-icon" />
                <h3>Faturamento por dia da semana</h3>
              </div>
              <span className="chart-subtitle">Ganhos acumulados em BRL para cada dia da semana</span>
              <button type="button" className="chart-filter">Por dia da semana <ChevronDown size={13} /></button>
            </div>
            <div className="chart-container">
              {!chartsData.faturamentoDiaSemana || chartsData.faturamentoDiaSemana.length === 0 ? (
                <div className="no-data-placeholder">Nenhum faturamento registrado ainda.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.faturamentoDiaSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFaturamentoDia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#7aa7ff" stopOpacity={0.85}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8edf5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `R$ ${val}`} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(120, 120, 128, 0.08)' }} />
                    <Bar 
                      dataKey="valor" 
                      name="Faturamento" 
                      isAnimationActive={false}
                      fill="url(#colorFaturamentoDia)" 
                      stroke="#2563eb"
                      strokeWidth={0}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Anéis de Meta Apple (iCloud Pacing Hub) */}
          <div className="chart-card glass-panel pacing-rings-card" onMouseMove={handleMouseMove}>
            <div className="chart-header">
              <div className="chart-header-left">
                <Target size={18} className="chart-title-icon" />
                <h3>Metas de atividade</h3>
              </div>
              <span className="chart-subtitle">Progresso em tempo real das suas metas</span>
              <button type="button" className="chart-filter">Esta semana <ChevronDown size={13} /></button>
            </div>

            <div className="pacing-rings-content">
              <div className="rings-container">
                <svg width={ringsSize} height={ringsSize} viewBox={`0 0 ${ringsSize} ${ringsSize}`} className="activity-rings-svg">
                  {/* Defs de gradiente */}
                  <defs>
                    <linearGradient id="gradientOverall" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  {/* Fundo do Anel (Lilás Claro / Azul Claro) */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="#e8edff"
                    strokeWidth={strokeWidth}
                  />
                  {/* Anel de Progresso */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="url(#gradientOverall)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                    className="ring-circle"
                  />
                </svg>

                <div className="rings-legend-percentage">
                  <span className="legend-p-daily">{overallProgress}%</span>
                  <span className="legend-p-weekly">de 2 metas</span>
                </div>
              </div>

              <div className="rings-text-legend">
                <div className="ring-legend-item">
                  <div className="ring-legend-item-left">
                    <span className="ring-marker-bullet" style={{ backgroundColor: '#2563eb' }}></span>
                    <span className="ring-item-title">Hoje</span>
                  </div>
                  <span className="ring-item-vals">
                    <strong>{formatBRL(kpis.ganhosHojeBRL)}</strong>
                    <span className="subtext"> / {formatBRL(dailyGoal)}</span>
                  </span>
                </div>

                <div className="ring-legend-item">
                  <div className="ring-legend-item-left">
                    <span className="ring-marker-bullet" style={{ backgroundColor: '#8b5cf6' }}></span>
                    <span className="ring-item-title">Semana</span>
                  </div>
                  <span className="ring-item-vals">
                    <strong>{formatBRL(kpis.ganhosSemanaBRL)}</strong>
                    <span className="subtext"> / {formatBRL(weeklyGoal)}</span>
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                className="adjust-goals-btn spring-click"
                onClick={() => setShowGoalSettings(!showGoalSettings)}
              >
                Ajustar Metas
              </button>

              {showGoalSettings && (
                <div className="goal-settings-popover glass-panel animate-fade-in">
                  <div className="goal-settings-header">
                    <h4>Ajustar Metas (R$)</h4>
                    <button type="button" className="close-mini-btn" onClick={() => setShowGoalSettings(false)}>×</button>
                  </div>
                  <div className="goal-slider-group">
                    <div className="slider-header">
                      <span>Meta Diária: R$ {dailyGoal}</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="5"
                      value={dailyGoal} 
                      onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="goal-slider-group">
                    <div className="slider-header">
                      <span>Meta Semanal: R$ {weeklyGoal}</span>
                    </div>
                    <input 
                      type="range" 
                      min="25" 
                      max="500" 
                      step="25"
                      value={weeklyGoal} 
                      onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ABA DE EFICIÊNCIA (Productivity / ROI)
  if (activeTab === 'efficiency') {
    const formatBRL2 = (val) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(val);
    };

    const efficiencyCards = [
      {
        title: 'Ganho por Hora',
        value: kpis.reaisPorHora > 0 ? formatBRL2(kpis.reaisPorHora) : 'R$ 0,00',
        subtext: 'Média de R$/hora trabalhada',
        icon: <Clock size={22} className="icon-best-day" />,
        bgClass: 'card-purple'
      },
      {
        title: 'Tempo Médio',
        value: kpis.tempoMedioEstudoMinutos > 0 ? `${Math.round(kpis.tempoMedioEstudoMinutos)} min` : '0 min',
        subtext: 'Duração média por estudo',
        icon: <Clock size={22} className="icon-best-month" />,
        bgClass: 'card-indigo'
      },
      {
        title: 'Estudos por Dia',
        value: kpis.estudosPorDia > 0 ? `${kpis.estudosPorDia.toFixed(1)}` : '0',
        subtext: 'Média de estudos por dia ativo',
        icon: <Calendar size={22} className="icon-pending" />,
        bgClass: 'card-pink'
      },
      {
        title: 'Projeção Mensal',
        value: kpis.projecaoMensalBRL > 0 ? formatBRL2(kpis.projecaoMensalBRL) : 'R$ 0,00',
        subtext: 'Estimativa baseada no ritmo atual',
        icon: <TrendingUp size={22} className="icon-average" />,
        bgClass: 'card-orange'
      }
    ];

    return (
      <div className="analytics-layout animate-fade-in">
        {/* Cards de Destaque de Eficiência */}
        <div className="kpi-grid">
          {efficiencyCards.map((card, idx) => (
            <div 
              key={idx} 
              className="kpi-card glass-panel spring-click"
              onMouseMove={handleMouseMove}
            >
              <div className="kpi-card-header">
                <span className="kpi-card-title">{card.title}</span>
                <div className={`kpi-card-icon-container ${card.bgClass}`}>
                  {card.icon}
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{card.value}</span>
                <span className="kpi-card-subtext">{card.subtext}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="charts-grid">
          {/* Gráfico 1: Ganho por Hora Mensal */}
          <div className="chart-card glass-panel main-chart" onMouseMove={handleMouseMove}>
            <div className="chart-header">
              <div className="chart-header-left">
                <TrendingUp size={18} className="chart-title-icon" />
                <h3>Evolução de Ganhos por Hora</h3>
              </div>
              <span className="chart-subtitle">Valor médio por hora trabalhada a cada mês</span>
            </div>
            <div className="chart-container">
              {!chartsData.eficienciaMensal || chartsData.eficienciaMensal.length === 0 ? (
                <div className="no-data-placeholder">Nenhum dado de duração registrado nos estudos.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartsData.eficienciaMensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEficMensal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `R$ ${val}`} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip prefix="R$ " />} cursor={{ stroke: 'var(--accent-color)', strokeWidth: 1 }} />
                    <Area 
                      type="monotone" 
                      dataKey="rpHora" 
                      name="R$/Hora" 
                      stroke="var(--accent-color)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorEficMensal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico 2: Rentabilidade por Faixa Horária */}
          <div className="chart-card glass-panel" onMouseMove={handleMouseMove}>
            <div className="chart-header">
              <div className="chart-header-left">
                <Clock size={18} className="chart-title-icon" />
                <h3>Rentabilidade por Faixa Horária</h3>
              </div>
              <span className="chart-subtitle">Valor de R$/hora médio gerado por faixa horária de início</span>
            </div>
            <div className="chart-container">
              {!chartsData.faixaHorariaEficiencia || chartsData.faixaHorariaEficiencia.length === 0 ? (
                <div className="no-data-placeholder">Nenhum dado por faixa horária disponível.</div>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={chartsData.faixaHorariaEficiencia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `R$ ${val}`}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip prefix="R$ " />} cursor={{ fill: 'rgba(120, 120, 128, 0.08)' }} />
                    <Bar dataKey="rpHora" name="R$/Hora Estimado" fill="var(--color-approved)" radius={[4, 4, 0, 0]}>
                      {chartsData.faixaHorariaEficiencia.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rpHora > 0 ? 'var(--color-approved)' : 'var(--border-color)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Estudos Eficientes */}
        <div className="chart-card glass-panel top-studies-card">
          <div className="chart-header">
            <div className="chart-header-left">
              <CheckCircle size={18} className="chart-title-icon" />
              <h3>Top 5 Estudos Mais Eficientes</h3>
            </div>
            <span className="chart-subtitle">Estudos com maior rendimento por hora trabalhada</span>
          </div>
          <div className="chart-container" style={{ overflowX: 'auto', padding: '10px' }}>
            {chartsData.topEstudosEficientes && chartsData.topEstudosEficientes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px' }}>Estudo</th>
                    <th style={{ padding: '8px' }}>Data</th>
                    <th style={{ padding: '8px' }}>Duração</th>
                    <th style={{ padding: '8px' }}>Ganho Total</th>
                    <th style={{ padding: '8px', color: 'var(--accent-color)' }}>R$/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {chartsData.topEstudosEficientes.map((estudo, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(120, 120, 128, 0.1)' }}>
                      <td style={{ padding: '10px 8px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{estudo.study}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{estudo.data}</td>
                      <td style={{ padding: '10px 8px' }}>{Math.round(estudo.duracao)} min</td>
                      <td style={{ padding: '10px 8px' }}>R$ {estudo.valor.toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: 'var(--accent-color)' }}>R$ {estudo.rpHora.toFixed(2)}/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data-placeholder">Nenhum dado de eficiência disponível.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ABA DE ANALYTICS (Temporal / Detalhado)
  const formatBRL2 = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const temporalCards = [
    {
      title: 'Mês Atual',
      value: kpis.currentMonthEarnings > 0 ? formatBRL2(kpis.currentMonthEarnings) : 'R$ 0,00',
      subtext: 'Ganhos acumulados no mês vigente',
      icon: <Calendar size={22} className="icon-best-day" />,
      bgClass: 'card-pink'
    },
    {
      title: 'Média Diária',
      value: kpis.mediaDiariaBRL > 0 ? formatBRL2(kpis.mediaDiariaBRL) : 'R$ 0,00',
      subtext: 'Média por dia com tarefas',
      icon: <Clock size={22} className="icon-pending" />,
      bgClass: 'card-purple'
    },
    {
      title: 'Média Mensal',
      value: kpis.mediaMensalBRL > 0 ? formatBRL2(kpis.mediaMensalBRL) : 'R$ 0,00',
      subtext: 'Média por mês ativo',
      icon: <DollarSign size={22} className="icon-average" />,
      bgClass: 'card-orange'
    }
  ];

  return (
    <div className="analytics-layout animate-fade-in">
      {/* Cards de Destaque Temporal */}
      <div className="kpi-grid">
        {temporalCards.map((card, idx) => (
          <div 
            key={idx} 
            className="kpi-card glass-panel spring-click"
            onMouseMove={handleMouseMove}
          >
            <div className="kpi-card-header">
              <span className="kpi-card-title">{card.title}</span>
              <div className={`kpi-card-icon-container ${card.bgClass}`}>
                {card.icon}
              </div>
            </div>
            <div className="kpi-card-body">
              <span className="kpi-card-value">{card.value}</span>
              <span className="kpi-card-subtext">{card.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {/* Gráfico Mensal */}
        <div className="chart-card glass-panel main-chart" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <TrendingUp size={18} className="chart-title-icon" />
              <h3>Rendimento Mensal</h3>
            </div>
            <span className="chart-subtitle">Soma mensal de ganhos aprovados</span>
          </div>
          <div className="chart-container">
            {chartsData.mensal.length === 0 ? (
              <div className="no-data-placeholder">Nenhum ganho mensal registrado ainda.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartsData.mensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `R$ ${val}`} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(120, 120, 128, 0.08)' }} />
                  <Bar dataKey="valor" name="Ganhos no Mês" radius={[8, 8, 0, 0]}>
                    {chartsData.mensal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="var(--accent-color)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico por Dia da Semana */}
        <div className="chart-card glass-panel" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <Calendar size={18} className="chart-title-icon" />
              <h3>Atividade por Dia da Semana</h3>
            </div>
            <span className="chart-subtitle">Volume de estudos concluídos/aprovados</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={chartsData.diaSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip prefix="" />} cursor={{ fill: 'rgba(120, 120, 128, 0.08)' }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="Total Concluídos" fill="var(--border-hover)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Aprovados" fill="var(--color-approved)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráficos Horários e Distribuições */}
      <div className="analytics-equal-grid">
        {/* Gráfico 1: Distribuição Horária */}
        <div className="chart-card glass-panel hourly-chart" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <Clock size={18} className="chart-title-icon" />
              <h3>Volume de Estudos por Faixa Horária</h3>
            </div>
            <span className="chart-subtitle">Horário de início das pesquisas realizadas</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={chartsData.faixaHoraria} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip prefix="" />} cursor={{ fill: 'rgba(120, 120, 128, 0.08)' }} />
                <Bar dataKey="approved" name="Estudos Aprovados" fill="var(--accent-color)" radius={[4, 4, 0, 0]}>
                  {chartsData.faixaHoraria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.approved > 0 ? 'var(--accent-color)' : 'var(--border-color)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Dia da Semana e Período */}
        <div className="chart-card glass-panel hourly-chart" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <Calendar size={18} className="chart-title-icon" />
              <h3>Distribuição de Estudos por Dia e Período</h3>
            </div>
            <span className="chart-subtitle">Volume de tarefas por período do dia e dia da semana</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={chartsData.diaSemanaPeriodo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip prefix="" />} cursor={{ fill: 'rgba(120, 120, 128, 0.08)' }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Madrugada" name="Madrugada (00h-06h)" stackId="a" fill="#5e5ce6" />
                <Bar dataKey="Manhã" name="Manhã (06h-12h)" stackId="a" fill="#30d158" />
                <Bar dataKey="Tarde" name="Tarde (12h-18h)" stackId="a" fill="#ff9f0a" />
                <Bar dataKey="Noite" name="Noite (18h-00h)" stackId="a" fill="#0a84ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
