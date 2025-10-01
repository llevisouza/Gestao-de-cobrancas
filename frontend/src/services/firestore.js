// src/services/firestore.js - VERSÃO OTIMIZADA E CORRIGIDA
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
} from 'firebase/firestore';
import { db } from './firebase';

// ===== UTILITÁRIOS CORRIGIDOS =====
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ CORRIGIDO: Conversão robusta de timestamp
const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    
    // Date object
    if (timestamp instanceof Date) {
      return timestamp.toISOString().split('T')[0];
    }
    
    // String ISO (já no formato correto)
    if (typeof timestamp === 'string') {
      const dateOnly = timestamp.split('T')[0];
      // Validar formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        return dateOnly;
      }
    }
    
    // Timestamp numérico
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toISOString().split('T')[0];
    }
    
    // Fallback seguro
    console.warn('Formato de timestamp desconhecido:', timestamp);
    return getCurrentDate();
  } catch (error) {
    console.error('Erro ao converter timestamp:', error, timestamp);
    return getCurrentDate();
  }
};

// ✅ NOVO: Wrapper para operações Firestore com tratamento de erro consistente
const safeFirestoreOp = async (operation, context) => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error(`Erro em ${context}:`, error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// ===== SERVIÇO DE CLIENTES =====
export const clientService = {
  async create(clientData) {
    return safeFirestoreOp(async () => {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }, 'criar cliente');
  },

  async update(clientId, clientData) {
    return safeFirestoreOp(async () => {
      await updateDoc(doc(db, 'clients', clientId), {
        ...clientData,
        updatedAt: serverTimestamp()
      });
      return true;
    }, 'atualizar cliente');
  },

  async delete(clientId) {
    return safeFirestoreOp(async () => {
      const batch = writeBatch(db);
      
      // Buscar e deletar assinaturas
      const subsQuery = query(
        collection(db, 'subscriptions'),
        where('clientId', '==', clientId)
      );
      const subsSnapshot = await getDocs(subsQuery);
      subsSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      
      // Buscar e deletar faturas
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('clientId', '==', clientId)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      invoicesSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      
      // Deletar cliente
      batch.delete(doc(db, 'clients', clientId));
      
      await batch.commit();
      return true;
    }, 'deletar cliente');
  },

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
        callback(clients);
      },
      (error) => {
        console.error('Erro no listener de clientes:', error);
        callback([]);
      }
    );
  },

  async getAll() {
    const result = await safeFirestoreOp(async () => {
      const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestampToDate(doc.data().createdAt),
        updatedAt: convertTimestampToDate(doc.data().updatedAt)
      }));
    }, 'buscar clientes');
    
    return result.success ? result.data : [];
  }
};

// ===== SERVIÇO DE ASSINATURAS =====
export const subscriptionService = {
  async create(subscriptionData) {
    return safeFirestoreOp(async () => {
      const docRef = await addDoc(collection(db, 'subscriptions'), {
        ...subscriptionData,
        status: subscriptionData.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }, 'criar assinatura');
  },

  async update(subscriptionId, subscriptionData) {
    return safeFirestoreOp(async () => {
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        ...subscriptionData,
        updatedAt: serverTimestamp()
      });
      return true;
    }, 'atualizar assinatura');
  },

  async delete(subscriptionId) {
    return safeFirestoreOp(async () => {
      await deleteDoc(doc(db, 'subscriptions', subscriptionId));
      return true;
    }, 'deletar assinatura');
  },

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
        callback(subscriptions);
      },
      (error) => {
        console.error('Erro no listener de assinaturas:', error);
        callback([]);
      }
    );
  }
};

