import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Percent, Calendar, TrendingUp } from 'lucide-react';
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

  const cards = [
    {
      title: 'Ganhos Aprovados',
      value: formatBRL(kpis.ganhosAprovadosBRL),
      subtext: `Total de ${kpis.totalAprovados} estudos aprovados`,
      icon: <CheckCircle size={22} className="icon-approved" />,
      bgClass: 'card-green'
    },
    {
      title: 'Ganhos Hoje',
      value: formatBRL(kpis.ganhosHojeBRL),
      subtext: `USD: $${kpis.ganhosHojeOriginalUSD.toFixed(2)} • GBP: £${kpis.ganhosHojeOriginalGBP.toFixed(2)}`,
      icon: <Calendar size={22} className="icon-today" />,
      bgClass: 'card-blue'
    },
    {
      title: 'Valor Represado',
      value: formatBRL(kpis.valorRepresadoBRL),
      subtext: `${kpis.totalEmReview} estudos em revisão`,
      icon: <Clock size={22} className="icon-pending" />,
      bgClass: 'card-purple'
    },
    {
      title: 'Média por Estudo',
      value: formatBRL(kpis.mediaPorEstudoBRL),
      subtext: 'Valor médio por envio aprovado',
      icon: <DollarSign size={22} className="icon-average" />,
      bgClass: 'card-orange'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${(kpis.taxaAprovacao * 100).toFixed(1)}%`,
      subtext: `Rejeitados: ${kpis.totalRejeitados} • Retornados: ${kpis.totalRetornados}`,
      icon: <Percent size={22} className="icon-percent" />,
      bgClass: 'card-teal'
    },
    {
      title: 'Melhor Dia',
      value: kpis.melhorDiaBRL > 0 ? formatBRL(kpis.melhorDiaBRL) : 'R$ 0,00',
      subtext: kpis.melhorDiaLabel !== '-' ? kpis.melhorDiaLabel.split(' • ')[0] : 'Sem registro',
      icon: <Calendar size={22} className="icon-best-day" />,
      bgClass: 'card-pink'
    },
    {
      title: 'Melhor Mês',
      value: kpis.melhorMesBRL > 0 ? formatBRL(kpis.melhorMesBRL) : 'R$ 0,00',
      subtext: kpis.melhorMesLabel !== '-' ? kpis.melhorMesLabel.split(' • ')[0].toUpperCase() : 'Sem registro',
      icon: <TrendingUp size={22} className="icon-best-month" />,
      bgClass: 'card-indigo'
    },
    {
      title: 'Projeção (Fim do Mês)',
      value: kpis.projecaoMensalBRL > 0 ? formatBRL(kpis.projecaoMensalBRL) : 'R$ 0,00',
      subtext: 'Projeção baseada na média diária atual',
      bgClass: 'card-green'
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
