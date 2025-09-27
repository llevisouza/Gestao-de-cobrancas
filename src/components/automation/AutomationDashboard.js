// src/components/automation/AutomationDashboard.js
import React, { useState } from 'react';
import { useAutomation } from '../../hooks/useAutomation';

const AutomationDashboard = () => {
  const {
    isRunning,
    startAutomation,
    stopAutomation,
    runManualCycle,
    reset,
    getLogs,
    testConnections,
    config,
    updateConfig,
    stats,
  } = useAutomation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    const result = await startAutomation();
    if (result.success) {
      alert('Automação iniciada!');
    } else {
      alert(`Erro: ${result.error}`);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    const result = await stopAutomation();
    if (result.success) {
      alert('Automação parada!');
    } else {
      alert(`Erro: ${result.error}`);
    }
    setLoading(false);
  };

  const handleManualCycle = async () => {
    setLoading(true);
    const result = await runManualCycle();
    if (result.success) {
      alert('Ciclo manual executado!');
    } else {
      alert(`Erro: ${result.error}`);
    }
    setLoading(false);
    await refreshLogs();
  };

  const handleReset = async () => {
    if (window.confirm('Tem certeza? Isso resetará a automação.')) {
      setLoading(true);
      const result = await reset();
      if (result.success) {
        alert('Reset concluído!');
      } else {
        alert(`Erro: ${result.error}`);
      }
      setLoading(false);
    }
  };

  const handleTestConnections = async () => {
    const health = await testConnections();
    alert(`Database: ${health.database ? 'OK' : 'Erro'}\nWhatsApp: ${health.whatsapp.connected ? 'OK' : 'Erro'}\nBusiness Hours: ${health.businessHours ? 'OK' : 'Fora do horário'}`);
  };

  const refreshLogs = async () => {
    const newLogs = await getLogs();
    setLogs(newLogs);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Dashboard de Automação WhatsApp</h2>
      
      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <h3>Status</h3>
          <p className={isRunning ? 'text-green-600' : 'text-red-600'}>
            {isRunning ? '🟢 Ativo' : '🔴 Parado'}
          </p>
        </div>
        <div className="p-4 bg-green-100 rounded">
          <h3>Mensagens Enviadas</h3>
          <p>{stats?.messagesSent || 0}</p>
        </div>
        <div className="p-4 bg-red-100 rounded">
          <h3>Erros</h3>
          <p>{stats?.errors || 0}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded">
          <h3>Última Execução</h3>
          <p>{stats?.lastRun ? new Date(stats.lastRun).toLocaleString() : 'N/A'}</p>
        </div>
      </div>

      {/* Botões */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button onClick={handleStart} disabled={isRunning || loading} className="p-2 bg-green-500 text-white rounded disabled:opacity-50">
          Iniciar Automação
        </button>
        <button onClick={handleStop} disabled={!isRunning || loading} className="p-2 bg-red-500 text-white rounded disabled:opacity-50">
          Parar Automação
        </button>
        <button onClick={handleManualCycle} disabled={loading} className="p-2 bg-blue-500 text-white rounded disabled:opacity-50">
          Ciclo Manual
        </button>
        <button onClick={handleReset} disabled={loading} className="p-2 bg-yellow-500 text-white rounded disabled:opacity-50">
          Reset Automação
        </button>
      </div>

      {/* Teste e Logs */}
      <button onClick={handleTestConnections} className="p-2 bg-purple-500 text-white rounded mb-4">
        Testar Conexões
      </button>
      <button onClick={refreshLogs} className="p-2 bg-gray-500 text-white rounded mb-4">
        Atualizar Logs
      </button>
      <div>
        <h3>Logs Recentes</h3>
        <ul className="max-h-40 overflow-y-auto">
          {logs.map((log, index) => (
            <li key={index}>
              [{new Date(log.timestamp).toLocaleString()}] {log.action}: {log.data?.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AutomationDashboard;
