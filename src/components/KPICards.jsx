import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Percent, Calendar, TrendingUp, Info } from 'lucide-react';
import './KPICards.css';

// Componente de contagem animada
function AnimatedValue({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    // Se é um número, anima
    const numFrom = typeof from === 'string' ? parseFloat(from.replace(/[^\d.,-]/g, '').replace(',', '.')) : from;
    const numTo = typeof to === 'string' ? parseFloat(to.replace(/[^\d.,-]/g, '').replace(',', '.')) : to;

    if (!isNaN(numFrom) && !isNaN(numTo) && numFrom !== numTo) {
      const duration = 800;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = numFrom + (numTo - numFrom) * eased;
        
        setDisplay(typeof to === 'string' ? to : current);
        
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplay(value);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setDisplay(value);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return <>{typeof display === 'number' ? `${prefix}${display.toFixed(2)}${suffix}` : value}</>;
}

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
      title: 'Ganhos Aprovados',
      value: formatBRL(kpis.ganhosAprovadosBRL),
      subtext: `${kpis.totalAprovados} estudos aprovados de ${kpis.totalEstudos} enviados`,
      icon: <CheckCircle size={22} className="icon-approved" />,
      bgClass: 'card-green',
      tooltip: 'Total acumulado de todos os estudos aprovados pelos pesquisadores, convertido para R$ pela taxa de câmbio configurada. Inclui recompensas e bônus.'
    },
    {
      title: 'Ganhos Hoje',
      value: formatBRL(kpis.ganhosHojeBRL),
      subtext: `USD: $${kpis.ganhosHojeOriginalUSD.toFixed(2)} • GBP: £${kpis.ganhosHojeOriginalGBP.toFixed(2)}`,
      icon: <Calendar size={22} className="icon-today" />,
      bgClass: 'card-blue',
      tooltip: 'Quanto você ganhou hoje em estudos já aprovados. Mostra também os valores originais em cada moeda antes da conversão.'
    },
    {
      title: 'Aguardando Revisão',
      value: formatBRL(kpis.valorRepresadoBRL),
      subtext: `${kpis.totalEmReview} ${kpis.totalEmReview === 1 ? 'estudo aguardando' : 'estudos aguardando'} o pesquisador aprovar`,
      icon: <Clock size={22} className="icon-pending" />,
      bgClass: 'card-purple',
      tooltip: 'Valor de estudos que você completou, mas o pesquisador ainda não aprovou. Isso é normal — geralmente leva até 14 dias. Não é dinheiro bloqueado.'
    },
    {
      title: 'Média por Estudo',
      value: formatBRL(kpis.mediaPorEstudoBRL),
      subtext: `Ganho médio por estudo aprovado (em R$)`,
      icon: <DollarSign size={22} className="icon-average" />,
      bgClass: 'card-orange',
      tooltip: 'Quanto você ganha em média por estudo aprovado. Calculado como: total de ganhos aprovados ÷ número de estudos aprovados.'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${(kpis.taxaAprovacao * 100).toFixed(1)}%`,
      subtext: `Rejeitados: ${kpis.totalRejeitados} • Retornados: ${kpis.totalRetornados}`,
      icon: <Percent size={22} className="icon-percent" />,
      bgClass: 'card-teal',
      tooltip: 'Percentual de estudos aprovados em relação ao total enviado (excluindo retornados). Acima de 95% é considerado excelente pelo Prolific.'
    },
    {
      title: 'Projeção (Fim do Mês)',
      value: kpis.projecaoMensalBRL > 0 ? formatBRL(kpis.projecaoMensalBRL) : 'R$ 0,00',
      subtext: `Baseada na média diária de ${formatBRL(kpis.currentMonthEarnings / Math.max(1, new Date().getDate()))}`,
      bgClass: 'card-green',
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
    <div className="kpi-grid animate-fade-in">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="kpi-card glass-panel spring-click"
          onMouseMove={handleMouseMove}
          style={{ animationDelay: `${idx * 0.06}s` }}
        >
          <div className="kpi-card-header">
            <span className="kpi-card-title">
              {card.title}
            </span>
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
          <div className="kpi-card-body">
            <span className="kpi-card-value">{card.value}</span>
            <span className="kpi-card-subtext">{card.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
