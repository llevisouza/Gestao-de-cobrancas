// src/components/whatsapp/WhatsAppAutomationConfig.js - CONFIGURADOR DA AUTOMAÇÃO
import React, { useState, useEffect } from 'react';
import { whatsappAutomationService } from '../../services/whatsappAutomationService';
import { whatsappService } from '../../services/whatsappService';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const WhatsAppAutomationConfig = () => {
  const [config, setConfig] = useState({});
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [healthCheck, setHealthCheck] = useState(null);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadStats, 30000); // Atualizar stats a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [configData, statsData, logsData] = await Promise.all([
        Promise.resolve(whatsappAutomationService.getConfig()),
        Promise.resolve(whatsappAutomationService.getStats()),
        whatsappAutomationService.getAutomationLogs(20)
      ]);

      setConfig(configData);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      alert('Erro ao carregar configurações da automação');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = whatsappAutomationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('❌ Erro ao atualizar stats:', error);
    }
  };

  // Iniciar automação
  const handleStartAutomation = async () => {
    setLoading(true);
    try {
      const result = await whatsappAutomationService.startAutomation();
      
      if (result.success) {
        alert('✅ Automação iniciada com sucesso!');
        await loadInitialData();
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Erro ao iniciar automação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Parar automação
  const handleStopAutomation = async () => {
    if (!window.confirm('Tem certeza que deseja parar a automação?')) return;

    setLoading(true);
    try {
      const result = await whatsappAutomationService.stopAutomation();
      
      if (result.success) {
        alert('✅ Automação parada com sucesso!');
        await loadInitialData();
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Erro ao parar automação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Executar ciclo manual
  const handleManualCycle = async () => {
    setLoading(true);
    try {
      const result = await whatsappAutomationService.runManualCycle();
      
      if (result.success) {
        alert(`✅ Ciclo executado!\n📤 Enviados: ${result.sent}\n❌ Erros: ${result.errors}`);
        await loadInitialData();
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Erro no ciclo manual: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Testar automação
  const handleTestAutomation = async () => {
    setLoading(true);
    try {
      const results = await whatsappAutomationService.testAutomation();
      setTestResults(results);
      setShowTestResults(true);
    } catch (error) {
      alert('❌ Erro no teste: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar saúde do sistema
  const handleHealthCheck = async () => {
    setLoading(true);
    try {
      const health = await whatsappAutomationService.checkHealth();
      setHealthCheck(health);
    } catch (error) {
      alert('❌ Erro na verificação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gerar relatório de performance
  const handlePerformanceReport = async () => {
    setLoading(true);
    try {
      const report = await whatsappAutomationService.getPerformanceReport(7);
      setPerformanceReport(report);
      setShowReport(true);
    } catch (error) {
      alert('❌ Erro ao gerar relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar configuração
  const handleConfigChange = (key, value) => {
    const newConfig = { ...config };
    
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      newConfig[parent] = { ...newConfig[parent], [child]: value };
    } else {
      newConfig[key] = value;
    }
    
    setConfig(newConfig);
  };

  // Salvar configuração
  const handleSaveConfig = () => {
    try {
      whatsappAutomationService.updateConfig(config);
      alert('✅ Configuração salva com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar configuração: ' + error.message);
    }
  };

  // Reset da automação
  const handleReset = async () => {
    if (!window.confirm('Tem certeza que deseja resetar toda a automação? Isso irá parar a automação e limpar todas as estatísticas.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await whatsappAutomationService.reset();
      
      if (result.success) {
        alert('✅ Automação resetada com sucesso!');
        await loadInitialData();
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Erro no reset: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (isRunning) => {
    return isRunning ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isRunning) => {
    return isRunning ? '🟢' : '🔴';
  };

  const getLogTypeIcon = (action) => {
    const icons = {
      automation_started: '🚀',
      automation_stopped: '🛑',
      cycle_completed: '✅',
      cycle_error: '❌',
      default: '📋'
    };
    return icons[action] || icons.default;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">🤖 Automação WhatsApp</h1>
              <p className="dashboard-subtitle">
                Configure e monitore cobranças automáticas via WhatsApp
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button onClick={handleHealthCheck} className="btn-secondary" disabled={loading}>
                🏥 Saúde do Sistema
              </button>
              <button onClick={handleTestAutomation} className="btn-secondary" disabled={loading}>
                🧪 Testar
              </button>
              <button onClick={handlePerformanceReport} className="btn-primary" disabled={loading}>
                📊 Relatório
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status e Controles */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Atual */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {getStatusIcon(stats.isRunning)} Status da Automação
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${getStatusColor(stats.isRunning)}`}>
                    {stats.isRunning ? 'Ativa' : 'Parada'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tempo Ativo:</span>
                  <span className="font-medium text-gray-900">
                    {formatUptime(stats.uptime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mensagens Enviadas:</span>
                  <span className="font-medium text-green-600">
                    {stats.messageseSent || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Erros:</span>
                  <span className="font-medium text-red-600">
                    {stats.errors || 0}
                  </span>
                </div>
                
                {stats.lastRun && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Última Execução:</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {stats.lastRun.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎮 Controles
              </h3>
              
              <div className="space-y-3">
                {!stats.isRunning ? (
                  <button
                    onClick={handleStartAutomation}
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    {loading ? <LoadingSpinner size="small" /> : '🚀 Iniciar Automação'}
                  </button>
                ) : (
                  <button
                    onClick={handleStopAutomation}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? <LoadingSpinner size="small" /> : '🛑 Parar Automação'}
                  </button>
                )}
                
                <button
                  onClick={handleManualCycle}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner size="small" /> : '▶️ Executar Ciclo Manual'}
                </button>
                
                <button
                  onClick={handleReset}
                  disabled={loading || stats.isRunning}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner size="small" /> : '🔄 Reset Completo'}
                </button>
              </div>
            </div>

            {/* Verificação de Saúde */}
            {healthCheck && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🏥 Saúde do Sistema
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Automação:</span>
                    <span className={healthCheck.automation.running ? 'text-green-600' : 'text-red-600'}>
                      {healthCheck.automation.running ? '✅ Rodando' : '❌ Parada'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">WhatsApp:</span>
                    <span className={healthCheck.whatsapp.connected ? 'text-green-600' : 'text-red-600'}>
                      {healthCheck.whatsapp.connected ? '✅ Conectado' : '❌ Desconectado'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horário Comercial:</span>
                    <span className={healthCheck.businessHours ? 'text-green-600' : 'text-yellow-600'}>
                      {healthCheck.businessHours ? '✅ Sim' : '⏰ Não'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className={healthCheck.database ? 'text-green-600' : 'text-red-600'}>
                      {healthCheck.database ? '✅ OK' : '❌ Erro'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Verificado em: {healthCheck.timestamp.toLocaleString('pt-BR')}
                </div>
              </div>
            )}
          </div>

          {/* Configurações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configurações Gerais */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">⚙️ Configurações</h3>
                <button onClick={handleSaveConfig} className="btn-primary text-sm">
                  💾 Salvar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Intervalo de Verificação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏱️ Intervalo de Verificação (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={Math.floor((config.checkInterval || 60000) / 60000)}
                    onChange={(e) => handleConfigChange('checkInterval', parseInt(e.target.value) * 60000)}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo entre verificações automáticas (1-60 minutos)
                  </p>
                </div>

                {/* Dias para Lembrete */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔔 Dias para Lembrete
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.reminderDays || 3}
                    onChange={(e) => handleConfigChange('reminderDays', parseInt(e.target.value))}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantos dias antes do vencimento enviar lembrete
                  </p>
                </div>

                {/* Horário Comercial - Início */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌅 Início do Horário Comercial
                  </label>
                  <select
                    value={config.businessHours?.start || 8}
                    onChange={(e) => handleConfigChange('businessHours.start', parseInt(e.target.value))}
                    className="form-select"
                  >
                    {Array.from({length: 24}, (_, i) => (
                      <option key={i} value={i}>{i}:00</option>
                    ))}
                  </select>
                </div>

                {/* Horário Comercial - Fim */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌆 Fim do Horário Comercial
                  </label>
                  <select
                    value={config.businessHours?.end || 18}
                    onChange={(e) => handleConfigChange('businessHours.end', parseInt(e.target.value))}
                    className="form-select"
                  >
                    {Array.from({length: 24}, (_, i) => (
                      <option key={i} value={i}>{i}:00</option>
                    ))}
                  </select>
                </div>

                {/* Delay entre Mensagens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏳ Delay entre Mensagens (segundos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={(config.delayBetweenMessages || 5000) / 1000}
                    onChange={(e) => handleConfigChange('delayBetweenMessages', parseInt(e.target.value) * 1000)}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo de espera entre envios para evitar spam
                  </p>
                </div>

                {/* Mensagens por Dia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Máx. Mensagens/Cliente/Dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.maxMessagesPerDay || 1}
                    onChange={(e) => handleConfigChange('maxMessagesPerDay', parseInt(e.target.value))}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Limite de mensagens por cliente por dia
                  </p>
                </div>
              </div>

              {/* Escalonamento de Cobrança */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔺 Escalonamento de Cobranças (dias após vencimento)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(config.overdueScalation || [1, 3, 7, 15, 30]).map((day, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded px-3 py-1">
                      <span className="text-sm">{day} dia{day > 1 ? 's' : ''}</span>
                      <button
                        onClick={() => {
                          const newScalation = [...(config.overdueScalation || [])];
                          newScalation.splice(index, 1);
                          handleConfigChange('overdueScalation', newScalation);
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newDay = prompt('Adicionar cobrança após quantos dias?');
                      if (newDay && !isNaN(newDay)) {
                        const newScalation = [...(config.overdueScalation || []), parseInt(newDay)];
                        newScalation.sort((a, b) => a - b);
                        handleConfigChange('overdueScalation', newScalation);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    + Adicionar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Dias específicos para enviar cobranças após o vencimento
                </p>
              </div>

              {/* Dias da Semana */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Dias de Funcionamento
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 1, label: 'Seg' },
                    { value: 2, label: 'Ter' },
                    { value: 3, label: 'Qua' },
                    { value: 4, label: 'Qui' },
                    { value: 5, label: 'Sex' },
                    { value: 6, label: 'Sáb' },
                    { value: 0, label: 'Dom' }
                  ].map(day => (
                    <label key={day.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(config.businessHours?.workDays || [1,2,3,4,5]).includes(day.value)}
                        onChange={(e) => {
                          const workDays = config.businessHours?.workDays || [1,2,3,4,5];
                          const newWorkDays = e.target.checked
                            ? [...workDays, day.value]
                            : workDays.filter(d => d !== day.value);
                          handleConfigChange('businessHours.workDays', newWorkDays);
                        }}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Logs da Automação */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  📋 Logs da Automação
                </h3>
              </div>
              
              <div className="p-6">
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-gray-600">Nenhum log encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-lg">{getLogTypeIcon(log.action)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{log.action.replace('_', ' ')}</span>
                            <span className="text-xs text-gray-500">
                              {log.timestamp?.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {log.data && (
                            <div className="text-sm text-gray-600 mt-1">
                              {log.action === 'cycle_completed' && (
                                <span>
                                  📤 {log.data.sent} enviados, ❌ {log.data.errors} erros
                                </span>
                              )}
                              {log.action === 'cycle_error' && (
                                <span className="text-red-600">
                                  {log.data.error}
                                </span>
                              )}
                              {log.action === 'automation_started' && (
                                <span className="text-green-600">
                                  Automação iniciada
                                </span>
                              )}
                              {log.action === 'automation_stopped' && (
                                <span className="text-red-600">
                                  Automação parada
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={loadInitialData}
                    className="btn-secondary text-sm"
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner size="small" /> : '🔄 Atualizar Logs'}
                  </button>
                  
                  <span className="text-xs text-gray-500">
                    Últimos 20 registros
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Teste */}
        <Modal
          isOpen={showTestResults}
          onClose={() => setShowTestResults(false)}
          title="🧪 Resultados do Teste de Automação"
        >
          {testResults && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">📊 Resumo do Sistema</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Clientes:</span>
                    <span className="ml-2 font-medium">{testResults.totalClients}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Faturas:</span>
                    <span className="ml-2 font-medium">{testResults.totalInvoices}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Assinaturas:</span>
                    <span className="ml-2 font-medium">{testResults.totalSubscriptions}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Horário Comercial:</span>
                    <span className={`ml-2 font-medium ${testResults.businessHours ? 'text-green-600' : 'text-red-600'}`}>
                      {testResults.businessHours ? '✅ Sim' : '❌ Não'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">WhatsApp:</span>
                    <span className={`ml-2 font-medium ${testResults.whatsappConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {testResults.whatsappConnected ? '✅ Conectado' : '❌ Desconectado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notificações */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  📱 Notificações ({testResults.filteredNotifications}/{testResults.pendingNotifications})
                </h4>
                
                {testResults.notifications.length === 0 ? (
                  <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-green-700">Nenhuma notificação pendente!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {testResults.notifications.map((notification, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div>
                          <span className="font-medium">{notification.client}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {notification.type === 'overdue' ? '🚨' : 
                             notification.type === 'reminder' ? '🔔' : '📄'} 
                            {notification.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">R$ {notification.amount}</div>
                          <div className="text-xs text-gray-500">{notification.dueDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Configuração Atual */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">⚙️ Configuração Atual</h4>
                <div className="text-sm space-y-1">
                  <div>Intervalo: {Math.floor(testResults.config.checkInterval / 60000)} minutos</div>
                  <div>Lembrete: {testResults.config.reminderDays} dias antes</div>
                  <div>Horário: {testResults.config.businessHours.start}h às {testResults.config.businessHours.end}h</div>
                  <div>Escalonamento: {testResults.config.overdueScalation.join(', ')} dias</div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Relatório */}
        <Modal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          title="📊 Relatório de Performance"
        >
          {performanceReport && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceReport.totalNotifications}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceReport.successful}
                  </div>
                  <div className="text-sm text-green-700">Enviadas</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {performanceReport.failed}
                  </div>
                  <div className="text-sm text-red-700">Falharam</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {performanceReport.totalNotifications > 0 
                      ? Math.round((performanceReport.successful / performanceReport.totalNotifications) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-yellow-700">Taxa Sucesso</div>
                </div>
              </div>

              {/* Por Tipo */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Por Tipo de Notificação</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span>🚨 Vencidas</span>
                    <span className="font-medium">{performanceReport.byType.overdue}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span>🔔 Lembretes</span>
                    <span className="font-medium">{performanceReport.byType.reminder}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span>📄 Novas</span>
                    <span className="font-medium">{performanceReport.byType.new_invoice}</span>
                  </div>
                </div>
              </div>

              {/* Erros */}
              {performanceReport.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">❌ Erros Recentes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {performanceReport.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium text-red-800">{error.client}</div>
                        <div className="text-sm text-red-600">{error.error}</div>
                        <div className="text-xs text-red-500">
                          {error.timestamp?.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Período: {performanceReport.period}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default WhatsAppAutomationConfig;