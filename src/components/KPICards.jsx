import { useState } from 'react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { ArrowUpRight, Calendar, Clock, TrendingUp, ShieldCheck, Target, Info, Wallet } from 'lucide-react';
import './KPICards.css';

export default function KPICards({ kpis }) {
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const [activeTooltip, setActiveTooltip] = useState(null);

  const cards = [
    {
      title: 'Ganhos aprovados',
      value: formatBRL(kpis.ganhosAprovadosBRL),
      subtext: `${kpis.totalAprovados} estudos aprovados de ${kpis.totalEstudos} enviados`,
      icon: <Wallet size={18} className="icon-approved" />,
      bgClass: 'card-green',
      label: 'Saldo consolidado',
      tooltip: 'Total acumulado de todos os estudos aprovados pelos pesquisadores, convertido para R$ pela taxa de câmbio configurada. Inclui recompensas e bônus.'
    },
    {
      title: 'Ganhos hoje',
      value: formatBRL(kpis.ganhosHojeBRL),
      subtext: `USD: $${kpis.ganhosHojeOriginalUSD.toFixed(2)} • GBP: £${kpis.ganhosHojeOriginalGBP.toFixed(2)}`,
      icon: <Calendar size={18} className="icon-today" />,
      bgClass: 'card-blue',
      label: 'Movimento diário',
      tooltip: 'Quanto você ganhou hoje em estudos já aprovados. Mostra também os valores originais em cada moeda antes da conversão.'
    },
    {
      title: 'Aguardando revisão',
      value: formatBRL(kpis.valorRepresadoBRL),
      subtext: `${kpis.totalEmReview} ${kpis.totalEmReview === 1 ? 'estudo aguardando' : 'estudos aguardando'} o pesquisador aprovar`,
      icon: <Clock size={18} className="icon-pending" />,
      bgClass: 'card-green',
      label: 'Em processamento',
      tooltip: 'Valor de estudos que você completou, mas o pesquisador ainda não aprovou. Isso é normal — geralmente leva até 14 dias. Não é dinheiro bloqueado.'
    },
    {
      title: 'Média por estudo',
      value: formatBRL(kpis.mediaPorEstudoBRL),
      subtext: `Ganho médio por estudo aprovado (em R$)`,
      icon: <TrendingUp size={18} className="icon-average" />,
      bgClass: 'card-blue',
      label: 'Ticket médio',
      tooltip: 'Quanto você ganha em média por estudo aprovado. Calculado como: total de ganhos aprovados ÷ número de estudos aprovados.'
    },
    {
      title: 'Taxa de aprovação',
      value: `${(kpis.taxaAprovacao * 100).toFixed(1)}%`,
      subtext: `Rejeitados: ${kpis.totalRejeitados} • Retornados: ${kpis.totalRetornados}`,
      icon: <ShieldCheck size={18} className="icon-percent" />,
      bgClass: 'card-purple',
      label: 'Qualidade da conta',
      tooltip: 'Percentual de estudos aprovados em relação ao total enviado (excluindo retornados). Acima de 95% é considerado excelente pelo Prolific.'
    },
    {
      title: 'Projeção (fim do mês)',
      value: kpis.projecaoMensalBRL > 0 ? formatBRL(kpis.projecaoMensalBRL) : 'R$ 0,00',
      subtext: `Baseada na média diária de ${formatBRL(kpis.currentMonthEarnings / Math.max(1, new Date().getDate()))}`,
      icon: <Target size={18} className="icon-projection" />,
      bgClass: 'card-purple',
      label: 'Forecast mensal',
      tooltip: 'Estimativa de quanto você terá ao fim deste mês. Calculada com sua média diária do mês atual × dias restantes + o que já ganhou.'
    }
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="kpi-grid animate-fade-in">
        {cards.map((card, idx) => (
          <m.article
          key={card.title}
          className={`kpi-card metric-card metric-card-${idx} ${idx === 0 ? 'metric-card-featured' : ''}`}
          onMouseMove={handleMouseMove}
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: idx * 0.055, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: idx === 0 ? -4 : -3 }}
        >
          <div className="kpi-card-header">
            <div className="metric-heading">
              <span className="metric-label">{card.label}</span>
              <span className="kpi-card-title">{card.title}</span>
            </div>
            <div className="kpi-card-actions">
              {card.icon && (
                <div className={`kpi-card-icon-container ${card.bgClass}`}>
                  {card.icon}
                </div>
              )}
              {card.tooltip && (
                <button
                  className="kpi-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(activeTooltip === idx ? null : idx);
                  }}
                  onMouseEnter={() => setActiveTooltip(idx)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  aria-label={`Informações sobre ${card.title}`}
                >
                  <Info size={14} />
                  {activeTooltip === idx && (
                    <div className="kpi-tooltip-popover">
                      <div className="kpi-tooltip-arrow"></div>
                      {card.tooltip}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{card.value}</span>
            <span className="kpi-card-subtext">{card.subtext}</span>
            {idx === 0 && (
              <div className="featured-metric-footer">
                <span className="featured-metric-chip">
                  <ArrowUpRight size={13} />
                  {(kpis.taxaAprovacao * 100).toFixed(1)}% de aprovação
                </span>
                <svg className="featured-sparkline" viewBox="0 0 180 54" aria-hidden="true">
                  <defs>
                    <linearGradient id="featuredSparklineFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="featured-sparkline-fill" d="M2 48 C22 45, 24 39, 42 40 S66 31, 82 33 S107 22, 124 24 S146 10, 178 8 L178 54 L2 54 Z" />
                  <path className="featured-sparkline-line" d="M2 48 C22 45, 24 39, 42 40 S66 31, 82 33 S107 22, 124 24 S146 10, 178 8" />
                </svg>
              </div>
            )}
          </div>
          </m.article>
        ))}
      </div>
    </LazyMotion>
  );
}
