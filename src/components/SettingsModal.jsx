import React, { useState } from 'react';
import { X, RefreshCw, Save, Sliders, UploadCloud, Shield, Trash2, Key, User } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ 
  rates, 
  taxes, 
  onSave, 
  onSaveTaxes, 
  onClose, 
  exchangeSource, 
  lastExchangeFetch, 
  onFetchRates, 
  onFileUpload, 
  csvSource, 
  prolificAccount, 
  onSaveProlificData, 
  onClearProlificData,
  prolificUserId,
  prolificToken,
  prolificSyncing,
  onSyncProlific
}) {
  const [usd, setUsd] = useState(rates.usd);
  const [gbp, setGbp] = useState(rates.gbp);
  const [spread, setSpread] = useState(taxes?.spread || 0);
  const [iof, setIof] = useState(taxes?.iof || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prolific method tab: 'auto' or 'manual'
  const [prolificTab, setProlificTab] = useState(prolificUserId && prolificToken ? 'auto' : 'auto');

  // Prolific Automated configuration state
  const [userIdVal, setUserIdVal] = useState(prolificUserId || '');
  const [tokenVal, setTokenVal] = useState(prolificToken || '');
  const [syncStatus, setSyncStatus] = useState(null); // null, 'success', 'error'
  const [syncMsg, setSyncMsg] = useState('');

  // Prolific JSON paste state
  const [prolificJson, setProlificJson] = useState('');
  const [prolificParseStatus, setProlificParseStatus] = useState(null); // null, 'success', 'error'
  const [prolificParseMsg, setProlificParseMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      usd: parseFloat(usd) || 4.9128,
      gbp: parseFloat(gbp) || 6.6638
    }, 'manual');
    if (onSaveTaxes) {
      onSaveTaxes({
        spread: parseFloat(spread) || 0,
        iof: parseFloat(iof) || 0
      });
    }
    onClose();
  };

  const handleSync = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const result = await onFetchRates();
    setIsLoading(false);
    if (result) {
      setUsd(result.usd);
      setGbp(result.gbp);
    } else {
      setErrorMsg('Não foi possível obter a cotação em tempo real. Verifique sua conexão.');
    }
  };

  const handleReset = () => {
    setUsd(4.9128);
    setGbp(6.6638);
    setSpread(0);
    setIof(0);
    onSave({
      usd: 4.9128,
      gbp: 6.6638
    }, 'default');
    if (onSaveTaxes) {
      onSaveTaxes({ spread: 0, iof: 0 });
    }
  };

  const handleAutoSync = async () => {
    if (!userIdVal.trim() || !tokenVal.trim()) {
      setSyncStatus('error');
      setSyncMsg('Por favor, preencha o User ID e o Token.');
      return;
    }
    setSyncStatus(null);
    setSyncMsg('');
    const result = await onSyncProlific(userIdVal.trim(), tokenVal.trim());
    if (result.success) {
      setSyncStatus('success');
      setSyncMsg(`Sincronizado com sucesso! Olá, ${result.account.name || 'Pesquisador'}.`);
    } else {
      setSyncStatus('error');
      setSyncMsg(result.error || 'Erro na sincronização de dados.');
    }
  };

  const handleParseProlificJson = () => {
    if (!prolificJson.trim()) {
      setProlificParseStatus('error');
      setProlificParseMsg('Cole o JSON do seu perfil Prolific acima.');
      return;
    }
    const result = onSaveProlificData(prolificJson);
    if (result.success) {
      setProlificParseStatus('success');
      setProlificParseMsg(`Dados de "${result.account.name}" importados com sucesso!`);
      setProlificJson('');
    } else {
      setProlificParseStatus('error');
      setProlificParseMsg(`Erro ao interpretar JSON: ${result.error}`);
    }
  };

  const handleClearProlific = () => {
    onClearProlificData();
    setUserIdVal('');
    setTokenVal('');
    setProlificParseStatus(null);
    setProlificParseMsg('');
    setProlificJson('');
    setSyncStatus(null);
    setSyncMsg('');
  };

  const formatLastUpdated = () => {
    if (!prolificAccount?.lastUpdated) return null;
    try {
      return new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit' 
      }).format(new Date(prolificAccount.lastUpdated));
    } catch { return null; }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="settings-title-wrapper">
            <Sliders size={20} className="settings-title-icon" />
            <h3>Ajustes e Importação</h3>
          </div>
          <button className="close-btn spring-click" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          <p className="settings-desc">
            Defina as taxas cambiais para converter as recompensas originais em Libra (£) e Dólar ($) para Real (R$).
          </p>

          <div className="settings-status-box">
            {exchangeSource === 'api' && (
              <span className="status-badge success">
                🟢 Câmbio automático atualizado em tempo real ({lastExchangeFetch})
              </span>
            )}
            {exchangeSource === 'fallback' && (
              <span className="status-badge warning">
                ⚠️ Falha ao buscar cotação. Usando valores fixos do Power BI
              </span>
            )}
            {exchangeSource === 'default' && (
              <span className="status-badge info">
                ℹ️ Usando cotações fixas padrão do Power BI (4.91 / 6.66)
              </span>
            )}
            {exchangeSource === 'manual' && (
              <span className="status-badge manual">
                ✍️ Taxas ajustadas manualmente por você
              </span>
            )}
          </div>

          <button 
            type="button" 
            className="sync-rates-btn spring-click" 
            onClick={handleSync}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
            <span>{isLoading ? 'Sincronizando cotações...' : 'Sincronizar Câmbio em Tempo Real'}</span>
          </button>

          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <div className="ios-settings-group">
            <div className="ios-settings-row">
              <label htmlFor="gbp-rate">
                <span className="currency-flag-label">🇬🇧</span>
                <span>Libra Esterlina (GBP)</span>
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">£ 1.00 = R$</span>
                <input 
                  id="gbp-rate"
                  type="number" 
                  step="0.0001" 
                  value={gbp} 
                  onChange={(e) => setGbp(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="ios-settings-row">
              <label htmlFor="usd-rate">
                <span className="currency-flag-label">🇺🇸</span>
                <span>Dólar Americano (USD)</span>
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">$ 1.00 = R$</span>
                <input 
                  id="usd-rate"
                  type="number" 
                  step="0.0001" 
                  value={usd} 
                  onChange={(e) => setUsd(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>

          <div className="ios-settings-group" style={{ marginTop: '20px' }}>
            <div className="ios-settings-row">
              <label htmlFor="spread-rate">
                <span className="currency-flag-label">🏦</span>
                <span>Spread Bancário (%)</span>
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">%</span>
                <input 
                  id="spread-rate"
                  type="number" 
                  step="0.01" 
                  value={spread} 
                  onChange={(e) => setSpread(e.target.value)} 
                  placeholder="Ex: 2.00"
                />
              </div>
            </div>

            <div className="ios-settings-row">
              <label htmlFor="iof-rate">
                <span className="currency-flag-label">🧾</span>
                <span>IOF (%)</span>
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">%</span>
                <input 
                  id="iof-rate"
                  type="number" 
                  step="0.01" 
                  value={iof} 
                  onChange={(e) => setIof(e.target.value)} 
                  placeholder="Ex: 0.38"
                />
              </div>
            </div>
          </div>

          {/* Importação do CSV Consolidada */}
          <div className="ios-settings-group" style={{ marginTop: '20px' }}>
            <div className="ios-settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Importar Dados (CSV)</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {csvSource === 'uploaded' ? 'Usando CSV importado por você' : 'Usando conjunto de dados padrão'}
                </span>
              </div>
              
              <label className="upload-btn spring-click" style={{ 
                background: 'rgba(120, 120, 128, 0.08)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 12px', 
                borderRadius: '10px', 
                fontSize: '12px', 
                fontWeight: '600', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'var(--transition-smooth)'
              }}>
                <UploadCloud size={14} style={{ color: 'var(--text-secondary)' }} />
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
            </div>
          </div>

          {/* Integração Prolific API */}
          <div className="prolific-integration-section">
            <div className="prolific-section-header">
              <div className="prolific-section-title-row">
                <Shield size={16} className="prolific-section-icon" />
                <span className="prolific-section-title">Saúde da Conta Prolific</span>
              </div>
              <span className="prolific-section-desc">
                Monitore o status da conta Prolific de forma 100% automatizada e local.
              </span>
            </div>

            {prolificAccount && (
              <div className="prolific-current-status">
                <div className={`prolific-status-indicator ${prolificAccount.frozen ? 'frozen' : 'active'}`}>
                  <span>{prolificAccount.frozen ? '❄️' : '✅'}</span>
                  <span>{prolificAccount.frozen ? 'Distribuição Congelada' : 'Distribuição Ativa'}</span>
                </div>
                <div className="prolific-status-details">
                  <span>💰 £{(prolificAccount.balance / 100).toFixed(2)} disponível</span>
                  <span>⏳ £{(prolificAccount.pendingBalance / 100).toFixed(2)} represado</span>
                  {formatLastUpdated() && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      Atualizado em {formatLastUpdated()}
                    </span>
                  )}
                </div>
                <button 
                  type="button" 
                  className="prolific-clear-btn spring-click" 
                  onClick={handleClearProlific}
                >
                  <Trash2 size={12} />
                  <span>Desconectar e Limpar</span>
                </button>
              </div>
            )}

            {/* Segmented Control Method */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 10px 0' }}>
              <div className="segmented-control theme-segmented" style={{ width: '100%' }}>
                <button 
                  type="button" 
                  className={`segmented-button ${prolificTab === 'auto' ? 'active' : ''}`}
                  onClick={() => setProlificTab('auto')}
                  style={{ flex: 1, padding: '6px' }}
                >
                  Automático (API)
                </button>
                <button 
                  type="button" 
                  className={`segmented-button ${prolificTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setProlificTab('manual')}
                  style={{ flex: 1, padding: '6px' }}
                >
                  Manual (JSON)
                </button>
              </div>
            </div>

            {prolificTab === 'auto' && (
              <div className="prolific-tab-content auto-config-grid">
                <div className="prolific-input-wrapper">
                  <div className="prolific-input-field">
                    <User size={14} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="Prolific User ID (Ex: 697a685...)" 
                      value={userIdVal}
                      onChange={(e) => {
                        setUserIdVal(e.target.value);
                        setSyncStatus(null);
                      }}
                    />
                  </div>
                </div>

                <div className="prolific-input-wrapper" style={{ marginTop: '8px' }}>
                  <div className="prolific-input-field">
                    <Key size={14} className="input-icon" />
                    <input 
                      type="password" 
                      placeholder="Token de API Prolific..." 
                      value={tokenVal}
                      onChange={(e) => {
                        setTokenVal(e.target.value);
                        setSyncStatus(null);
                      }}
                    />
                  </div>
                </div>

                {syncMsg && (
                  <span className={`prolific-parse-feedback ${syncStatus}`} style={{ marginTop: '8px', display: 'block' }}>
                    {syncStatus === 'success' ? '✅' : '❌'} {syncMsg}
                  </span>
                )}

                <button 
                  type="button" 
                  className="prolific-import-btn spring-click" 
                  onClick={handleAutoSync}
                  disabled={prolificSyncing || !userIdVal.trim() || !tokenVal.trim()}
                  style={{ marginTop: '12px' }}
                >
                  <RefreshCw size={14} className={prolificSyncing ? 'spinning' : ''} />
                  <span>{prolificSyncing ? 'Sincronizando...' : 'Salvar e Sincronizar'}</span>
                </button>
              </div>
            )}

            {prolificTab === 'manual' && (
              <div className="prolific-tab-content">
                <textarea
                  className="prolific-json-textarea"
                  placeholder='Cole aqui o JSON do seu perfil Prolific...'
                  value={prolificJson}
                  onChange={(e) => {
                    setProlificJson(e.target.value);
                    setProlificParseStatus(null);
                    setProlificParseMsg('');
                  }}
                  rows={4}
                />

                {prolificParseMsg && (
                  <span className={`prolific-parse-feedback ${prolificParseStatus}`} style={{ marginTop: '8px', display: 'block' }}>
                    {prolificParseStatus === 'success' ? '✅' : '❌'} {prolificParseMsg}
                  </span>
                )}

                <button 
                  type="button" 
                  className="prolific-import-btn spring-click" 
                  onClick={handleParseProlificJson}
                  disabled={!prolificJson.trim()}
                  style={{ marginTop: '10px' }}
                >
                  <Shield size={14} />
                  <span>Importar JSON</span>
                </button>
              </div>
            )}
          </div>

          <div className="settings-actions">
            <button type="button" className="reset-btn spring-click" onClick={handleReset}>
              <RefreshCw size={16} />
              <span>Restaurar Padrão</span>
            </button>
            <button type="submit" className="save-btn spring-click">
              <Save size={16} />
              <span>Salvar Taxas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
