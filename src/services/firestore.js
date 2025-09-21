// src/services/firestore.js - VERSÃO CORRIGIDA COM PERSISTÊNCIA
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  query, 
  where,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ===== UTILITÁRIOS =====
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate().toISOString().split('T')[0];
  if (timestamp instanceof Date) return timestamp.toISOString().split('T')[0];
  return timestamp;
};

// ===== SERVIÇO DE CLIENTES CORRIGIDO =====
export const clientService = {
  // Criar cliente
  async create(clientData) {
    try {
      console.log('🔄 Criando cliente:', clientData);
      
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Cliente criado com ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar cliente
  async update(clientId, clientData) {
    try {
      console.log('🔄 Atualizando cliente:', clientId, clientData);
      
      await updateDoc(doc(db, 'clients', clientId), {
        ...clientData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Cliente atualizado:', clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return { success: false, error: error.message };
    }
  },

  // Deletar cliente e dados relacionados
  async delete(clientId) {
    try {
      console.log('🔄 Deletando cliente e dados relacionados:', clientId);
      
      const batch = writeBatch(db);
      
      // Buscar e deletar assinaturas do cliente
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('clientId', '==', clientId)
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      subscriptionsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        console.log('🗑️ Marcando assinatura para deletar:', docSnap.id);
      });
      
      // Buscar e deletar faturas do cliente
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('clientId', '==', clientId)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      
      invoicesSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        console.log('🗑️ Marcando fatura para deletar:', docSnap.id);
      });
      
      // Deletar o cliente
      batch.delete(doc(db, 'clients', clientId));
      console.log('🗑️ Marcando cliente para deletar:', clientId);
      
      // Executar todas as operações
      await batch.commit();
      
      console.log('✅ Cliente e dados relacionados deletados:', clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      return { success: false, error: error.message };
    }
  },

  // Listener em tempo real
  subscribe(callback) {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (snapshot) => {
        const clients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestampToDate(doc.data().createdAt),
          updatedAt: convertTimestampToDate(doc.data().updatedAt)
        }));
        
        console.log('📡 Clientes atualizados:', clients.length);
        callback(clients);
      },
      (error) => {
        console.error('❌ Erro no listener de clientes:', error);
        callback([]);
      }
    );
  },

  // Buscar todos
  async getAll() {
    try {
      const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestampToDate(doc.data().createdAt),
        updatedAt: convertTimestampToDate(doc.data().updatedAt)
      }));
      
      console.log('📋 Clientes carregados:', clients.length);
      return clients;
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      return [];
    }
  }
};

