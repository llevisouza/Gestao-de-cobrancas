// src/hooks/useFirestore.js - VERSÃO SUPER OTIMIZADA
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { clientService, subscriptionService, invoiceService } from '../services/firestore';

export const useFirestore = () => {
  const { user } = useFirebaseAuth();
  
  // ⚡ OTIMIZAÇÃO: Usar refs para evitar re-renders desnecessários
  const isInitializedRef = useRef(false);
  const unsubscribersRef = useRef([]);
  const loadingTimeoutRef = useRef(null);
  
  // Estados principais
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⚡ OTIMIZAÇÃO: Debounced loading para evitar flickers
  const setLoadingWithDelay = useCallback((isLoading, delay = 0) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    if (delay > 0) {
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(isLoading);
      }, delay);
    } else {
      setLoading(isLoading);
    }
  }, []);

  // ⚡ OTIMIZAÇÃO: Cleanup otimizado
  const cleanupListeners = useCallback(() => {
    console.log('🧹 Limpando listeners otimizado...');
    
    unsubscribersRef.current.forEach(unsubscriber => {
      if (typeof unsubscriber === 'function') {
        try {
          unsubscriber();
        } catch (error) {
          console.warn('⚠️ Aviso no cleanup:', error);
        }
      }
    });
    
    unsubscribersRef.current = [];
    isInitializedRef.current = false;
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // ⚡ OTIMIZAÇÃO: Setup listeners uma única vez
  const setupListeners = useCallback(async () => {
    // Evitar múltiplas inicializações
    if (!user || isInitializedRef.current) {
      console.log('⚡ Setup ignorado - já inicializado ou sem usuário');
      return;
    }

    console.log('🚀 Configurando listeners OTIMIZADO para:', user.email);
    isInitializedRef.current = true;
    setLoadingWithDelay(true);
    setError(null);

    // Limpar listeners anteriores primeiro
    cleanupListeners();

    try {
      // ⚡ OTIMIZAÇÃO: Setup em paralelo com Promise.all
      const setupPromises = [];
      
      // Clientes
      setupPromises.push(new Promise((resolve) => {
        const unsubscribe = clientService.subscribe((clientsData) => {
          console.log('📊 Clientes recebidos:', clientsData?.length || 0);
          setClients(clientsData || []);
          resolve(unsubscribe);
        });
      }));

      // Assinaturas
      setupPromises.push(new Promise((resolve) => {
        const unsubscribe = subscriptionService.subscribe((subscriptionsData) => {
          console.log('🔄 Assinaturas recebidas:', subscriptionsData?.length || 0);
          setSubscriptions(subscriptionsData || []);
          resolve(unsubscribe);
        });
      }));

      // Faturas
      setupPromises.push(new Promise((resolve) => {
        const unsubscribe = invoiceService.subscribe((invoicesData) => {
          console.log('📋 Faturas recebidas:', invoicesData?.length || 0);
          setInvoices(invoicesData || []);
          resolve(unsubscribe);
        });
      }));

      // ⚡ OTIMIZAÇÃO: Aguardar todos os listeners em paralelo
      const unsubscribers = await Promise.all(setupPromises);
      unsubscribersRef.current = unsubscribers;

      // ⚡ OTIMIZAÇÃO: Loading com delay mínimo para UX suave
      setLoadingWithDelay(false, 500);
      console.log('✅ Todos os listeners configurados com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao configurar listeners:', error);
      setError(error.message);
      setLoadingWithDelay(false);
    }
  }, [user, cleanupListeners, setLoadingWithDelay]);

  // ⚡ OTIMIZAÇÃO: Effect com cleanup robusto
  useEffect(() => {
    if (user) {
      setupListeners();
    } else {
      console.log('🚪 Usuário deslogado - limpando dados...');
      cleanupListeners();
      setClients([]);
      setSubscriptions([]);
      setInvoices([]);
      setLoadingWithDelay(false);
      setError(null);
    }

    // Cleanup na desmontagem do componente
    return () => {
      cleanupListeners();
    };
  }, [user, setupListeners, cleanupListeners, setLoadingWithDelay]);

  // ===== OPERAÇÕES OTIMIZADAS DE CLIENTES =====
  const createClient = useCallback(async (clientData) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!clientData?.name?.trim() || !clientData?.email?.trim()) {
      throw new Error('Nome e email são obrigatórios');
    }

    try {
      console.log('🔄 Criando cliente:', clientData.name);
      
      const result = await clientService.create(clientData);
      
      if (result.success) {
        console.log('✅ Cliente criado:', result.id);
        return result.id;
      } else {
        throw new Error(result.error || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('❌ Erro na criação do cliente:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const updateClient = useCallback(async (clientId, clientData) => {
    if (!user || !clientId) {
      throw new Error('Parâmetros inválidos');
    }

    try {
      console.log('🔄 Atualizando cliente:', clientId);
      
      const result = await clientService.update(clientId, clientData);
      
      if (result.success) {
        console.log('✅ Cliente atualizado:', clientId);
        return true;
      } else {
        throw new Error(result.error || 'Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('❌ Erro na atualização:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const deleteClient = useCallback(async (clientId) => {
    if (!user || !clientId) {
      throw new Error('Parâmetros inválidos');
    }

    try {
      console.log('🗑️ Deletando cliente:', clientId);
      
      const result = await clientService.delete(clientId);
      
      if (result.success) {
        console.log('✅ Cliente deletado:', clientId);
        return true;
      } else {
        throw new Error(result.error || 'Erro ao deletar cliente');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // ===== OPERAÇÕES OTIMIZADAS DE ASSINATURAS =====
  const createSubscription = useCallback(async (subscriptionData) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!subscriptionData?.name?.trim() || !subscriptionData?.amount || !subscriptionData?.clientId) {
      throw new Error('Nome, valor e cliente são obrigatórios');
    }

    try {
      console.log('🔄 Criando assinatura:', subscriptionData.name);
      
      const result = await subscriptionService.create(subscriptionData);
      
      if (result.success) {
        console.log('✅ Assinatura criada:', result.id);
        return result.id;
      } else {
        throw new Error(result.error || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('❌ Erro na criação da assinatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const updateSubscription = useCallback(async (subscriptionId, subscriptionData) => {
    if (!user || !subscriptionId) {
      throw new Error('Parâmetros inválidos');
    }

    try {
      console.log('🔄 Atualizando assinatura:', subscriptionId);
      
      const result = await subscriptionService.update(subscriptionId, subscriptionData);
      
      if (result.success) {
        console.log('✅ Assinatura atualizada:', subscriptionId);
        return true;
      } else {
        throw new Error(result.error || 'Erro ao atualizar assinatura');
      }
    } catch (error) {
      console.error('❌ Erro na atualização da assinatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const deleteSubscription = useCallback(async (subscriptionId) => {
    if (!user || !subscriptionId) {
      throw new Error('Parâmetros inválidos');
    }

    try {
      console.log('🗑️ Deletando assinatura:', subscriptionId);
      
      const result = await subscriptionService.delete(subscriptionId);
      
      if (result.success) {
        console.log('✅ Assinatura deletada:', subscriptionId);
        return true;
      } else {
        throw new Error(result.error || 'Erro ao deletar assinatura');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar assinatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // ===== OPERAÇÕES OTIMIZADAS DE FATURAS =====
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    if (!user || !invoiceId) {
      throw new Error('Parâmetros inválidos');
    }

    try {
      console.log('🔄 Atualizando fatura:', invoiceId);
      
      const result = await invoiceService.update(invoiceId, invoiceData);
      
      if (result.success) {
        console.log('✅ Fatura atualizada:', invoiceId);
        return true;
      } else {
        throw new Error(result.error || 'Erro ao atualizar fatura');
      }
    } catch (error) {
      console.error('❌ Erro na atualização da fatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const generateInvoices = useCallback(async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🚀 Gerando faturas das assinaturas ativas...');
      
      // ⚡ OTIMIZAÇÃO: Mostrar loading apenas para operações longas
      if (subscriptions.length > 10) {
        setLoadingWithDelay(true);
      }
      
      const count = await invoiceService.generateFromSubscriptions();
      
      console.log(`✅ ${count} faturas geradas!`);
      
      if (subscriptions.length > 10) {
        setLoadingWithDelay(false, 500);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Erro ao gerar faturas:', error);
      setLoadingWithDelay(false);
      setError(error.message);
      throw error;
    }
  }, [user, subscriptions.length, setLoadingWithDelay]);

  // ===== FUNÇÃO OTIMIZADA PARA CRIAR DADOS DE EXEMPLO =====
  const createExampleData = useCallback(async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🎯 Criando dados de exemplo...');
      
      // Verificar se já existem dados
      if (clients.length > 0) {
        throw new Error('Já existem clientes cadastrados');
      }

      setLoadingWithDelay(true);

      // ⚡ OTIMIZAÇÃO: Dados de exemplo mais compactos
      const exampleClients = [
        {
          name: 'Ana Silva',
          email: 'ana@exemplo.com',
          phone: '11999999999',
          cpf: '12345678901',
          pix: 'ana@exemplo.com'
        },
        {
          name: 'João Santos',
          email: 'joao@exemplo.com',
          phone: '11888888888',
          cpf: '98765432109',
          pix: 'joao@exemplo.com'
        },
        {
          name: 'Maria Costa',
          email: 'maria@exemplo.com',
          phone: '11777777777',
          cpf: '11122233344',
          pix: 'maria@exemplo.com'
        }
      ];

      // Criar clientes sequencialmente para evitar race conditions
      const createdClients = [];
      for (const clientData of exampleClients) {
        try {
          const clientId = await createClient(clientData);
          createdClients.push({ ...clientData, id: clientId });
          console.log('✅ Cliente exemplo criado:', clientData.name);
        } catch (error) {
          console.error('❌ Erro ao criar cliente exemplo:', error);
        }
      }

      // ⚡ OTIMIZAÇÃO: Aguardar sincronização
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Criar assinaturas
      const today = new Date().toISOString().split('T')[0];
      const exampleSubscriptions = [
        {
          clientId: createdClients[0]?.id,
          clientName: createdClients[0]?.name,
          name: 'Delivery Diário',
          amount: 25.00,
          recurrenceType: 'daily',
          startDate: today,
          status: 'active'
        },
        {
          clientId: createdClients[1]?.id,
          clientName: createdClients[1]?.name,
          name: 'Plano Semanal',
          amount: 150.00,
          recurrenceType: 'weekly',
          dayOfWeek: 'friday',
          startDate: today,
          status: 'active'
        },
        {
          clientId: createdClients[2]?.id,
          clientName: createdClients[2]?.name,
          name: 'Mensalidade',
          amount: 300.00,
          recurrenceType: 'monthly',
          dayOfMonth: 15,
          startDate: today,
          status: 'active'
        }
      ];

      for (const subData of exampleSubscriptions) {
        if (subData.clientId) {
          try {
            await createSubscription(subData);
            console.log('✅ Assinatura exemplo criada:', subData.name);
          } catch (error) {
            console.error('❌ Erro ao criar assinatura exemplo:', error);
          }
        }
      }

      // Gerar algumas faturas
      try {
        await generateInvoices();
      } catch (error) {
        console.warn('⚠️ Aviso ao gerar faturas exemplo:', error);
      }

      setLoadingWithDelay(false, 500);
      console.log('🎉 Dados de exemplo criados com sucesso!');
      
      return { success: true, message: 'Dados de exemplo criados!' };
    } catch (error) {
      console.error('❌ Erro ao criar dados de exemplo:', error);
      setLoadingWithDelay(false);
      setError(error.message);
      throw error;
    }
  }, [user, clients.length, createClient, createSubscription, generateInvoices, setLoadingWithDelay]);

  // ⚡ OTIMIZAÇÃO: Função de refresh otimizada
  const refreshData = useCallback(async () => {
    if (!user) return;

    console.log('🔄 Forçando refresh otimizado...');
    
    try {
      setLoadingWithDelay(true, 0);
      
      // Reconectar listeners
      isInitializedRef.current = false;
      await setupListeners();
      
    } catch (error) {
      console.error('❌ Erro no refresh:', error);
      setError(error.message);
      setLoadingWithDelay(false);
    }
  }, [user, setupListeners, setLoadingWithDelay]);

  // ⚡ OTIMIZAÇÃO: Limpar dados otimizado
  const clearAllData = useCallback(async () => {
    if (!user || clients.length === 0) {
      return { success: false, message: 'Nenhum dado para limpar' };
    }

    try {
      console.log('🧹 Limpando todos os dados...');
      setLoadingWithDelay(true);

      const deletePromises = clients.map(client => deleteClient(client.id));
      await Promise.allSettled(deletePromises);

      console.log('✅ Limpeza concluída!');
      setLoadingWithDelay(false, 500);
      
      return { success: true, message: 'Dados limpos com sucesso!' };
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      setError(error.message);
      setLoadingWithDelay(false);
      throw error;
    }
  }, [user, clients, deleteClient, setLoadingWithDelay]);

  return {
    // Estados
    clients,
    subscriptions,
    invoices,
    loading,
    error,

    // Operações de clientes
    createClient,
    updateClient,
    deleteClient,

    // Operações de assinaturas
    createSubscription,
    updateSubscription,
    deleteSubscription,

    // Operações de faturas
    updateInvoice,
    generateInvoices,

    // Utilitários otimizados
    createExampleData,
    clearAllData,
    refreshData
  };
};