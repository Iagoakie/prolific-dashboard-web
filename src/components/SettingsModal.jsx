import React, { useState } from 'react';
import { X, RefreshCw, Save, Sliders } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ rates, onSave, onClose }) {
  const [usd, setUsd] = useState(rates.usd);
  const [gbp, setGbp] = useState(rates.gbp);

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      usd: parseFloat(usd) || 4.9128,
      gbp: parseFloat(gbp) || 6.6638
    });
    onClose();
  };

  const handleReset = () => {
    setUsd(4.9128);
    setGbp(6.6638);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="settings-title-wrapper">
            <Sliders size={20} className="settings-title-icon" />
            <h3>Ajustes de Câmbio</h3>
          </div>
          <button className="close-btn spring-click" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          <p className="settings-desc">
            Defina as taxas cambiais para converter as recompensas originais em Libra (£) e Dólar ($) para Real (R$).
          </p>

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

          <div className="settings-actions">
            <button type="button" className="reset-btn spring-click" onClick={handleReset}>
              <RefreshCw size={16} />
              <span>Restaurar</span>
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
