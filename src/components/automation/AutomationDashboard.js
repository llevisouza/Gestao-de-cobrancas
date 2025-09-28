// src/components/automation/AutomationDashboard.js
import React, { useCallback, useState, useEffect } from 'react';
import { useAutomation } from '../../hooks/useAutomation';
import LoadingSpinner from '../common/LoadingSpinner';

const AutomationDashboard = () => {
  const { 
    isRunning, 
    loading, 
    startAutomation, 
    stopAutomation, 
    runManualCycle, 
    testConnections,
    getStatus
  } = useAutomation();

  const [status, setStatus] = useState({ connected: false, details: {} });

  useEffect(() => {
    const fetchStatus = async () => {
      const currentStatus = await getStatus();
      setStatus(currentStatus);
    };
    fetchStatus();
  }, [getStatus]);

  const showNotification = (type, title, message) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    alert(`${icons[type]} ${title}\n${message}`);
  };

  const handleStart = useCallback(async () => {
    try {
      const result = await startAutomation();
      if (result.success) {
        showNotification('success', 'Automação Iniciada', 'O sistema de automação foi ativado!');
        setStatus(await getStatus());
      } else {
        showNotification('error', 'Erro ao Iniciar', result.error);
      }
    } catch (error) {
      showNotification('error', 'Erro ao Iniciar', error.message);
    }
  }, [startAutomation, getStatus]);

  const handleStop = useCallback(async () => {
    try {
      const result = await stopAutomation();
      if (result.success) {
        showNotification('success', 'Automação Parada', 'O sistema de automação foi desativado.');
        setStatus(await getStatus());
      } else {
        showNotification('error', 'Erro ao Parar', result.error);
      }
    } catch (error) {
      showNotification('error', 'Erro ao Parar', error.message);
    }
  }, [stopAutomation, getStatus]);

  const handleRunManualCycle = useCallback(async () => {
    try {
      const result = await runManualCycle();
      if (result.success) {
        showNotification('success', 'Ciclo Manual Executado', 'As mensagens foram enviadas com sucesso!');
      } else {
        showNotification('error', 'Erro no Ciclo Manual', result.error);
      }
    } catch (error) {
      showNotification('error', 'Erro no Ciclo Manual', error.message);
    }
  }, [runManualCycle]);

  const handleTestConnections = useCallback(async () => {
    try {
      const health = await testConnections();
      if (health.error) {
        showNotification('error', 'Erro na Conexão', health.error);
      } else {
        showNotification('success', 'Teste de Conexão', 
          `Banco de dados: ${health.database ? '✅ OK' : '❌ Falhou'}\nWhatsApp: ${health.whatsapp.connected ? '✅ Conectado' : '❌ Desconectado'}`);
        setStatus(health);
      }
    } catch (error) {
      showNotification('error', 'Erro no Teste', error.message);
    }
  }, [testConnections]);

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Controle de Automação</h2>
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <button
            onClick={handleStart}
            disabled={isRunning || loading}
            className="btn-success px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Iniciar o sistema de automação"
          >
            {loading && !isRunning ? <LoadingSpinner size="small" /> : <span>▶️</span>}
            Ligar Automação
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning || loading}
            className="btn-danger px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Parar o sistema de automação"
          >
            {loading && isRunning ? <LoadingSpinner size="small" /> : <span>⏹️</span>}
            Desligar Automação
          </button>
          <button
            onClick={handleRunManualCycle}
            disabled={loading}
            className="btn-primary px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Executar um ciclo manual de envio"
          >
            {loading ? <LoadingSpinner size="small" /> : <span>🔄</span>}
            Ciclo Manual
          </button>
          <button
            onClick={handleTestConnections}
            disabled={loading}
            className="btn-warning px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Testar a conexão com o WhatsApp e o banco de dados"
          >
            {loading ? <LoadingSpinner size="small" /> : <span>🔍</span>}
            Testar Conexão
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Status: 
          <span className={`font-medium ml-2 ${isRunning ? 'text-green-600' : 'text-red-600'}`}>
            {isRunning ? '🟢 Ativo' : '🔴 Parado'}
          </span>
          {status.whatsapp && (
            <span className="ml-4">
              WhatsApp: {status.whatsapp.connected ? '✅ Conectado' : '❌ Desconectado'}
            </span>
          )}
          {status.database !== undefined && (
            <span className="ml-4">
              Banco: {status.database ? '✅ Conectado' : '❌ Desconectado'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboard;