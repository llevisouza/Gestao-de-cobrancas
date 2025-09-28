// src/components/automation/AutomationDashboard.js - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useAutomation } from '../../hooks/useAutomation';
import LoadingSpinner from '../common/LoadingSpinner';

const AutomationDashboard = () => {
  const {
    // Estados
    isRunning,
    loading,
    error,
    stats,
    logs,
    config,
    connectionStatus,
    
    // Ações
    startAutomation,
    stopAutomation,
    runManualCycle,
    updateConfig,
    resetAutomation,
    testConnections,
    getAutomationStats,
    getLogs,
    
    // Utilitários
    canStart,
    canStop,
    isConnected
  } = useAutomation();

  // Estados locais
  const [actionLoading, setActionLoading] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [notification, setNotification] = useState(null);

  // ✅ Função para mostrar notificação
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ✅ Handler para iniciar automação
  const handleStart = async () => {
    console.log('🚀 [AutomationDashboard] Usuário clicou em INICIAR');
    setActionLoading('start');
    
    try {
      const result = await startAutomation();
      
      if (result.success) {
        showNotification('success', '✅ Automação iniciada com sucesso!');
        console.log('✅ [AutomationDashboard] Automação iniciada!');
      } else {
        showNotification('error', `❌ Erro ao iniciar: ${result.error}`);
        console.error('❌ [AutomationDashboard] Erro ao iniciar:', result.error);
      }
    } catch (error) {
      showNotification('error', `❌ Erro inesperado: ${error.message}`);
      console.error('❌ [AutomationDashboard] Erro inesperado:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Handler para parar automação
  const handleStop = async () => {
    console.log('🛑 [AutomationDashboard] Usuário clicou em PARAR');
    setActionLoading('stop');
    
    try {
      const result = await stopAutomation();
      
      if (result.success) {
        showNotification('success', '✅ Automação parada com sucesso!');
        console.log('✅ [AutomationDashboard] Automação parada!');
      } else {
        showNotification('error', `❌ Erro ao parar: ${result.error}`);
        console.error('❌ [AutomationDashboard] Erro ao parar:', result.error);
      }
    } catch (error) {
      showNotification('error', `❌ Erro inesperado: ${error.message}`);
      console.error('❌ [AutomationDashboard] Erro inesperado:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Handler para ciclo manual
  const handleManualCycle = async () => {
    console.log('🔄 [AutomationDashboard] Usuário clicou em CICLO MANUAL');
    setActionLoading('manual');
    
    try {
      const result = await runManualCycle();
      
      if (result.success) {
        showNotification('success', `✅ Ciclo executado! Processadas: ${result.result?.processed || 0}`);
        console.log('✅ [AutomationDashboard] Ciclo manual executado:', result);
      } else {
        showNotification('error', `❌ Erro no ciclo: ${result.error}`);
      }
    } catch (error) {
      showNotification('error', `❌ Erro inesperado: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Handler para testar conexões
  const handleTestConnections = async () => {
    console.log('🔍 [AutomationDashboard] Testando conexões...');
    setActionLoading('test');
    
    try {
      const result = await testConnections();
      
      if (result.success) {
        showNotification('success', '✅ Conexões OK!');
      } else {
        showNotification('error', `❌ Problemas na conexão: ${result.error}`);
      }
    } catch (error) {
      showNotification('error', `❌ Erro no teste: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Handler para reset
  const handleReset = async () => {
    if (!window.confirm('⚠️ Tem certeza que deseja resetar a automação? Isso irá parar todos os processos.')) {
      return;
    }
    
    console.log('🔄 [AutomationDashboard] Fazendo reset...');
    setActionLoading('reset');
    
    try {
      const result = await resetAutomation();
      
      if (result.success) {
        showNotification('success', '✅ Reset concluído!');
      } else {
        showNotification('error', `❌ Erro no reset: ${result.error}`);
      }
    } catch (error) {
      showNotification('error', `❌ Erro no reset: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Carregar logs quando solicitado
  const handleShowLogs = async () => {
    if (!showLogs) {
      setShowLogs(true);
      await getLogs(20);
    } else {
      setShowLogs(false);
    }
  };

  // ✅ Carregar stats quando solicitado
  const handleShowStats = async () => {
    if (!showStats) {
      setShowStats(true);
      await getAutomationStats();
    } else {
      setShowStats(false);
    }
  };

  // ✅ Auto-refresh de stats a cada 30 segundos se estiver visível
  useEffect(() => {
    if (showStats) {
      const interval = setInterval(() => {
        getAutomationStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [showStats, getAutomationStats]);

  // ✅ Loading inicial
  if (loading && isRunning === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 animate-pulse">
            Conectando com o servidor de automação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🤖 Dashboard de Automação
            </h1>
            <p className="text-gray-600 mt-2">
              Controle completo da automação de cobranças WhatsApp
            </p>
          </div>
          
          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium ${
            isRunning 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            {isRunning ? '🟢 ATIVO' : '🔴 PARADO'}
          </div>
        </div>
      </div>

      {/* Notificação */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 shadow-sm animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800'
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{notification.message}</p>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Erro de conexão */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="font-medium text-red-800">Erro de Conexão:</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Controles Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Botão Start/Stop */}
        <button
          onClick={isRunning ? handleStop : handleStart}
          disabled={actionLoading === 'start' || actionLoading === 'stop' || loading}
          className={`p-4 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {actionLoading === 'start' || actionLoading === 'stop' ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="small" />
              <span className="ml-2">
                {actionLoading === 'start' ? 'Iniciando...' : 'Parando...'}
              </span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">
                {isRunning ? '🛑' : '🚀'}
              </div>
              <div>
                {isRunning ? 'PARAR' : 'INICIAR'}
              </div>
              <div className="text-xs opacity-80 mt-1">
                {isRunning ? 'Parar Automação' : 'Iniciar Automação'}
              </div>
            </div>
          )}
        </button>

        {/* Ciclo Manual */}
        <button
          onClick={handleManualCycle}
          disabled={actionLoading === 'manual' || loading}
          className="p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading === 'manual' ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="small" />
              <span className="ml-2">Executando...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div>CICLO MANUAL</div>
              <div className="text-xs opacity-80 mt-1">
                Executar Agora
              </div>
            </div>
          )}
        </button>

        {/* Testar Conexões */}
        <button
          onClick={handleTestConnections}
          disabled={actionLoading === 'test' || loading}
          className="p-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading === 'test' ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="small" />
              <span className="ml-2">Testando...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div>TESTAR</div>
              <div className="text-xs opacity-80 mt-1">
                Conexões
              </div>
            </div>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          disabled={actionLoading === 'reset' || loading}
          className="p-4 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading === 'reset' ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="small" />
              <span className="ml-2">Resetando...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div>RESET</div>
              <div className="text-xs opacity-80 mt-1">
                Reiniciar Tudo
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Status das Conexões */}
      {connectionStatus && (
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔌 Status das Conexões
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Database */}
              <div className={`p-3 rounded-lg border ${
                connectionStatus.database 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🗄️</span>
                  <span className="font-medium">Database</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    connectionStatus.database 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {connectionStatus.database ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {connectionStatus.database ? 'Firebase conectado' : 'Erro na conexão'}
                </p>
              </div>

              {/* WhatsApp */}
              <div className={`p-3 rounded-lg border ${
                connectionStatus.whatsapp?.connected 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📱</span>
                  <span className="font-medium">WhatsApp</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    connectionStatus.whatsapp?.connected 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {connectionStatus.whatsapp?.connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {connectionStatus.whatsapp?.connected 
                    ? 'Evolution API ativa' 
                    : 'Verificar configuração'
                  }
                </p>
              </div>

              {/* Sistema */}
              <div className={`p-3 rounded-lg border ${
                isConnected 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚙️</span>
                  <span className="font-medium">Sistema</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    isConnected 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {isConnected ? 'OK' : 'Parcial'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Todos os serviços OK' : 'Alguns problemas detectados'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configurações Atuais */}
      {config && Object.keys(config).length > 0 && (
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              ⚙️ Configurações Atuais
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {config.checkInterval ? Math.round(config.checkInterval / 60000) : 5}min
                </div>
                <div className="text-sm text-blue-800">Intervalo de Verificação</div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {config.reminderDaysBefore || 3}
                </div>
                <div className="text-sm text-green-800">Dias de Lembrete</div>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {config.maxMessagesPerDay || 1}
                </div>
                <div className="text-sm text-orange-800">Max Mensagens/Dia</div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {config.businessHours?.start || 8}h-{config.businessHours?.end || 18}h
                </div>
                <div className="text-sm text-purple-800">Horário Comercial</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ações Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Logs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📜 Logs da Automação
              </h3>
              <button
                onClick={handleShowLogs}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                {showLogs ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          
          {showLogs && (
            <div className="p-4 max-h-64 overflow-y-auto">
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log, index) => (
                    <div key={index} className={`p-2 rounded text-sm ${
                      log.level === 'error' 
                        ? 'bg-red-50 text-red-800' 
                        : log.level === 'warn'
                        ? 'bg-yellow-50 text-yellow-800'
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'N/A'}
                        </span>
                        <span className={`px-1 text-xs rounded ${
                          log.level === 'error' ? 'bg-red-200' : 
                          log.level === 'warn' ? 'bg-yellow-200' : 'bg-blue-200'
                        }`}>
                          {log.level || 'info'}
                        </span>
                      </div>
                      <div className="mt-1">
                        {log.message || JSON.stringify(log, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum log disponível
                </p>
              )}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📊 Estatísticas
              </h3>
              <button
                onClick={handleShowStats}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                {showStats ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          
          {showStats && (
            <div className="p-4">
              {stats && Object.keys(stats).length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mensagens Enviadas:</span>
                    <span className="font-semibold">{stats.messagesSent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Erros:</span>
                    <span className="font-semibold text-red-600">{stats.errors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Último Ciclo:</span>
                    <span className="font-semibold text-sm">
                      {stats.lastCycle 
                        ? new Date(stats.lastCycle).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-semibold text-green-600">
                      {stats.uptime 
                        ? Math.round(stats.uptime / 1000 / 60) + ' min'
                        : '0 min'
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma estatística disponível
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ℹ️ Informações do Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Estado da Automação:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Status: {isRunning ? 'Ativo ✅' : 'Parado ❌'}</li>
              <li>• Carregando: {loading ? 'Sim' : 'Não'}</li>
              <li>• Erro: {error ? 'Sim' : 'Não'}</li>
              <li>• Pode Iniciar: {canStart ? 'Sim' : 'Não'}</li>
              <li>• Pode Parar: {canStop ? 'Sim' : 'Não'}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Funcionalidades:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• ✅ Verificação automática de vencimentos</li>
              <li>• ✅ Envio inteligente de lembretes</li>
              <li>• ✅ Escalonamento de cobranças</li>
              <li>• ✅ Horário comercial respeitado</li>
              <li>• ✅ Prevenção de spam</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AutomationDashboard;