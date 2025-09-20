import React from 'react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from '../../utils/dateUtils';

const DateFilter = ({ 
  dateRange, 
  onDateRangeChange, 
  statusFilter, 
  onStatusFilterChange 
}) => {
  
  const handlePresetRange = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'today':
        startDate = endDate = today;
        break;
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'lastYear':
        const lastYear = new Date(today.getFullYear() - 1, 0);
        startDate = startOfYear(lastYear);
        endDate = endOfYear(lastYear);
        break;
      default:
        return;
    }

    onDateRangeChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const handleDateChange = (field, value) => {
    onDateRangeChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="reports-filters">
      <h3 className="reports-filters-title">Filtros</h3>
      
      <div className="reports-filters-row">
        {/* Períodos pré-definidos */}
        <div className="form-group">
          <label className="form-label">Períodos Rápidos</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handlePresetRange('today')}
            >
              Hoje
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handlePresetRange('thisMonth')}
            >
              Este Mês
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handlePresetRange('lastMonth')}
            >
              Mês Anterior
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handlePresetRange('thisYear')}
            >
              Este Ano
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handlePresetRange('lastYear')}
            >
              Ano Anterior
            </button>
          </div>
        </div>

        {/* Data de início */}
        <div className="form-group">
          <label className="form-label">Data Início</label>
          <input
            type="date"
            className="form-input"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>

        {/* Data de fim */}
        <div className="form-group">
          <label className="form-label">Data Fim</label>
          <input
            type="date"
            className="form-input"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
          />
        </div>

        {/* Filtro por status */}
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="paid">Pagas</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Vencidas</option>
          </select>
        </div>

        {/* Botão para limpar filtros */}
        <div className="form-group">
          <label className="form-label" style={{ visibility: 'hidden' }}>
            Ações
          </label>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const today = new Date();
              onDateRangeChange({
                startDate: startOfMonth(today).toISOString().split('T')[0],
                endDate: endOfMonth(today).toISOString().split('T')[0]
              });
              onStatusFilterChange('all');
            }}
          >
            🔄 Limpar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateFilter;