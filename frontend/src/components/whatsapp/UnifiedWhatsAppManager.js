// src/components/whatsapp/UnifiedWhatsAppManager.js - VERSÃO FINAL
import React, { useState, useEffect } from 'react';
import WhatsAppBillingManager from '../notifications/WhatsAppBillingManager';
import WhatsAppMessageTemplates from '../notifications/WhatsAppMessageTemplates';
import WhatsAppManualSender from './WhatsAppManualSender';
import AutomationDashboard from '../automation/AutomationDashboard';
import { whatsappService } from '../../services/whatsappService';

// Usando suas constantes existentes + as novas para automação
import { 
  // ROUTES,
  DEFAULT_WHATSAPP_AUTOMATION_CONFIG,
  // WHATSAPP_NOTIFICATION_TYPES,
  // WHATSAPP_NOTIFICATION_LABELS,
  // DEFAULT_WHATSAPP_COMPANY_INFO
} from '../../utils/constants';

const UnifiedWhatsAppManager = ({ clients = [], invoices = [], subscriptions = [] }) => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para automação usando suas constantes
  const [automationConfig, setAutomationConfig] = useState(DEFAULT_WHATSAPP_AUTOMATION_CONFIG);

  // Carregar status de conexão ao montar
  useEffect(() => {
    checkWhatsAppConnection();
    loadAutomationConfig();
  }, []);

  const checkWhatsAppConnection = async () => {
    try {
      const status = await whatsappService.checkConnection();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Erro ao verificar conexão WhatsApp:', error);
      setConnectionStatus({ connected: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationConfig = () => {
    try {
      const savedConfig = localStorage.getItem('whatsapp_automation_config');
      if (savedConfig) {
        setAutomationConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de automação:', error);
    }
  };

  const saveAutomationConfig = async (newConfig) => {
    try {
      localStorage.setItem('whatsapp_automation_config', JSON.stringify(newConfig));
      setAutomationConfig(newConfig);
      
      // Atualizar no serviço de WhatsApp se necessário
      if (whatsappService.updateAutomationConfig) {
        await whatsappService.updateAutomationConfig(newConfig);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return { success: false, error: error.message };
    }
  };

  const tabs = [
    {
      id: 'notifications',
      name: 'Notificações',
      icon: '📋',
      description: 'Gerenciar cobranças pendentes'
    },
    {
      id: 'connection',
      name: 'Conexão',
      icon: '🔌',
      description: 'Status e configuração WhatsApp'
    },
    {
      id: 'templates',
      name: 'Templates',
      icon: '📝',
      description: 'Personalizar mensagens automáticas'
    },
    {
      id: 'manual',
      name: 'Envio Manual',
      icon: '✉️',
      description: 'Enviar mensagens individuais'
    },
    {
      id: 'automation',
      name: 'Automação',
      icon: '🤖',
      description: 'Configurar cobranças automáticas'
    }
  ];

  const getTabClassName = (tabId) => {
    const baseClass = "relative flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 hover:bg-gray-50";
    
    if (activeTab === tabId) {
      return `${baseClass} text-blue-600 border-blue-500 bg-blue-50`;
    }
    
    return `${baseClass} text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status WhatsApp */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        connectionStatus?.connected ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="text-2xl">
                          {connectionStatus?.connected ? '✅' : '❌'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                        <p className={`text-sm font-medium ${
                          connectionStatus?.connected ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {connectionStatus?.connected ? 'Conectado' : 'Desconectado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notificações Pendentes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">
                          {invoices?.filter(inv => inv.status === 'pending' || inv.status === 'overdue')?.length || 0}
                        </span> pendentes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automação Status */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      automationConfig.enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Automação</h3>
                      <p className={`text-sm font-medium ${
                        automationConfig.enabled ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {automationConfig.enabled ? 'Ativa' : 'Inativa'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Billing Manager */}
            <WhatsAppBillingManager
              clients={clients}
              invoices={invoices}
              subscriptions={subscriptions}
              onRefresh={() => window.location.reload()}
            />
          </div>
        );
      
      case 'connection':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔌</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Conexão WhatsApp</h2>
                  <p className="text-gray-600">Configure e monitore a conexão com WhatsApp</p>
                </div>
              </div>
              
              {/* Status de Conexão Detalhado */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`w-4 h-4 rounded-full ${
                      connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <div>
                      <span className="font-semibold text-lg">
                        Status: {connectionStatus?.connected ? 'Conectado' : 'Desconectado'}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {connectionStatus?.connected 
                          ? 'WhatsApp está funcionando normalmente' 
                          : 'Verifique a configuração do WhatsApp'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={checkWhatsAppConnection}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verificando...' : 'Verificar Conexão'}
                  </button>
                </div>
                
                {!connectionStatus?.connected && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Como conectar:</h4>
                    <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                      <li>Verifique se a Evolution API está rodando</li>
                      <li>Escaneie o QR Code com seu WhatsApp</li>
                      <li>Aguarde a confirmação da conexão</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'templates':
        return (
          <div className="bg-white rounded-lg shadow-lg">
            <WhatsAppMessageTemplates />
          </div>
        );
      
      case 'manual':
        return (
          <div className="bg-white rounded-lg shadow-lg">
            <WhatsAppManualSender
              clients={clients}
              invoices={invoices}
              subscriptions={subscriptions}
              connectionStatus={connectionStatus}
              onClose={() => {}}
            />
          </div>
        );
      
      case 'automation':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Automação WhatsApp</h2>
                  <p className="text-gray-600">Configure e monitore cobranças automáticas</p>
                </div>
              </div>
              
              {/* Status de Conexão Resumido */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${
                      connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium">
                      Status WhatsApp: {connectionStatus?.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  <button
                    onClick={checkWhatsAppConnection}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm disabled:opacity-50"
                  >
                    {loading ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* COMPONENTE DE AUTOMAÇÃO COMPLETO COM SUAS CONSTANTES */}
            <AutomationDashboard 
              config={automationConfig}
              onConfigChange={saveAutomationConfig}
              connectionStatus={connectionStatus}
              clients={clients}
              invoices={invoices}
              subscriptions={subscriptions}
            />
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900">Aba não encontrada</h3>
              <p className="text-gray-600">Selecione uma aba válida</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📱</span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">WhatsApp Business</h1>
                <p className="text-green-100 text-lg">Sistema de Cobrança Inteligente</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                ⚙️ Configurações
              </button>
              <button 
                onClick={checkWhatsAppConnection}
                disabled={loading}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <>🔄 Atualizar</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Abas */}
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getTabClassName(tab.id)}
                title={tab.description}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium whitespace-nowrap">{tab.name}</span>
                
                {/* Active Tab Indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="animate-fade-in">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .flex.overflow-x-auto button {
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedWhatsAppManager;