// src/components/automation/AutomationDashboard.js
import React from 'react';
import { useAutomation } from '../../hooks/useAutomation';
import LoadingSpinner from '../common/LoadingSpinner'; // Ajuste o path se necessário

function AutomationDashboard() {
  const {
    isRunning,
    loading,
    error,
    startAutomation,
    stopAutomation,
    runManualCycle,
    config,
    updateConfig,
    getAutomationStats,
    getLogs,
    testConnections,
    getStatus,
  } = useAutomation();

  const handleStartAutomation = async () => {
    console.log('🚀 [AutomationDashboard] Usuário clicou em Iniciar');
    const result = await startAutomation();
    if (result.success) {
      console.log('✅ [AutomationDashboard] Automação iniciada com sucesso');
    }
  };

  const handleStopAutomation = async () => {
    console.log('🛑 [AutomationDashboard] Usuário clicou em Parar');
    const result = await stopAutomation();
    if (result.success) {
      console.log('✅ [AutomationDashboard] Automação parada com sucesso');
    }
  };

  const handleRunManual = async () => {
    console.log('🔄 [AutomationDashboard] Usuário clicou em Ciclo Manual');
    const result = await runManualCycle();
    if (result.success) {
      console.log('✅ [AutomationDashboard] Ciclo manual executado com sucesso');
    }
  };

  const handleUpdateConfig = async (newConfig) => {
    console.log('⚙️ [AutomationDashboard] Usuário atualizando config:', newConfig);
    const result = await updateConfig(newConfig);
    if (result.success) {
      console.log('✅ [AutomationDashboard] Configuração atualizada com sucesso');
    }
  };

  const handleTestConnections = async () => {
    console.log('🔍 [AutomationDashboard] Usuário clicou em Testar Conexões');
    const result = await testConnections();
    console.log('✅ [AutomationDashboard] Resultado do teste:', result);
  };

  if (loading || isRunning === null) {
    return (
      <div className="p-4">
        <LoadingSpinner />
        <p className="text-center">Carregando status da automação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Erro: {error}</p>
        <button
          onClick={() => getStatus()}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard de Automação</h2>
      <div className="mb-4">
        Status: {isRunning ? '🟢 Ativo' : '🔴 Parado'}
      </div>
      
      <button 
        onClick={isRunning ? handleStopAutomation : handleStartAutomation}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        {isRunning ? 'Parar' : 'Iniciar'} Automação
      </button>
      
      <button 
        onClick={handleRunManual}
        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
      >
        Executar Ciclo Manual
      </button>

      <button 
        onClick={() => getAutomationStats()}
        className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
      >
        Ver Estatísticas
      </button>

      <button 
        onClick={() => getLogs()}
        className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
      >
        Ver Logs
      </button>

      <button 
        onClick={handleTestConnections}
        className="bg-orange-500 text-white px-4 py-2 rounded"
      >
        Testar Conexões
      </button>

      <div className="mt-4">
        <h3>Configurações Atuais:</h3>
        <pre>{JSON.stringify(config, null, 2)}</pre>
        {/* Adicione um formulário para atualizar config se necessário */}
      </div>
    </div>
  );
}

export default AutomationDashboard;