import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, Clock, Calendar, CheckCircle, DollarSign } from 'lucide-react';
import './ChartsSection.css';
import './KPICards.css';

// Cores base para os gráficos matching com o CSS
const COLOR_APPROVED = '#34c759';
const COLOR_PENDING = '#5856d6';
const COLOR_RETURNED = '#8e8e93';
const COLOR_REJECTED = '#ff3b30';
const COLOR_OTHER = '#ff9500';

const STATUS_COLORS = {
  'Aprovado': COLOR_APPROVED,
  'Em review': COLOR_PENDING,
  'Retornado': COLOR_RETURNED,
  'Rejeitado': COLOR_REJECTED,
  'Outro': COLOR_OTHER
};

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

export default function ChartsSection({ activeTab, chartsData, kpis }) {
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
    return (
      <div className="charts-grid animate-fade-in">
        {/* Gráfico Principal: Ganhos Acumulados */}
        <div className="chart-card glass-panel main-chart" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <TrendingUp size={18} className="chart-title-icon" />
              <h3>Curva de Ganhos (Acumulado)</h3>
            </div>
            <span className="chart-subtitle">Progresso em BRL ao longo do tempo</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartsData.acumulado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="formattedDate" 
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
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="ganhoAcumulado" 
                  name="Total Acumulado"
                  stroke="var(--accent-color)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAcumulado)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Secundário: Proporção de Status */}
        <div className="chart-card glass-panel donut-chart" onMouseMove={handleMouseMove}>
          <div className="chart-header">
            <div className="chart-header-left">
              <CheckCircle size={18} className="chart-title-icon" />
              <h3>Distribuição de Status</h3>
            </div>
            <span className="chart-subtitle">Proporção dos envios cadastrados</span>
          </div>
          <div className="chart-container donut-container">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={chartsData.status}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartsData.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip prefix="" />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="donut-legend">
              {chartsData.status.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-marker" style={{ backgroundColor: STATUS_COLORS[item.name] }}></div>
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-val">{item.value} ({((item.value / kpis.totalEstudos) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
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
      title: 'Melhor Dia Histórico',
      value: kpis.melhorDiaBRL > 0 ? formatBRL2(kpis.melhorDiaBRL) : 'R$ 0,00',
      subtext: kpis.melhorDiaLabel !== '-' ? `Recorde em ${kpis.melhorDiaLabel.split(' • ')[0]}` : 'Sem registro',
      icon: <Calendar size={22} className="icon-best-day" />,
      bgClass: 'card-pink'
    },
    {
      title: 'Melhor Mês',
      value: kpis.melhorMesBRL > 0 ? formatBRL2(kpis.melhorMesBRL) : 'R$ 0,00',
      subtext: kpis.melhorMesLabel !== '-' ? `Recorde em ${kpis.melhorMesLabel.split(' • ')[0].toUpperCase()}` : 'Sem registro',
      icon: <TrendingUp size={22} className="icon-best-month" />,
      bgClass: 'card-indigo'
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
              <ResponsiveContainer width="100%" height={320}>
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
                  <Tooltip content={<CustomTooltip />} />
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
            <ResponsiveContainer width="100%" height={300}>
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
                <Tooltip content={<CustomTooltip prefix="" />} />
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
            <ResponsiveContainer width="100%" height={260}>
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
                <Tooltip content={<CustomTooltip prefix="" />} />
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
            <ResponsiveContainer width="100%" height={260}>
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
                <Tooltip content={<CustomTooltip prefix="" />} />
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
