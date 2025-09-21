// src/hooks/useFirestore.js - COM SISTEMA DE RECORRÊNCIA COMPLETO
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Funções de data
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentDateTime = () => {
  return new Date().toISOString();
};

// Função para calcular próxima data de vencimento baseada na recorrência
const calculateNextDueDate = (subscription, baseDate = null) => {
  const startDate = baseDate ? new Date(baseDate + 'T12:00:00') : new Date(subscription.startDate + 'T12:00:00');
  let nextDueDate;

  switch (subscription.recurrenceType) {
    case 'daily':
      // Para diário, próxima cobrança é sempre no próximo dia
      nextDueDate = new Date(startDate);
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;

    case 'weekly':
      // Para semanal, calcular próximo dia da semana
      const daysOfWeek = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      const targetDay = daysOfWeek[subscription.dayOfWeek];
      const currentDay = startDate.getDay();
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7; // Se é hoje, próxima semana
      
      nextDueDate = new Date(startDate);
      nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
      break;

    case 'monthly':
      // Para mensal, próximo mês no dia especificado
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(subscription.dayOfMonth);
      nextDueDate = nextMonth;
      break;

    case 'custom':
      // Para personalizado, adicionar o número de dias especificado
      nextDueDate = new Date(startDate);
      nextDueDate.setDate(nextDueDate.getDate() + subscription.recurrenceDays);
      break;

    default:
      // Fallback para mensal
      nextDueDate = new Date(startDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      if (subscription.dayOfMonth) {
        nextDueDate.setDate(subscription.dayOfMonth);
      }
  }

  // Formatar como YYYY-MM-DD
  const year = nextDueDate.getFullYear();
  const month = String(nextDueDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDueDate.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log('[DEBUG] Próxima data de vencimento:', {
    subscriptionType: subscription.recurrenceType,
    startDate: startDate.toDateString(),
    nextDueDate: nextDueDate.toDateString(),
    result
  });
  
  return result;
};

// Função para verificar se deve gerar fatura baseada na recorrência
const shouldGenerateInvoice = (subscription, existingInvoices) => {
  const today = getCurrentDate();
  const subscriptionStart = new Date(subscription.startDate + 'T12:00:00');
  const todayDate = new Date(today + 'T12:00:00');

  // Verificar se a assinatura já começou
  if (subscriptionStart > todayDate) {
    return { should: false, reason: 'Assinatura ainda não iniciou' };
  }

  // Encontrar a última fatura gerada para esta assinatura
  const subscriptionInvoices = existingInvoices
    .filter(inv => inv.subscriptionId === subscription.id)
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  const lastInvoice = subscriptionInvoices[0];

  if (!lastInvoice) {
    // Primeira fatura - sempre gerar
    return { should: true, reason: 'Primeira fatura', nextDueDate: calculateNextDueDate(subscription) };
  }

  // Calcular quando deveria ser a próxima fatura baseada na última
  const lastDueDate = lastInvoice.dueDate;
  const nextDueDate = calculateNextDueDate(subscription, lastDueDate);
  const nextDueDateObj = new Date(nextDueDate + 'T12:00:00');

  // Verificar se já passou da data da próxima fatura
  if (todayDate >= nextDueDateObj) {
    // Verificar se já existe fatura para esta data
    const existsForDate = existingInvoices.some(inv => 
      inv.subscriptionId === subscription.id && inv.dueDate === nextDueDate
    );

    if (!existsForDate) {
      return { should: true, reason: 'Nova fatura deve ser gerada', nextDueDate };
    } else {
      return { should: false, reason: 'Fatura já existe para esta data' };
    }
  }

  return { should: false, reason: 'Ainda não é hora da próxima fatura' };
};

export const useFirestore = () => {
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para limpar dados órfãos
  const cleanupOrphanedData = useCallback(async (clientsData, subscriptionsData, invoicesData) => {
    try {
      const batch = writeBatch(db);
      const clientIds = new Set(clientsData.map(c => c.id));
      const subscriptionIds = new Set(subscriptionsData.map(s => s.id));
      
      let cleanedCount = 0;

      // Limpar assinaturas de clientes que não existem mais
      const orphanedSubscriptions = subscriptionsData.filter(sub => !clientIds.has(sub.clientId));
      for (const sub of orphanedSubscriptions) {
        console.log('Removendo assinatura órfã:', sub.id, 'do cliente:', sub.clientId);
        batch.delete(doc(db, 'subscriptions', sub.id));
        cleanedCount++;
      }

      // Limpar faturas de assinaturas que não existem mais
      const orphanedInvoices = invoicesData.filter(inv => 
        inv.subscriptionId && !subscriptionIds.has(inv.subscriptionId)
      );
      for (const inv of orphanedInvoices) {
        console.log('Removendo fatura órfã:', inv.id, 'da assinatura:', inv.subscriptionId);
        batch.delete(doc(db, 'invoices', inv.id));
        cleanedCount++;
      }

      // Executar limpeza em batch
      if (cleanedCount > 0) {
        await batch.commit();
        console.log(`${cleanedCount} registros órfãos removidos`);
      }

    } catch (error) {
      console.error('Erro ao limpar dados órfãos:', error);
    }
  }, []);

  // Função para buscar dados com listeners em tempo real
  useEffect(() => {
    setLoading(true);
    let clientsData = [];
    let subscriptionsData = [];
    let invoicesData = [];
    
    // Listener para clientes
    const clientsQuery = query(collection(db, 'clients'), orderBy('name'));
    const unsubscribeClients = onSnapshot(
      clientsQuery,
      (snapshot) => {
        clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);
        console.log('Clientes atualizados:', clientsData.length);
        
        // Limpar dados órfãos quando todos os dados estiverem carregados
        if (subscriptionsData.length >= 0 && invoicesData.length >= 0) {
          cleanupOrphanedData(clientsData, subscriptionsData, invoicesData);
        }
      },
      (error) => {
        console.error('Erro ao buscar clientes:', error);
        setError('Erro ao carregar clientes');
      }
    );

    // Listener para assinaturas
    const subscriptionsQuery = query(collection(db, 'subscriptions'), orderBy('startDate', 'desc'));
    const unsubscribeSubscriptions = onSnapshot(
      subscriptionsQuery,
      (snapshot) => {
        subscriptionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubscriptions(subscriptionsData);
        console.log('Assinaturas atualizadas:', subscriptionsData.length);
      },
      (error) => {
        console.error('Erro ao buscar assinaturas:', error);
        setError('Erro ao carregar assinaturas');
      }
    );

    // Listener para faturas
    const invoicesQuery = query(collection(db, 'invoices'), orderBy('dueDate', 'desc'));
    const unsubscribeInvoices = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvoices(invoicesData);
        console.log('Faturas atualizadas:', invoicesData.length);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar faturas:', error);
        setError('Erro ao carregar faturas');
        setLoading(false);
      }
    );

    // Cleanup listeners
    return () => {
      unsubscribeClients();
      unsubscribeSubscriptions();
      unsubscribeInvoices();
    };
  }, [cleanupOrphanedData]);

  // CRUD Clientes
  const createClient = useCallback(async (clientData) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        createdAt: getCurrentDateTime(),
        status: 'active'
      });
      console.log('Cliente criado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao criar cliente: ' + error.message);
    }
  }, []);

  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        ...clientData,
        updatedAt: getCurrentDateTime()
      });
      console.log('Cliente atualizado:', clientId);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Erro ao atualizar cliente: ' + error.message);
    }
  }, []);

  const deleteClient = useCallback(async (clientId) => {
    try {
      // Verificar se cliente tem assinaturas ativas
      const clientSubscriptions = subscriptions.filter(
        sub => sub.clientId === clientId && sub.status === 'active'
      );
      
      if (clientSubscriptions.length > 0) {
        throw new Error('Não é possível excluir cliente com assinaturas ativas');
      }

      // Usar batch para excluir cliente e dados relacionados
      const batch = writeBatch(db);
      
      // Excluir cliente
      batch.delete(doc(db, 'clients', clientId));
      
      // Excluir todas as assinaturas do cliente
      const allClientSubscriptions = subscriptions.filter(sub => sub.clientId === clientId);
      for (const sub of allClientSubscriptions) {
        batch.delete(doc(db, 'subscriptions', sub.id));
      }
      
      // Excluir todas as faturas do cliente
      const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
      for (const inv of clientInvoices) {
        batch.delete(doc(db, 'invoices', inv.id));
      }
      
      await batch.commit();
      console.log('Cliente e dados relacionados excluídos:', clientId);
      
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      throw new Error('Erro ao excluir cliente: ' + error.message);
    }
  }, [subscriptions, invoices]);

  // CRUD Assinaturas
  const createSubscription = useCallback(async (subscriptionData) => {
    try {
      const docRef = await addDoc(collection(db, 'subscriptions'), {
        ...subscriptionData,
        createdAt: getCurrentDateTime()
      });
      console.log('Assinatura criada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      throw new Error('Erro ao criar assinatura: ' + error.message);
    }
  }, []);

  const updateSubscription = useCallback(async (subscriptionId, subscriptionData) => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
      await updateDoc(subscriptionRef, {
        ...subscriptionData,
        updatedAt: getCurrentDateTime()
      });
      console.log('Assinatura atualizada:', subscriptionId);
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw new Error('Erro ao atualizar assinatura: ' + error.message);
    }
  }, []);

  const deleteSubscription = useCallback(async (subscriptionId) => {
    try {
      // Verificar se assinatura tem faturas pendentes
      const subscriptionInvoices = invoices.filter(
        invoice => invoice.subscriptionId === subscriptionId && 
                  (invoice.status === 'pending' || invoice.status === 'overdue')
      );
      
      if (subscriptionInvoices.length > 0) {
        throw new Error('Não é possível excluir assinatura com faturas pendentes');
      }

      // Usar batch para excluir assinatura e faturas relacionadas
      const batch = writeBatch(db);
      
      // Excluir assinatura
      batch.delete(doc(db, 'subscriptions', subscriptionId));
      
      // Excluir todas as faturas da assinatura
      const allSubscriptionInvoices = invoices.filter(inv => inv.subscriptionId === subscriptionId);
      for (const inv of allSubscriptionInvoices) {
        batch.delete(doc(db, 'invoices', inv.id));
      }
      
      await batch.commit();
      console.log('Assinatura e faturas relacionadas excluídas:', subscriptionId);
      
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error);
      throw new Error('Erro ao excluir assinatura: ' + error.message);
    }
  }, [invoices]);

  // CRUD Faturas
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const updateData = {
        ...invoiceData,
        updatedAt: getCurrentDateTime()
      };

      // Se foi marcada como paga, adicionar data de pagamento
      if (invoiceData.status === 'paid') {
        updateData.paidDate = getCurrentDate();
      }

      await updateDoc(invoiceRef, updateData);
      console.log('Fatura atualizada:', invoiceId);
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      throw new Error('Erro ao atualizar fatura: ' + error.message);
    }
  }, []);

  // Gerar faturas automáticas COM NOVO SISTEMA DE RECORRÊNCIA
  const generateInvoices = useCallback(async () => {
    try {
      console.log('Iniciando geração automática de faturas...');
      
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      if (activeSubscriptions.length === 0) {
        throw new Error('Nenhuma assinatura ativa encontrada');
      }

      let generatedCount = 0;
      const currentDate = getCurrentDate();
      
      console.log('[DEBUG] Data atual:', currentDate);
      console.log('[DEBUG] Assinaturas ativas:', activeSubscriptions.length);
      
      for (const subscription of activeSubscriptions) {
        console.log('[DEBUG] Verificando assinatura:', {
          id: subscription.id,
          name: subscription.name,
          type: subscription.recurrenceType,
          client: subscription.clientName
        });

        // Verificar se deve gerar fatura para esta assinatura
        const shouldGenerate = shouldGenerateInvoice(subscription, invoices);
        console.log('[DEBUG] Resultado da verificação:', shouldGenerate);

        if (!shouldGenerate.should) {
          console.log(`Pulando assinatura ${subscription.id}: ${shouldGenerate.reason}`);
          continue;
        }

        // Gerar nova fatura
        const invoiceData = {
          subscriptionId: subscription.id,
          clientId: subscription.clientId,
          clientName: subscription.clientName,
          subscriptionName: subscription.name,
          amount: parseFloat(subscription.amount),
          dueDate: shouldGenerate.nextDueDate,
          generationDate: currentDate,
          createdAt: getCurrentDateTime(),
          status: 'pending',
          description: `${subscription.name} - ${getRecurrenceDescription(subscription)}`
        };

        console.log('[DEBUG] Criando fatura:', invoiceData);

        await addDoc(collection(db, 'invoices'), invoiceData);
        generatedCount++;
      }

      console.log(`${generatedCount} faturas geradas com sucesso`);
      return generatedCount;
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      throw new Error('Erro ao gerar faturas: ' + error.message);
    }
  }, [subscriptions, invoices]);

  // Função auxiliar para descrição da recorrência
  const getRecurrenceDescription = (subscription) => {
    const today = new Date();
    const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    switch (subscription.recurrenceType) {
      case 'daily':
        return `Cobrança diária - ${today.toLocaleDateString('pt-BR')}`;
      case 'weekly':
        return `Cobrança semanal - ${monthName}`;
      case 'monthly':
        return `Cobrança mensal - ${monthName}`;
      case 'custom':
        return `Cobrança a cada ${subscription.recurrenceDays} dias - ${monthName}`;
      default:
        return `Cobrança - ${monthName}`;
    }
  };

  // Manter compatibilidade com o método antigo
  const generateMonthlyInvoices = useCallback(async (month, year) => {
    // Para manter compatibilidade, vamos usar o novo sistema
    return await generateInvoices();
  }, [generateInvoices]);

  // Criar dados de exemplo ATUALIZADO com diferentes tipos de recorrência
  const createExampleData = useCallback(async () => {
    try {
      console.log('Criando dados de exemplo com diferentes recorrências...');
      const currentDate = getCurrentDate();
      
      const exampleClients = [
        {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          cpf: '12345678901',
          pix: 'joao@email.com'
        },
        {
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '11888888888',
          cpf: '98765432109',
          pix: '11888888888'
        },
        {
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '11777777777',
          cpf: '45678912345',
          pix: 'pedro@email.com'
        },
        {
          name: 'Ana Oliveira',
          email: 'ana@email.com',
          phone: '11666666666',
          cpf: '78912345678',
          pix: 'ana@email.com'
        }
      ];

      const createdClients = [];
      for (const clientData of exampleClients) {
        const clientId = await createClient(clientData);
        createdClients.push({ id: clientId, ...clientData });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Criar assinaturas com diferentes tipos de recorrência
      const subscriptionData = [
        {
          client: createdClients[0],
          name: 'Plano Premium Mensal',
          amount: 150,
          recurrenceType: 'monthly',
          dayOfMonth: 20
        },
        {
          client: createdClients[1],
          name: 'Delivery Semanal',
          amount: 75,
          recurrenceType: 'weekly',
          dayOfWeek: 'friday'
        },
        {
          client: createdClients[2],
          name: 'Serviço Personalizado',
          amount: 200,
          recurrenceType: 'custom',
          recurrenceDays: 15
        },
        {
          client: createdClients[3],
          name: 'Plano Diário',
          amount: 25,
          recurrenceType: 'daily'
        }
      ];

      const subscriptionPromises = subscriptionData.map(data => {
        return createSubscription({
          clientId: data.client.id,
          clientName: data.client.name,
          name: data.name,
          amount: data.amount,
          recurrenceType: data.recurrenceType,
          recurrenceDays: data.recurrenceDays || 30,
          dayOfMonth: data.dayOfMonth || null,
          dayOfWeek: data.dayOfWeek || 'monday',
          startDate: currentDate,
          status: 'active'
        });
      });

      await Promise.all(subscriptionPromises);
      console.log('Dados de exemplo com diferentes recorrências criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      throw error;
    }
  }, [createClient, createSubscription]);

  return {
    clients,
    subscriptions,
    invoices,
    loading,
    error,
    
    createClient,
    updateClient,
    deleteClient,
    
    createSubscription,
    updateSubscription,
    deleteSubscription,
    
    updateInvoice,
    
    generateInvoices, // Nova função principal
    generateMonthlyInvoices, // Manter compatibilidade
    createExampleData
  };
};