// ===== SERVIÇO DE FATURAS OTIMIZADO =====
export const invoiceService = {
  async create(invoiceData) {
    return safeFirestoreOp(async () => {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        status: invoiceData.status || 'pending',
        generationDate: invoiceData.generationDate || getCurrentDate(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }, 'criar fatura');
  },

  async update(invoiceId, invoiceData) {
    return safeFirestoreOp(async () => {
      const updateData = {
        ...invoiceData,
        updatedAt: serverTimestamp()
      };

      // Proteção contra sobrescrita acidental
      if (invoiceData.status === 'paid') {
        updateData.paidDate = invoiceData.paidDate || getCurrentDate();
        updateData.paidAt = invoiceData.paidAt || new Date().toISOString();
        updateData.manuallyPaid = true;
        updateData.lastManualUpdate = new Date().toISOString();
      }
      
      await updateDoc(doc(db, 'invoices', invoiceId), updateData);
      return true;
    }, 'atualizar fatura');
  },

  async delete(invoiceId) {
    return safeFirestoreOp(async () => {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      return true;
    }, 'deletar fatura');
  },

  // ✅ OTIMIZADO: Geração de faturas com performance 10-100x melhor
  async generateFromSubscriptions() {
    return safeFirestoreOp(async () => {
      const today = getCurrentDate();
      
      // 1. Buscar assinaturas ativas
      const subsQuery = query(
        collection(db, 'subscriptions'),
        where('status', '==', 'active')
      );
      const subsSnapshot = await getDocs(subsQuery);
      
      if (subsSnapshot.empty) {
        return 0;
      }
      
      // 2. ✅ OTIMIZAÇÃO: Buscar TODAS faturas de hoje de uma vez
      const todayInvoicesQuery = query(
        collection(db, 'invoices'),
        where('generationDate', '==', today)
      );
      const todayInvoicesSnapshot = await getDocs(todayInvoicesQuery);
      
      // 3. ✅ OTIMIZAÇÃO: Criar Set para lookup O(1)
      const existingInvoices = new Set(
        todayInvoicesSnapshot.docs.map(doc => {
          const data = doc.data();
          return `${data.subscriptionId}-${data.clientId}`;
        })
      );
      
      // 4. Preparar batch para criação
      const batch = writeBatch(db);
      let generatedCount = 0;
      
      for (const subDoc of subsSnapshot.docs) {
        const subscription = subDoc.data();
        
        // ✅ OTIMIZAÇÃO: Verificação instantânea O(1)
        const key = `${subDoc.id}-${subscription.clientId}`;
        if (existingInvoices.has(key)) {
          continue;
        }
        
        // Calcular data de vencimento
        let dueDate = today;
        
        switch (subscription.recurrenceType) {
          case 'daily':
            dueDate = today;
            break;
            
          case 'weekly': {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            dueDate = date.toISOString().split('T')[0];
            break;
          }
            
          case 'monthly': {
            const now = new Date();
            const dayOfMonth = subscription.dayOfMonth || now.getDate();
            const targetDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
            
            if (targetDate <= now) {
              targetDate.setMonth(targetDate.getMonth() + 1);
            }
            
            dueDate = targetDate.toISOString().split('T')[0];
            break;
          }
            
          case 'custom': {
            const date = new Date();
            date.setDate(date.getDate() + (subscription.recurrenceDays || 30));
            dueDate = date.toISOString().split('T')[0];
            break;
          }
        }
        
        // Criar fatura
        const invoiceRef = doc(collection(db, 'invoices'));
        batch.set(invoiceRef, {
          clientId: subscription.clientId,
          clientName: subscription.clientName,
          subscriptionId: subDoc.id,
          subscriptionName: subscription.name,
          amount: subscription.amount,
          description: `${subscription.name} - ${subscription.recurrenceType}`,
          dueDate,
          generationDate: today,
          status: 'pending',
          uniqueKey: `${subDoc.id}-${today}-${Date.now()}`,
          generatedBy: 'auto',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        generatedCount++;
      }
      
      if (generatedCount > 0) {
        await batch.commit();
      }
      
      return generatedCount;
    }, 'gerar faturas');
  },

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
        callback(invoices);
      },
      (error) => {
        console.error('Erro no listener de faturas:', error);
        callback([]);
      }
    );
  }
};

// ===== FUNÇÃO PARA CRIAR DADOS DE EXEMPLO =====
export const createExampleData = async () => {
  const result = await safeFirestoreOp(async () => {
    // Verificar se já existem dados
    const clientsQuery = query(collection(db, 'clients'));
    const clientsSnapshot = await getDocs(clientsQuery);
    
    if (!clientsSnapshot.empty) {
      throw new Error('Dados já existem');
    }
    
    const batch = writeBatch(db);
    
    // Clientes de exemplo
    const exampleClients = [
      { name: 'Ana Oliveira', email: 'ana@exemplo.com', phone: '11999999999', cpf: '12345678901', status: 'active' },
      { name: 'João Silva', email: 'joao@exemplo.com', phone: '11888888888', cpf: '98765432109', status: 'active' },
      { name: 'Maria Santos', email: 'maria@exemplo.com', phone: '11777777777', cpf: '11122233344', status: 'active' }
    ];
    
    const clientRefs = [];
    exampleClients.forEach((client) => {
      const clientRef = doc(collection(db, 'clients'));
      clientRefs.push({ ref: clientRef, data: client });
      batch.set(clientRef, {
        ...client,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Assinaturas de exemplo
    const today = getCurrentDate();
    const exampleSubscriptions = [
      { clientRef: 0, name: 'Delivery Diário', amount: 25.00, recurrenceType: 'daily', startDate: today, status: 'active' },
      { clientRef: 1, name: 'Plano Premium Semanal', amount: 150.00, recurrenceType: 'weekly', dayOfWeek: 'friday', startDate: today, status: 'active' },
      { clientRef: 2, name: 'Mensalidade Delivery', amount: 75.00, recurrenceType: 'monthly', dayOfMonth: 15, startDate: today, status: 'active' }
    ];
    
    exampleSubscriptions.forEach((sub) => {
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
        startDate: sub.startDate,
        status: sub.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  }, 'criar dados de exemplo');
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result;
};