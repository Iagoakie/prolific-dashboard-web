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
                Sincronize sua conta e histórico de estudos com 1 clique via Bookmarklet.
              </span>
            </div>

            {prolificAccount && (
              <div className="prolific-current-status">
                {prolificAccount.isSpecialised && (
                  <div className="prolific-status-indicator expert" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,165,0,0.08))', color: '#e6a800', border: '1px solid rgba(255,215,0,0.3)' }}>
                    <span>⭐</span>
                    <span>Domain Expert</span>
                  </div>
                )}
                <div className={`prolific-status-indicator ${prolificAccount.frozen && prolificAccount.status === 'OK' && !prolificAccount.banned ? 'idle' : prolificAccount.frozen ? 'frozen' : 'active'}`}>
                  <span>{prolificAccount.frozen && prolificAccount.status === 'OK' && !prolificAccount.banned ? '⏸️' : prolificAccount.frozen ? '❄️' : '✅'}</span>
                  <span>{prolificAccount.frozen && prolificAccount.status === 'OK' && !prolificAccount.banned ? 'Sem estudos no momento' : prolificAccount.frozen ? 'Distribuição Congelada' : 'Distribuição Ativa'}</span>
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
                  📎 Bookmarklet
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
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Como usar:</strong><br/>
                  1. Arraste o botão abaixo para a barra de favoritos<br/>
                  2. Acesse <a href="https://app.prolific.com/submissions" target="_blank" rel="noopener" style={{ color: 'var(--accent-color)' }}>app.prolific.com</a> e faça login<br/>
                  3. Clique no favorito — seus dados serão importados automaticamente!
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  padding: '12px',
                  background: 'rgba(120, 120, 128, 0.06)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <a 
                    href={`javascript:void(function(){var DASH_URL='${typeof window !== 'undefined' ? window.location.origin : 'https://prolific-dashboard-web.vercel.app'}';try{var tk=null;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);var v=localStorage.getItem(k);if(v&&v.indexOf('eyJ')===0&&v.length>100){tk=v;break}}if(!tk){var cookies=document.cookie.split(';');for(var j=0;j<cookies.length;j++){var c=cookies[j].trim();if(c.indexOf('eyJ')!==-1){var parts=c.split('=');tk=parts.slice(1).join('=');break}}}if(!tk){alert('Token não encontrado. Faça login no Prolific primeiro.');return}var uid=null;try{var payload=JSON.parse(atob(tk.split('.')[1]));uid=payload.externalUserId||payload.sub}catch(e){}if(!uid){alert('Não foi possível extrair o User ID do token.');return}var headers={'Authorization':'Bearer '+tk,'Content-Type':'application/json'};var accountData=null;var csvData=null;fetch('https://internal-api.prolific.com/api/v1/users/'+uid+'/',{headers:headers}).then(function(r){return r.json()}).then(function(data){accountData=JSON.stringify(data);return fetch('https://internal-api.prolific.com/api/v1/users/'+uid+'/submissions/',{headers:headers})}).then(function(r){if(!r.ok)throw new Error('sub1');return r.json()}).then(function(subData){var results=subData.results||subData;var csv='Study,Reward,Bonus,Started At,Completed At,Completion Code,Status\\n';results.forEach(function(s){var study=(s.study_name||s.experiment_name||s.study||'Unknown').replace(/,/g,' ');var reward=s.reward||s.reward_amount||0;var curr=s.currency_code||'GBP';var sym=curr==='USD'?'$':'£';var rewardStr=sym+(Number(reward)/100).toFixed(2);var bonus=s.bonus_payments||s.bonus||0;var bonusStr=sym+(Number(bonus)/100).toFixed(2);var started=s.started_at||s.date_started||'';var completed=s.completed_at||s.date_completed||'';var code=s.study_code||s.completion_code||'';var status=(s.status||'').replace(/_/g,' ');csv+='"'+study+'",'+rewardStr+','+bonusStr+','+started+','+completed+','+code+','+status+'\\n'});csvData=csv}).catch(function(){csvData=null}).finally(function(){var url=DASH_URL+'/?import_data='+encodeURIComponent(accountData);if(csvData){url+='&import_csv='+encodeURIComponent(csvData)}window.open(url,'_blank')})}catch(e){alert('Erro: '+e.message)}}())`}
                    onClick={(e) => e.preventDefault()}
                    draggable="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'var(--accent-gradient)',
                      color: '#fff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      cursor: 'grab',
                      boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    🔄 Sync ProlificDash
                  </a>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', lineHeight: '1.4' }}>
                  Arraste o botão acima para sua barra de favoritos.
                  <br/>
                  Sincroniza: <strong>Conta</strong> + <strong>Histórico CSV</strong> automaticamente.
                </div>

                {localStorage.getItem('prolific_csv_date') && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '6px 10px', 
                    background: 'var(--color-approved-bg)', 
                    borderRadius: '8px', 
                    fontSize: '10px', 
                    color: 'var(--color-approved)',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    ✅ Último sync do CSV: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(localStorage.getItem('prolific_csv_date')))}
                  </div>
                )}
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
