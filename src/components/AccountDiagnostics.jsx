import {
  Activity,
  AlertTriangle,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sliders,
  Wallet
} from 'lucide-react';
import './AccountDiagnostics.css';

function formatGBPFromPence(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format((value || 0) / 100);
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

export default function AccountDiagnostics({ kpis, prolificAccount, onSettingsOpen }) {
  if (!kpis) return null;

  const accountState = getAccountState(prolificAccount);
  const healthScore = buildHealthScore(prolificAccount, kpis);
  const minWithdrawPence = prolificAccount?.minWithdraw || 500;
  const balancePence = prolificAccount?.balance || 0;
  const cashoutReady = prolificAccount ? balancePence >= minWithdrawPence : false;
  const cashoutDisabled = prolificAccount
    ? prolificAccount.canCashoutEnabled === false || prolificAccount.canInstantCashoutEnabled === false
    : false;
  const cashoutValue = prolificAccount
    ? cashoutDisabled
      ? 'Pausado'
      : cashoutReady
        ? 'Liberado'
        : `Faltam ${formatGBPFromPence(minWithdrawPence - balancePence)}`
    : 'Sem dado';
  const cashoutMeta = prolificAccount
    ? cashoutReady
      ? 'mínimo atingido'
      : `${formatGBPFromPence(balancePence)} / ${formatGBPFromPence(minWithdrawPence)}`
    : 'conecte a API';

  const signals = [
    {
      icon: prolificAccount?.banned ? LockKeyhole : ShieldCheck,
      label: 'Bloqueio',
      value: prolificAccount ? (prolificAccount.banned ? 'Detectado' : 'OK') : 'Sem dado',
      meta: prolificAccount ? (prolificAccount.banned ? 'ação necessária' : 'sem restrição') : 'conecte a conta',
      tone: prolificAccount?.banned ? 'danger' : prolificAccount ? 'healthy' : 'unknown'
    },
    {
      icon: Clock3,
      label: 'Espera',
      value: prolificAccount ? (prolificAccount.onHold ? 'Em espera' : 'OK') : 'Sem dado',
      meta: prolificAccount ? (prolificAccount.onHold ? 'convites reduzidos' : 'sem hold') : 'conecte a conta',
      tone: prolificAccount?.onHold ? 'warning' : prolificAccount ? 'healthy' : 'unknown'
    },
    {
      icon: Activity,
      label: 'Distribuição',
      value: prolificAccount ? (prolificAccount.frozen ? 'Pausada' : 'Ativa') : 'Sem dado',
      meta: prolificAccount ? (prolificAccount.frozen ? 'varia ao longo do dia' : 'recebendo estudos') : 'conecte a conta',
      tone: prolificAccount?.frozen ? 'idle' : prolificAccount ? 'healthy' : 'unknown'
    },
    {
      icon: Wallet,
      label: 'Saque',
      value: cashoutValue,
      meta: cashoutMeta,
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
              <div>
                <span>{signal.label}</span>
                <small>{signal.meta}</small>
              </div>
              <strong>{signal.value}</strong>
            </div>
          );
        })}
      </div>

      {!prolificAccount && (
        <button type="button" className="connect-account-btn spring-click" onClick={onSettingsOpen}>
          <Sliders size={15} />
          <span>Conectar conta</span>
        </button>
      )}
    </section>
  );
}
