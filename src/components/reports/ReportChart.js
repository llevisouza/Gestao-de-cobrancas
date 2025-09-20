// src/components/reports/ReportChart.js (Componente opcional)
import React from 'react';

const ReportChart = ({ data }) => {
  const { paid, pending, overdue } = data;
  const total = paid + pending + overdue;
  
  if (total === 0) return null;

  const paidPercentage = (paid / total) * 100;
  const pendingPercentage = (pending / total) * 100;
  const overduePercentage = (overdue / total) * 100;

  return (
    <div className="card mb-8">
      <div className="card-header">
        <h3 className="card-title">Distribuição de Status</h3>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {/* Pago */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-success-500 rounded mr-3"></div>
              <span className="text-sm font-medium text-gray-900">Pagas</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{paid}</span>
              <span className="text-xs text-gray-500">({paidPercentage.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill-success"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>

          {/* Pendente */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-warning-500 rounded mr-3"></div>
              <span className="text-sm font-medium text-gray-900">Pendentes</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{pending}</span>
              <span className="text-xs text-gray-500">({pendingPercentage.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill-warning"
              style={{ width: `${pendingPercentage}%` }}
            />
          </div>

          {/* Vencidas */}
          {overdue > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-error-500 rounded mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">Vencidas</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{overdue}</span>
                  <span className="text-xs text-gray-500">({overduePercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill-error"
                  style={{ width: `${overduePercentage}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Resumo total */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{total} faturas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportChart;