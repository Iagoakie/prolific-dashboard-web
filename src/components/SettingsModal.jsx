import React, { useState } from 'react';
import { X, RefreshCw, Save, Sliders, UploadCloud } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ rates, onSave, onClose, exchangeSource, lastExchangeFetch, onFetchRates, onFileUpload, csvSource }) {
  const [usd, setUsd] = useState(rates.usd);
  const [gbp, setGbp] = useState(rates.gbp);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      usd: parseFloat(usd) || 4.9128,
      gbp: parseFloat(gbp) || 6.6638
    }, 'manual');
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
    onSave({
      usd: 4.9128,
      gbp: 6.6638
    }, 'default');
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