// ===== SERVIÇO DE ASSINATURAS CORRIGIDO =====
export const subscriptionService = {
  // Criar assinatura
  async create(subscriptionData) {
    try {
      console.log('🔄 Criando assinatura:', subscriptionData);
      
      const docRef = await addDoc(collection(db, 'subscriptions'), {
        ...subscriptionData,
        status: subscriptionData.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Assinatura criada com ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar assinatura
  async update(subscriptionId, subscriptionData) {
    try {
      console.log('🔄 Atualizando assinatura:', subscriptionId, subscriptionData);
      
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        ...subscriptionData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Assinatura atualizada:', subscriptionId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Deletar assinatura
  async delete(subscriptionId) {
    try {
      console.log('🔄 Deletando assinatura:', subscriptionId);
      
      await deleteDoc(doc(db, 'subscriptions', subscriptionId));
      
      console.log('✅ Assinatura deletada:', subscriptionId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar assinatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Listener em tempo real
  subscribe(callback) {
    const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q,
      (snapshot) => {
        const subscriptions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestampToDate(doc.data().createdAt),
          updatedAt: convertTimestampToDate(doc.data().updatedAt)
        }));
        
        console.log('📡 Assinaturas atualizadas:', subscriptions.length);
        callback(subscriptions);
      },
      (error) => {
        console.error('❌ Erro no listener de assinaturas:', error);
        callback([]);
      }
    );
  }
};

// ===== SERVIÇO DE FATURAS CORRIGIDO =====
export const invoiceService = {
  // Criar fatura
  async create(invoiceData) {
    try {
      console.log('🔄 Criando fatura:', invoiceData);
      
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        status: invoiceData.status || 'pending',
        generationDate: invoiceData.generationDate || getCurrentDate(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Fatura criada com ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar fatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar fatura
  async update(invoiceId, invoiceData) {
    try {
      console.log('🔄 Atualizando fatura:', invoiceId, invoiceData);
      
      const updateData = {
        ...invoiceData,
        updatedAt: serverTimestamp()
      };

      // Se marcando como pago, adicionar data de pagamento
      if (invoiceData.status === 'paid' && !invoiceData.paidDate) {
        updateData.paidDate = getCurrentDate();
      }
      
      await updateDoc(doc(db, 'invoices', invoiceId), updateData);
      
      console.log('✅ Fatura atualizada:', invoiceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar fatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Deletar fatura
  async delete(invoiceId) {
    try {
      console.log('🔄 Deletando fatura:', invoiceId);
      
      await deleteDoc(doc(db, 'invoices', invoiceId));
      
      console.log('✅ Fatura deletada:', invoiceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar fatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Gerar faturas baseadas em assinaturas ativas
  async generateFromSubscriptions() {
    try {
      console.log('🔄 Gerando faturas das assinaturas ativas...');
      
      // Buscar assinaturas ativas
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('status', '==', 'active')
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      const batch = writeBatch(db);
      let generatedCount = 0;
      const today = getCurrentDate();
      
      for (const subDoc of subscriptionsSnapshot.docs) {
        const subscription = subDoc.data();
        
        // Verificar se já existe fatura para hoje
        const existingInvoicesQuery = query(
          collection(db, 'invoices'),
          where('subscriptionId', '==', subDoc.id),
          where('generationDate', '==', today)
        );
        const existingSnapshot = await getDocs(existingInvoicesQuery);
        
        if (!existingSnapshot.empty) {
          console.log('⚠️ Fatura já existe para hoje:', subDoc.id);
          continue;
        }
        
        // Calcular data de vencimento baseada na recorrência
        let dueDate = today;
        
        if (subscription.recurrenceType === 'daily') {
          dueDate = today;
        } else if (subscription.recurrenceType === 'weekly') {
          // Adicionar 7 dias
          const date = new Date();
          date.setDate(date.getDate() + 7);
          dueDate = date.toISOString().split('T')[0];
        } else if (subscription.recurrenceType === 'monthly') {
          // Usar dia específico do mês
          const now = new Date();
          const dayOfMonth = subscription.dayOfMonth || now.getDate();
          const targetDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
          
          // Se já passou este mês, usar próximo mês
          if (targetDate <= now) {
            targetDate.setMonth(targetDate.getMonth() + 1);
          }
          
          dueDate = targetDate.toISOString().split('T')[0];
        } else if (subscription.recurrenceType === 'custom') {
          const date = new Date();
          date.setDate(date.getDate() + (subscription.recurrenceDays || 30));
          dueDate = date.toISOString().split('T')[0];
        }
        
        // Criar fatura
        const invoiceRef = doc(collection(db, 'invoices'));
        batch.set(invoiceRef, {
          clientId: subscription.clientId,
          clientName: subscription.clientName,
          subscriptionId: subDoc.id,
          amount: subscription.amount,
          description: `${subscription.name} - ${subscription.recurrenceType}`,
          dueDate,
          generationDate: today,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        generatedCount++;
        console.log('✅ Fatura preparada para:', subscription.clientName);
      }
      
      if (generatedCount > 0) {
        await batch.commit();
        console.log(`🎉 ${generatedCount} faturas geradas com sucesso!`);
      } else {
        console.log('ℹ️ Nenhuma fatura para gerar no momento');
      }
      
      return generatedCount;
    } catch (error) {
      console.error('❌ Erro ao gerar faturas:', error);
      throw error;
    }
  },

  // Listener em tempo real
  subscribe(callback) {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q,
      (snapshot) => {
        const invoices = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestampToDate(doc.data().createdAt),
          updatedAt: convertTimestampToDate(doc.data().updatedAt)
        }));
        
        console.log('📡 Faturas atualizadas:', invoices.length);
        callback(invoices);
      },
      (error) => {
        console.error('❌ Erro no listener de faturas:', error);
        callback([]);
      }
    );
  }
};

// ===== FUNÇÃO PARA CRIAR DADOS DE EXEMPLO CORRIGIDA =====
export const createExampleData = async () => {
  try {
    console.log('🔄 Criando dados de exemplo...');
    
    const batch = writeBatch(db);
    
    // Verificar se já existem dados
    const clientsQuery = query(collection(db, 'clients'));
    const clientsSnapshot = await getDocs(clientsQuery);
    
    if (!clientsSnapshot.empty) {
      console.log('⚠️ Já existem dados. Cancelando criação de exemplos.');
      return { success: false, message: 'Dados já existem' };
    }
    
    // Clientes de exemplo
    const exampleClients = [
      {
        name: 'Ana Oliveira',
        email: 'ana@exemplo.com',
        phone: '11999999999',
        cpf: '12345678901',
        status: 'active'
      },
      {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        phone: '11888888888',
        cpf: '98765432109',
        status: 'active'
      },
      {
        name: 'Maria Santos',
        email: 'maria@exemplo.com',
        phone: '11777777777',
        cpf: '11122233344',
        status: 'active'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro@exemplo.com',
        phone: '11666666666',
        cpf: '55566677788',
        status: 'active'
      }
    ];
    
    const clientRefs = [];
    exampleClients.forEach((client, index) => {
      const clientRef = doc(collection(db, 'clients'));
      clientRefs.push({ ref: clientRef, data: client });
      batch.set(clientRef, {
        ...client,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Assinaturas de exemplo com diferentes tipos de recorrência
    const exampleSubscriptions = [
      // Ana - Delivery Diário
      {
        clientRef: 0,
        name: 'Delivery Diário',
        amount: 25.00,
        recurrenceType: 'daily',
        startDate: getCurrentDate(),
        status: 'active'
      },
      // João - Plano Semanal (Sexta-feira)
      {
        clientRef: 1,
        name: 'Plano Premium Semanal',
        amount: 150.00,
        recurrenceType: 'weekly',
        dayOfWeek: 'friday',
        startDate: getCurrentDate(),
        status: 'active'
      },
      // Maria - Mensalidade (Dia 15)
      {
        clientRef: 2,
        name: 'Mensalidade Delivery',
        amount: 75.00,
        recurrenceType: 'monthly',
        dayOfMonth: 15,
        startDate: getCurrentDate(),
        status: 'active'
      },
      // Pedro - Personalizada (A cada 10 dias)
      {
        clientRef: 3,
        name: 'Plano Personalizado',
        amount: 120.00,
        recurrenceType: 'custom',
        recurrenceDays: 10,
        startDate: getCurrentDate(),
        status: 'active'
      },
      // Ana - Segunda assinatura (Mensal)
      {
        clientRef: 0,
        name: 'Plano Premium Mensal',
        amount: 200.00,
        recurrenceType: 'monthly',
        dayOfMonth: 1,
        startDate: getCurrentDate(),
        status: 'active'
      }
    ];
    
    exampleSubscriptions.forEach((sub, index) => {
      const subscriptionRef = doc(collection(db, 'subscriptions'));
      const clientData = clientRefs[sub.clientRef];
      
      batch.set(subscriptionRef, {
        clientId: clientData.ref.id,
        clientName: clientData.data.name,
        name: sub.name,
        amount: sub.amount,
        recurrenceType: sub.recurrenceType,
        dayOfWeek: sub.dayOfWeek,
        dayOfMonth: sub.dayOfMonth,
        recurrenceDays: sub.recurrenceDays,
        startDate: sub.startDate,
        status: sub.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Faturas de exemplo
    const today = getCurrentDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const exampleInvoices = [
      {
        clientRef: 0,
        amount: 25.00,
        description: 'Delivery Diário - 01/01/2024',
        generationDate: yesterday.toISOString().split('T')[0],
        dueDate: yesterday.toISOString().split('T')[0],
        status: 'paid',
        paidDate: yesterday.toISOString().split('T')[0]
      },
      {
        clientRef: 1,
        amount: 150.00,
        description: 'Plano Premium Semanal',
        generationDate: today,
        dueDate: today,
        status: 'pending'
      },
      {
        clientRef: 2,
        amount: 75.00,
        description: 'Mensalidade Delivery',
        generationDate: lastWeek.toISOString().split('T')[0],
        dueDate: lastWeek.toISOString().split('T')[0],
        status: 'overdue'
      },
      {
        clientRef: 3,
        amount: 120.00,
        description: 'Plano Personalizado',
        generationDate: today,
        dueDate: today,
        status: 'pending'
      }
    ];
    
    exampleInvoices.forEach((invoice, index) => {
      const invoiceRef = doc(collection(db, 'invoices'));
      const clientData = clientRefs[invoice.clientRef];
      
      batch.set(invoiceRef, {
        clientId: clientData.ref.id,
        clientName: clientData.data.name,
        amount: invoice.amount,
        description: invoice.description,
        generationDate: invoice.generationDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        paidDate: invoice.paidDate || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Executar todas as operações
    await batch.commit();
    
    console.log('✅ Dados de exemplo criados com sucesso!');
    return { success: true, message: 'Dados de exemplo criados' };
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
    return { success: false, error: error.message };
  }
};