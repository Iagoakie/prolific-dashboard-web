import React, { useState } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, Info, X, 
  CheckCircle2, Clock, RotateCcw, XCircle, HelpCircle,
  BookOpen, Sliders, Coins, Wallet, Calendar, Key, Activity
} from 'lucide-react';
import './SubmissionsTable.css';

export default function SubmissionsTable({ submissions }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSub, setSelectedSub] = useState(null); // Para o modal de detalhes
  
  const itemsPerPage = 12;

  // Filtros
  const filtered = submissions.filter((sub) => {
    const matchesSearch = sub.study.toLowerCase().includes(search.toLowerCase()) || 
                          sub.completionCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sub.statusResumo === statusFilter;
    const matchesCurrency = currencyFilter === 'All' || sub.moeda === currencyFilter;

    return matchesSearch && matchesStatus && matchesCurrency;
  });

  // Paginação
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aprovado': return 'status-approved';
      case 'Em review': return 'status-pending';
      case 'Retornado': return 'status-returned';
      case 'Rejeitado': return 'status-rejected';
      default: return 'status-other';
    }
  };

  const getStatusIcon = (status) => {
    const size = 13;
    switch (status) {
      case 'Aprovado': 
        return <CheckCircle2 size={size} className="status-badge-icon" />;
      case 'Em review': 
        return <Clock size={size} className="status-badge-icon" />;
      case 'Retornado': 
        return <RotateCcw size={size} className="status-badge-icon" />;
      case 'Rejeitado': 
        return <XCircle size={size} className="status-badge-icon" />;
      default: 
        return <HelpCircle size={size} className="status-badge-icon" />;
    }
  };

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="submissions-container animate-fade-in">
      {/* Filtros e Busca */}
      <div className="filters-row glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por estudo ou código de conclusão..." 
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="dropdowns-group">
          {/* Status Segmented Control (iOS style) */}
          <div className="segmented-control status-segmented">
            <button 
              type="button"
              className={`segmented-button ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}
            >
              Todos
            </button>
            <button 
              type="button"
              className={`segmented-button ${statusFilter === 'Aprovado' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Aprovado'); setCurrentPage(1); }}
            >
              Aprovados
            </button>
            <button 
              type="button"
              className={`segmented-button ${statusFilter === 'Em review' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Em review'); setCurrentPage(1); }}
            >
              Em Review
            </button>
            <button 
              type="button"
              className={`segmented-button ${statusFilter === 'Retornado' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Retornado'); setCurrentPage(1); }}
            >
              Retornados
            </button>
            <button 
              type="button"
              className={`segmented-button ${statusFilter === 'Rejeitado' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Rejeitado'); setCurrentPage(1); }}
            >
              Rejeitados
            </button>
          </div>

          {/* Currency Segmented Control (iOS style) */}
          <div className="segmented-control currency-segmented">
            <button 
              type="button"
              className={`segmented-button ${currencyFilter === 'All' ? 'active' : ''}`}
              onClick={() => { setCurrencyFilter('All'); setCurrentPage(1); }}
            >
              Moedas
            </button>
            <button 
              type="button"
              className={`segmented-button ${currencyFilter === 'GBP' ? 'active' : ''}`}
              onClick={() => { setCurrencyFilter('GBP'); setCurrentPage(1); }}
            >
              🇬🇧 GBP
            </button>
            <button 
              type="button"
              className={`segmented-button ${currencyFilter === 'USD' ? 'active' : ''}`}
              onClick={() => { setCurrencyFilter('USD'); setCurrentPage(1); }}
            >
              🇺🇸 USD
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Envios */}
      <div className="table-wrapper glass-panel">
        {paginated.length === 0 ? (
          <div className="no-results">Nenhum estudo encontrado com os filtros selecionados.</div>
        ) : (
          <table className="submissions-table">
            <thead>
              <tr>
                <th>
                  <div className="header-cell-content">
                    <BookOpen size={13} />
                    <span>Estudo</span>
                  </div>
                </th>
                <th>
                  <div className="header-cell-content">
                    <Activity size={13} />
                    <span>Status</span>
                  </div>
                </th>
                <th>
                  <div className="header-cell-content">
                    <Coins size={13} />
                    <span>Moeda Original</span>
                  </div>
                </th>
                <th>
                  <div className="header-cell-content">
                    <Wallet size={13} />
                    <span>Valor BRL</span>
                  </div>
                </th>
                <th>
                  <div className="header-cell-content">
                    <Calendar size={13} />
                    <span>Conclusão</span>
                  </div>
                </th>
                <th className="actions-header">Info</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((sub, idx) => (
                <tr key={idx} onClick={() => setSelectedSub(sub)} className="clickable-row spring-click">
                  <td className="col-study">
                    <span className="study-title">{sub.study}</span>
                    <span className="study-code">{sub.completionCode ? `Código: ${sub.completionCode}` : 'Sem código'}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(sub.statusResumo)}`}>
                      {getStatusIcon(sub.statusResumo)}
                      <span>{sub.statusResumo}</span>
                    </span>
                  </td>
                  <td className="col-original-val">
                    <span className="currency-val-wrapper">
                      <span className="currency-flag">{sub.moeda === 'USD' ? '🇺🇸' : '🇬🇧'}</span>
                      <span className="currency-symbol-val">{sub.moeda === 'USD' ? '$' : '£'} {sub.valorTotalOriginal.toFixed(2)}</span>
                    </span>
                    <span className="reward-bonus-split">
                      ({sub.reward} + {sub.bonus} bônus)
                    </span>
                  </td>
                  <td className="col-brl-val">
                    <span className="brl-val-wrapper">
                      <span className="currency-flag">🇧🇷</span>
                      <span>{formatBRL(sub.valorTotalBRL)}</span>
                    </span>
                  </td>
                  <td>{formatDate(sub.completedAt)}</td>
                  <td className="col-action" onClick={(e) => { e.stopPropagation(); setSelectedSub(sub); }}>
                    <button className="info-btn spring-click">
                      <Info size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination-row">
            <span className="page-info">
              Mostrando {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)} de {filtered.length} envios
            </span>
            <div className="pagination-controls">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="page-btn spring-click"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="active-page">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="page-btn spring-click"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Modal para Detalhes (iOS style card/bottom sheet modal) */}
      {selectedSub && (
        <div className="modal-backdrop" onClick={() => setSelectedSub(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            
            <div className="modal-header">
              <h3>Detalhes do Estudo</h3>
              <button className="close-btn spring-click" onClick={() => setSelectedSub(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section study-main-info">
                <h4>{selectedSub.study}</h4>
                <span className={`status-badge large ${getStatusClass(selectedSub.statusResumo)}`}>
                  {getStatusIcon(selectedSub.statusResumo)}
                  <span>{selectedSub.statusResumo}</span>
                </span>
              </div>

              <div className="details-grid">
                <div className="detail-field">
                  <span className="field-label">
                    <Key size={12} />
                    <span>Código de Conclusão</span>
                  </span>
                  <span className="field-val">{selectedSub.completionCode || 'Não informado'}</span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Activity size={12} />
                    <span>Status Original</span>
                  </span>
                  <span className="field-val">{selectedSub.statusRaw}</span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Coins size={12} />
                    <span>Valor Original</span>
                  </span>
                  <span className="field-val val-flex">
                    <span>{selectedSub.moeda === 'USD' ? '🇺🇸 $' : '🇬🇧 £'} {selectedSub.valorTotalOriginal.toFixed(2)}</span>
                  </span>
                  <span className="field-sub">Recompensa: {selectedSub.reward} | Bônus: {selectedSub.bonus}</span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Wallet size={12} />
                    <span>Valor Equivalente BRL</span>
                  </span>
                  <span className="field-val highlight-brl">
                    <span>🇧🇷 {formatBRL(selectedSub.valorTotalBRL)}</span>
                  </span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Calendar size={12} />
                    <span>Data de Início</span>
                  </span>
                  <span className="field-val">{formatDate(selectedSub.startedAt)}</span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Calendar size={12} />
                    <span>Data de Conclusão</span>
                  </span>
                  <span className="field-val">{formatDate(selectedSub.completedAt)}</span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Clock size={12} />
                    <span>Duração Calculada</span>
                  </span>
                  <span className="field-val">
                    {selectedSub.duracaoMinutos !== null ? `${selectedSub.duracaoMinutos} minutos` : 'N/A'}
                  </span>
                </div>
                
                <div className="detail-field">
                  <span className="field-label">
                    <Clock size={12} />
                    <span>Faixa Horária</span>
                  </span>
                  <span className="field-val">{selectedSub.faixaHoraria || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
