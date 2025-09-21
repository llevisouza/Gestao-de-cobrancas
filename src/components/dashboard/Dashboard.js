// src/components/dashboard/Dashboard.js - COM SISTEMA DE RECORRÊNCIA
import React from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { 
    clients, 
    subscriptions, 
    invoices, 
    loading, 
    createExampleData,
    generateInvoices // Nova função que suporta todas as recorrências
  } = useFirestore();

  const handleCreateExampleData = async () => {
    try {
      await createExampleData();
      alert('Dados de exemplo criados com sucesso!\n\nIncluindo:\n• Plano Mensal (dia 20)\n• Delivery Semanal (sexta-feira)\n• Serviço Personalizado (a cada 15 dias)\n• Plano Diário');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      alert('Erro ao criar dados de exemplo: ' + error.message);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      const count = await generateInvoices();
      if (count > 0) {
        alert(`🎉 ${count} novas faturas foram geradas com sucesso!\n\nAs faturas foram criadas baseadas nas configurações de recorrência de cada assinatura.`);
      } else {
        alert('ℹ️ Nenhuma nova fatura foi gerada.\n\nMotivos possíveis:\n• Todas as faturas já foram geradas\n• Ainda não é o momento da próxima cobrança\n• Não há assinaturas ativas');
      }
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      alert('❌ Erro ao gerar faturas: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header Atualizado */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">
                Visão geral do sistema de cobranças com recorrências flexíveis
              </p>
            </div>
            
            {/* Botões com informações melhoradas */}
            <div className="dashboard-actions">
              <button 
                onClick={handleCreateExampleData}
                className="btn-success"
                title="Criar dados de exemplo com diferentes tipos de recorrência"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4z" clipRule="evenodd" />
                </svg>
                Dados Exemplo
              </button>
              <button 
                onClick={handleGenerateInvoices}
                className="btn-primary"
                title="Gerar faturas baseadas nas configurações de recorrência"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gerar Faturas
              </button>
            </div>
          </div>
        </div>

        {/* Cards de estatísticas de recorrência */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Assinaturas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="text-lg font-bold text-blue-600">
                  {subscriptions.filter(sub => sub.recurrenceType === 'daily').length}
                </div>
                <div className="text-sm text-gray-600">Diárias</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <div className="text-lg font-bold text-green-600">
                  {subscriptions.filter(sub => sub.recurrenceType === 'weekly').length}
                </div>
                <div className="text-sm text-gray-600">Semanais</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                <div className="text-lg font-bold text-orange-600">
                  {subscriptions.filter(sub => sub.recurrenceType === 'monthly').length}
                </div>
                <div className="text-sm text-gray-600">Mensais</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                <div className="text-lg font-bold text-purple-600">
                  {subscriptions.filter(sub => sub.recurrenceType === 'custom').length}
                </div>
                <div className="text-sm text-gray-600">Personalizadas</div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards existentes */}
        <KPICards invoices={invoices} clients={clients} />
        
        {/* Tabela de faturas */}
        <InvoiceTable invoices={invoices} clients={clients} />

        {/* Informações sobre recorrências */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔄 Como Funcionam as Recorrências</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tipos de Cobrança:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                        <strong>Diário:</strong> Fatura gerada todos os dias
                      </li>
                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        <strong>Semanal:</strong> Fatura gerada no dia da semana escolhido
                      </li>
                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                        <strong>Mensal:</strong> Fatura gerada no dia do mês escolhido
                      </li>
                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                        <strong>Personalizado:</strong> Fatura gerada a cada X dias
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Geração Automática:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Sistema verifica automaticamente quando gerar
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Previne duplicação de faturas
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Respeita a data de início de cada assinatura
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Calcula datas de vencimento corretas
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-orange-800 font-medium">💡 Dica Importante</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Clique em "Gerar Faturas" sempre que quiser verificar se há novas cobranças a serem criadas. 
                        O sistema é inteligente e só gera quando necessário, respeitando cada tipo de recorrência.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem para primeiros passos */}
        {clients.length === 0 && (
          <div className="card text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-orange-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sistema de Cobranças com Recorrências
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gerencie cobranças com flexibilidade total! Crie assinaturas diárias, semanais, 
                mensais ou com intervalos personalizados. O sistema gera faturas automaticamente 
                no momento certo.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleCreateExampleData}
                  className="btn-success block w-full"
                >
                  🚀 Começar com Dados de Exemplo
                </button>
                <p className="text-sm text-gray-500">
                  Inclui exemplos de todos os tipos de recorrência
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;