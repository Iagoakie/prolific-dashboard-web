import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import './AccountDiagnostics.css';

function formatBRL(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits
  }).format(value || 0);
}

function formatGBPFromPence(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format((value || 0) / 100);
}

function asBRLFromPence(value, gbpRate) {
  return ((value || 0) / 100) * (gbpRate || 0);
}

function getAccountState(account) {
  if (!account) {
    return {
      tone: 'unknown',
      title: 'Conta não conectada',
      summary: 'Conecte o Prolific para confirmar espera, bloqueio, saque e distribuição de estudos.',
      badge: 'Diagnóstico parcial'
    };
  }

  if (account.banned) {
    return {
      tone: 'danger',
      title: 'Conta bloqueada',
      summary: 'O perfil sincronizado indica banimento. Vale conferir o suporte e o e-mail da Prolific.',
      badge: 'Ação necessária'
    };
  }

  if (account.onHold || String(account.status || '').toUpperCase().includes('HOLD')) {
    return {
      tone: 'warning',
      title: 'Conta em espera',
      summary: 'A API retornou sinal de hold. Isso pode reduzir ou interromper convites para estudos.',
      badge: 'Em espera'
    };
  }

  if (account.frozen && account.status === 'OK') {
    return {
      tone: 'idle',
      title: 'Sem estudos no momento',
      summary: 'A conta está OK, mas a distribuição aparece pausada agora. Isso costuma variar ao longo do dia.',
      badge: 'Monitorando'
    };
  }

  if (account.frozen) {
    return {
      tone: 'warning',
      title: 'Distribuição congelada',
      summary: 'O perfil sincronizado indica distribuição de estudos congelada. Verifique pendências no Prolific.',
      badge: 'Atenção'
    };
  }

  return {
    tone: 'healthy',
    title: 'Conta ativa',
    summary: 'Nenhum sinal de espera, bloqueio ou congelamento apareceu nos dados sincronizados.',
    badge: 'Tempo real'
  };
}

function buildHealthScore(account, kpis) {
  if (!kpis) return 0;
  let score = 86;

  if (account) score += 6;
  if (account?.banned) score -= 70;
  if (account?.onHold) score -= 45;
  if (account?.frozen) score -= account.status === 'OK' ? 12 : 28;

  if (kpis.totalAprovados + kpis.totalRejeitados > 0) {
    const approval = kpis.taxaAprovacao || 0;
    if (approval >= 0.98) score += 6;
    else if (approval < 0.95) score -= 16;
  }

  if ((kpis.oldestReviewDays || 0) >= 14) score -= 8;
  if ((kpis.ganhosHojeBRL || 0) > 0) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function AccountDiagnostics({ kpis, prolificAccount, exchangeRates, onSettingsOpen }) {
  if (!kpis) return null;

  const accountState = getAccountState(prolificAccount);
  const healthScore = buildHealthScore(prolificAccount, kpis);
  const balanceBRL = asBRLFromPence(prolificAccount?.balance, exchangeRates?.gbp);
  const pendingBRL = asBRLFromPence(prolificAccount?.pendingBalance, exchangeRates?.gbp);
  const minWithdrawPence = prolificAccount?.minWithdraw || 500;
  const balancePence = prolificAccount?.balance || 0;
  const cashoutReady = prolificAccount ? balancePence >= minWithdrawPence : false;
  const cashoutDisabled = prolificAccount
    ? prolificAccount.canCashoutEnabled === false || prolificAccount.canInstantCashoutEnabled === false
    : false;
  const reviewCount = kpis.totalEmReview || 0;
  const reviewValue = kpis.valorRepresadoBRL || 0;
  const approvalPercent = ((kpis.taxaAprovacao || 0) * 100).toFixed(1);
  const oldestReviewText = reviewCount > 0
    ? `${kpis.oldestReviewDays ?? 0} ${kpis.oldestReviewDays === 1 ? 'dia' : 'dias'}`
    : 'Sem fila';

  const signals = [
    {
      icon: prolificAccount?.banned ? LockKeyhole : ShieldCheck,
      label: 'Bloqueio',
      value: prolificAccount ? (prolificAccount.banned ? 'Detectado' : 'Não detectado') : 'Sem dado',
      tone: prolificAccount?.banned ? 'danger' : prolificAccount ? 'healthy' : 'unknown'
    },
    {
      icon: Clock3,
      label: 'Espera',
      value: prolificAccount ? (prolificAccount.onHold ? 'Em espera' : 'Não detectado') : 'Sem dado',
      tone: prolificAccount?.onHold ? 'warning' : prolificAccount ? 'healthy' : 'unknown'
    },
    {
      icon: Activity,
      label: 'Distribuição',
      value: prolificAccount ? (prolificAccount.frozen ? 'Pausada' : 'Ativa') : 'Sem dado',
      tone: prolificAccount?.frozen ? 'idle' : prolificAccount ? 'healthy' : 'unknown'
    },
    {
      icon: Wallet,
      label: 'Saque',
      value: prolificAccount
        ? cashoutDisabled
          ? 'Indisponível'
          : cashoutReady
            ? 'Liberado'
            : `Falta ${formatGBPFromPence(minWithdrawPence - balancePence)}`
        : 'Sem dado',
      tone: cashoutDisabled ? 'warning' : cashoutReady ? 'healthy' : prolificAccount ? 'idle' : 'unknown'
    }
  ];

  return (
    <section className={`account-diagnostics-panel glass-panel account-state-${accountState.tone}`}>
      <div className="account-diagnostics-main">
        <div className="account-diagnostics-summary">
          <div className="account-diagnostics-icon">
            {accountState.tone === 'danger' ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div className="account-diagnostics-copy">
            <div className="account-diagnostics-title-row">
              <h2>Diagnóstico da conta</h2>
              <span className={`account-state-badge ${accountState.tone}`}>{accountState.badge}</span>
            </div>
            <strong>{accountState.title}</strong>
            <p>{accountState.summary}</p>
          </div>
        </div>

        <div className="account-health-score" aria-label={`Score de saúde ${healthScore} de 100`}>
          <span className="health-score-value">{healthScore}</span>
          <span className="health-score-label">score</span>
        </div>
      </div>

      <div className="account-signal-strip">
        {signals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div className={`account-signal ${signal.tone}`} key={signal.label}>
              <Icon size={15} />
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
            </div>
          );
        })}
      </div>

      <div className="account-diagnostics-grid">
        <div className="diagnostic-metric-row">
          <div className="diagnostic-metric-icon approved"><BadgeCheck size={17} /></div>
          <div>
            <span>Ganhos aprovados</span>
            <strong>{formatBRL(kpis.ganhosAprovadosBRL)}</strong>
            <small>{kpis.totalAprovados} aprovados de {kpis.totalEstudos} estudos</small>
          </div>
        </div>

        <div className="diagnostic-metric-row">
          <div className="diagnostic-metric-icon pending"><Clock3 size={17} /></div>
          <div>
            <span>Aguardando revisão</span>
            <strong>{formatBRL(reviewValue)}</strong>
            <small>{reviewCount} estudos; mais antigo: {oldestReviewText}</small>
          </div>
        </div>

        <div className="diagnostic-metric-row">
          <div className="diagnostic-metric-icon growth"><TrendingUp size={17} /></div>
          <div>
            <span>Ritmo do mês</span>
            <strong>{formatBRL(kpis.currentMonthEarnings)}</strong>
            <small>Projeção: {formatBRL(kpis.projecaoMensalBRL)}</small>
          </div>
        </div>

        <div className="diagnostic-metric-row">
          <div className="diagnostic-metric-icon quality"><CheckCircle2 size={17} /></div>
          <div>
            <span>Qualidade</span>
            <strong>{approvalPercent}%</strong>
            <small>{kpis.totalRejeitados} rejeitados; {formatBRL(kpis.reaisPorHora, 1)}/h</small>
          </div>
        </div>
      </div>

      <div className="account-diagnostics-footer">
        <div className="community-status-inline">
          <Radar size={15} />
          <span>ProlificTea ativos</span>
          <strong>--</strong>
          <small>fonte não conectada</small>
        </div>

        {prolificAccount ? (
          <div className="account-balance-inline">
            <Wallet size={15} />
            <span>Saldo Prolific</span>
            <strong>{formatGBPFromPence(prolificAccount.balance)} / {formatBRL(balanceBRL)}</strong>
            <small>Pendente: {formatGBPFromPence(prolificAccount.pendingBalance)} / {formatBRL(pendingBRL)}</small>
          </div>
        ) : (
          <button type="button" className="connect-account-btn spring-click" onClick={onSettingsOpen}>
            <Sliders size={15} />
            <span>Conectar conta para diagnóstico completo</span>
          </button>
        )}

        <div className="community-status-inline compact">
          <Users size={15} />
          <span>Janela boa</span>
          <strong>{kpis.estudosPorDia > 0 ? `${kpis.estudosPorDia.toFixed(1)}/dia` : '--'}</strong>
          <small>média histórica</small>
        </div>
      </div>
    </section>
  );
}
