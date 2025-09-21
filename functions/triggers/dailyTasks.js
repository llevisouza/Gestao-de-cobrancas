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
        
        if (!sent