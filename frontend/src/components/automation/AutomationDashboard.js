// src/components/automation/AutomationDashboard.js - VERSÃO COM CONFIGURAÇÕES ADICIONADAS
import React, { useState, useEffect } from 'react';
import { useAutomation } from '../../hooks/useAutomation';
import LoadingSpinner from '../common/LoadingSpinner';

const AutomationDashboard = ({ 
  config: propConfig = {}, 
  onConfigChange = () => {}, 
  connectionStatus: propConnectionStatus = null,
  clients = [],
  invoices = [],
  subscriptions = []
}) => {
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
  const [showConfig, setShowConfig] = useState(false); // NOVO: controle de exibição de configurações
  const [notification, setNotification] = useState(null);

  // NOVO: Estados para configuração
  const [localConfig, setLocalConfig] = useState({
    enabled: true,
    schedules: {
      reminder: { enabled: true, daysBefore: 3, time: '09:00' },
      overdue: { enabled: true, daysAfter: 1, time: '10:00' },
      final: { enabled: true, daysAfter: 7, time: '15:00' }
    },
    workingHours: {
      start: '08:00',
      end: '18:00',
      workDays: [1, 2, 3, 4, 5] // Segunda a Sexta
    },
    maxMessagesPerDay: 3,
    cooldownHours: 24,
    respectBusinessHours: true,
    skipWeekends: true
  });

  // NOVO: Carregar configuração salva
  useEffect(() => {
    const savedConfig = localStorage.getItem('whatsapp_automation_config');
    if (savedConfig) {
      try {
        setLocalConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    }
  }, []);

  // Função para mostrar notificação
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // NOVO: Salvar configuração
  const handleSaveConfig = async () => {
    try {
      localStorage.setItem('whatsapp_automation_config', JSON.stringify(localConfig));
      
      if (updateConfig) {
        await updateConfig(localConfig);
      }
      
      showNotification('success', 'Configuração salva com sucesso!');
    } catch (error) {
      showNotification('error', 'Erro ao salvar configuração: ' + error.message);
    }
  };

  // NOVO: Atualizar configuração local
  const updateLocalConfig = (path, value) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  // Handler para iniciar automação
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

  // Handler para parar automação
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

  // Handler para ciclo manual
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

  // Handler para testar conexões
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

  // Handler para reset
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

  // Carregar logs quando solicitado
  const handleShowLogs = async () => {
    if (!showLogs) {
      setShowLogs(true);
      await getLogs(20);
    } else {
      setShowLogs(false);
    }
  };

  // Carregar stats quando solicitado
  const handleShowStats = async () => {
    if (!showStats) {
      setShowStats(true);
      await getAutomationStats();
    } else {
      setShowStats(false);
    }
  };

  // Auto-refresh de stats a cada 30 segundos se estiver visível
  useEffect(() => {
    if (showStats) {
      const interval = setInterval(() => {
        getAutomationStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [showStats, getAutomationStats]);

  // Loading inicial
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

      {/* NOVO: Seção de Configurações */}
      <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              ⚙️ Configurações de Automação
            </h3>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              {showConfig ? 'Ocultar' : 'Configurar'}
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="p-6 space-y-6">
            {/* Horário Comercial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🕐 Horário Comercial</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Início
                    </label>
                    <select
                      value={localConfig.workingHours.start}
                      onChange={(e) => updateLocalConfig('workingHours.start', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fim
                    </label>
                    <select
                      value={localConfig.workingHours.end}
                      onChange={(e) => updateLocalConfig('workingHours.end', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">📅 Dias de Trabalho</h4>
                <div className="space-y-2">
                  {[
                    { value: 1, label: 'Segunda-feira' },
                    { value: 2, label: 'Terça-feira' },
                    { value: 3, label: 'Quarta-feira' },
                    { value: 4, label: 'Quinta-feira' },
                    { value: 5, label: 'Sexta-feira' },
                    { value: 6, label: 'Sábado' },
                    { value: 0, label: 'Domingo' }
                  ].map((day) => (
                    <label key={day.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.workingHours.workDays.includes(day.value)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...localConfig.workingHours.workDays, day.value]
                            : localConfig.workingHours.workDays.filter(d => d !== day.value);
                          updateLocalConfig('workingHours.workDays', newDays);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tipos de Cobrança */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">📝 Tipos de Cobrança</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lembrete */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-blue-600">🔔 Lembrete</h5>
                    <input
                      type="checkbox"
                      checked={localConfig.schedules.reminder.enabled}
                      onChange={(e) => updateLocalConfig('schedules.reminder.enabled', e.target.checked)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Dias antes do vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={localConfig.schedules.reminder.daysBefore}
                        onChange={(e) => updateLocalConfig('schedules.reminder.daysBefore', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        disabled={!localConfig.schedules.reminder.enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={localConfig.schedules.reminder.time}
                        onChange={(e) => updateLocalConfig('schedules.reminder.time', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        disabled={!localConfig.schedules.reminder.enabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Vencida */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-red-600">🚨 Vencida</h5>
                    <input
                      type="checkbox"
                      checked={localConfig.schedules.overdue.enabled}
                      onChange={(e) => updateLocalConfig('schedules.overdue.enabled', e.target.checked)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Dias após vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={localConfig.schedules.overdue.daysAfter}
                        onChange={(e) => updateLocalConfig('schedules.overdue.daysAfter', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        disabled={!localConfig.schedules.overdue.enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={localConfig.schedules.overdue.time}
                        onChange={(e) => updateLocalConfig('schedules.overdue.time', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        disabled={!localConfig.schedules.overdue.enabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Cobrança Final */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-orange-600">⚠️ Final</h5>
                    <input
                      type="checkbox"
                      checked={localConfig.schedules.final.enabled}
                      onChange={(e) => updateLocalConfig('schedules.final.enabled', e.target.checked)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Dias após vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={localConfig.schedules.final.daysAfter}
                        onChange={(e) => updateLocalConfig('schedules.final.daysAfter', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        disabled={!localConfig.schedules.final.enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={localConfig.schedules.final.time}
                        onChange={(e) => updateLocalConfig('schedules.final.time', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        disabled={!localConfig.schedules.final.enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Limites e Controles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🛡️ Controles de Spam</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de mensagens por dia (por cliente)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={localConfig.maxMessagesPerDay}
                      onChange={(e) => updateLocalConfig('maxMessagesPerDay', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cooldown entre mensagens (horas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={localConfig.cooldownHours}
                      onChange={(e) => updateLocalConfig('cooldownHours', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">📋 Opções Gerais</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localConfig.respectBusinessHours}
                      onChange={(e) => updateLocalConfig('respectBusinessHours', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Respeitar horário comercial</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localConfig.skipWeekends}
                      onChange={(e) => updateLocalConfig('skipWeekends', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Pular fins de semana</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                💾 Salvar Configurações
              </button>
            </div>
          </div>
        )}
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
                  {config.maxMessagesPerDay || localConfig.maxMessagesPerDay}
                </div>
                <div className="text-sm text-orange-800">Max Mensagens/Dia</div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {config.businessHours?.start || localConfig.workingHours.start}-{config.businessHours?.end || localConfig.workingHours.end}
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