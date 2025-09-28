// functions/triggers/dailyTasks.js - TAREFAS DIÁRIAS AUTOMÁTICAS
const admin = require('firebase-admin');

const dailyTasks = async (context) => {
  console.log('🌅 Iniciando tarefas diárias...');
  
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // ===== 1. VERIFICAR FATURAS VENCIDAS =====
    console.log('📅 Verificando faturas vencidas...');
    
    const overdueSnapshot = await admin.firestore()
      .collection('invoices')
      .where('status', '==', 'pending')
      .where('dueDate', '<', todayStr)
      .get();
    
    let overdueCount = 0;
    const batch = admin.firestore().batch();
    
    overdueSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'overdue',
        overdueDate: admin.firestore.FieldValue.serverTimestamp()
      });
      overdueCount++;
    });
    
    if (overdueCount > 0) {
      await batch.commit();
      console.log(`✅ ${overdueCount} faturas marcadas como vencidas`);
    }
    
    // ===== 2. GERAR FATURAS RECORRENTES =====
    console.log('🔄 Processando recorrências...');
    
    const activeSubscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();
    
    let newInvoicesCount = 0;
    
    for (const subDoc of activeSubscriptions.docs) {
      const subscription = subDoc.data();
      const subscriptionId = subDoc.id;
      
      try {
        const shouldGenerate = await checkIfShouldGenerateInvoice(subscription, subscriptionId, today);
        
        if (shouldGenerate.generate) {
          await generateRecurrentInvoice(subscription, subscriptionId, shouldGenerate.dueDate);
          newInvoicesCount++;
        }
        
      } catch (error) {
        console.error(`Erro ao processar assinatura ${subscriptionId}:`, error);
      }
    }
    
    console.log(`✅ ${newInvoicesCount} faturas recorrentes geradas`);
    
    // ===== 3. ENVIAR LEMBRETES AUTOMÁTICOS =====
    console.log('📧 Enviando lembretes automáticos...');
    
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + 3); // 3 dias antes
    const reminderDateStr = reminderDate.toISOString().split('T')[0];
    
    const upcomingInvoices = await admin.firestore()
      .collection('invoices')
      .where('status', '==', 'pending')
      .where('dueDate', '==', reminderDateStr)
      .get();
    
    let remindersCount = 0;
    
    for (const invoiceDoc of upcomingInvoices.docs) {
      const invoice = invoiceDoc.data();
      
      try {
        // Verificar se já foi enviado lembrete hoje
        const sentToday = await checkIfReminderSentToday(invoice.clientId);
        
        if (!sentToday) {
          await sendReminderNotification(invoice);
          remindersCount++;
        }
        
      } catch (error) {
        console.error(`Erro ao enviar lembrete para ${invoice.clientName}:`, error);
      }
    }
    
    console.log(`✅ ${remindersCount} lembretes enviados`);
    
    // ===== 4. LIMPEZA DE DADOS ANTIGOS =====
    console.log('🧹 Limpeza de dados antigos...');
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const oldNotifications = await admin.firestore()
      .collection('notifications')
      .where('createdAt', '<', thirtyDaysAgoStr)
      .get();
    
    if (!oldNotifications.empty) {
      const cleanupBatch = admin.firestore().batch();
      oldNotifications.docs.forEach(doc => {
        cleanupBatch.delete(doc.ref);
      });
      await cleanupBatch.commit();
      console.log(`✅ ${oldNotifications.docs.length} notificações antigas removidas`);
    }
    
    console.log('🎉 Tarefas diárias concluídas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro nas tarefas diárias:', error);
    throw error;
  }
};

// ===== FUNÇÕES AUXILIARES =====

const checkIfShouldGenerateInvoice = async (subscription, subscriptionId, currentDate) => {
  const today = currentDate.toISOString().split('T')[0];
  
  // Verificar se já existe fatura para hoje desta assinatura
  const existingInvoicesSnapshot = await admin.firestore()
    .collection('invoices')
    .where('subscriptionId', '==', subscriptionId)
    .where('generationDate', '==', today)
    .get();
  
  if (!existingInvoicesSnapshot.empty) {
    return { generate: false, reason: 'Fatura já existe para hoje' };
  }
  
  // Calcular próxima data de vencimento baseada na recorrência
  let shouldGenerate = false;
  let dueDate = today;
  
  switch (subscription.recurrenceType) {
    case 'daily':
      shouldGenerate = true;
      dueDate = today;
      break;
      
    case 'weekly':
      const dayOfWeek = currentDate.getDay(); // 0 = domingo, 6 = sábado
      const targetDayOfWeek = getDayOfWeekNumber(subscription.dayOfWeek);
      shouldGenerate = dayOfWeek === targetDayOfWeek;
      dueDate = today;
      break;
      
    case 'monthly':
      const dayOfMonth = currentDate.getDate();
      const targetDayOfMonth = subscription.dayOfMonth || 1;
      shouldGenerate = dayOfMonth === targetDayOfMonth;
      dueDate = today;
      break;
      
    case 'custom':
      // Verificar a última fatura gerada
      const lastInvoiceSnapshot = await admin.firestore()
        .collection('invoices')
        .where('subscriptionId', '==', subscriptionId)
        .orderBy('generationDate', 'desc')
        .limit(1)
        .get();
      
      if (lastInvoiceSnapshot.empty) {
        shouldGenerate = true;
        dueDate = today;
      } else {
        const lastInvoice = lastInvoiceSnapshot.docs[0].data();
        const lastGenerationDate = new Date(lastInvoice.generationDate);
        const daysDiff = Math.floor((currentDate - lastGenerationDate) / (1000 * 60 * 60 * 24));
        const recurrenceDays = subscription.recurrenceDays || 30;
        
        shouldGenerate = daysDiff >= recurrenceDays;
        dueDate = today;
      }
      break;
      
    default:
      shouldGenerate = false;
  }
  
  return { generate: shouldGenerate, dueDate };
};

const getDayOfWeekNumber = (dayOfWeekString) => {
  const days = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };
  return days[dayOfWeekString?.toLowerCase()] || 1; // Default para segunda-feira
};

const generateRecurrentInvoice = async (subscription, subscriptionId, dueDate) => {
  const today = new Date().toISOString().split('T')[0];
  
  const invoiceData = {
    clientId: subscription.clientId,
    clientName: subscription.clientName,
    subscriptionId: subscriptionId,
    amount: subscription.amount,
    description: `${subscription.name} - ${subscription.recurrenceType}`,
    dueDate: dueDate,
    generationDate: today,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await admin.firestore().collection('invoices').add(invoiceData);
  
  console.log(`✅ Fatura recorrente gerada: ${subscription.clientName} - ${subscription.name}`);
};

const checkIfReminderSentToday = async (clientId) => {
  const today = new Date().toISOString().split('T')[0];
  
  const sentTodaySnapshot = await admin.firestore()
    .collection('notifications')
    .where('clientId', '==', clientId)
    .where('type', '==', 'reminder')
    .where('sentDate', '==', today)
    .limit(1)
    .get();
  
  return !sentTodaySnapshot.empty;
};

const sendReminderNotification = async (invoice) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Registrar notificação enviada
  await admin.firestore().collection('notifications').add({
    clientId: invoice.clientId,
    invoiceId: invoice.id,
    type: 'reminder',
    channel: 'email', // ou 'whatsapp'
    status: 'sent',
    sentDate: today,
    message: `Lembrete: Fatura de R$ ${invoice.amount.toFixed(2)} vence em 3 dias`,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`📧 Lembrete enviado para: ${invoice.clientName}`);
};

module.exports = { dailyTasks };