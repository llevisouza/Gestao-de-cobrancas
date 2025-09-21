# 📚 Documentação Completa - APIs e Hooks

## 🎯 Visão Geral

Esta documentação detalha todas as APIs, hooks customizados e integrações do Sistema de Cobranças. Cada seção inclui exemplos práticos, parâmetros, retornos e casos de uso.

---

## 🔥 Firebase Services

### 📄 `firestore.js` - Database Operations

#### **clientService** - Gestão de Clientes

```javascript
import { clientService } from '../services/firestore';

// ✅ Criar cliente
const result = await clientService.create({
  name: 'João Silva',
  email: 'joao@exemplo.com',
  phone: '11999999999',
  cpf: '12345678901',
  pix: 'joao@exemplo.com'
});
// Retorna: { success: true, id: 'client-id' } | { success: false, error: 'message' }

// ✅ Listar todos os clientes
const clients = await clientService.getAll();
// Retorna: Array<Client> ordenado por data de criação

// ✅ Listener em tempo real
const unsubscribe = clientService.subscribe((clients) => {
  console.log('Clientes atualizados:', clients);
});
// Cleanup: unsubscribe();

// ✅ Atualizar cliente
await clientService.update('client-id', {
  name: 'João Silva Santos',
  phone: '11888888888'
});

// ✅ Deletar cliente (e dados relacionados)
await clientService.delete('client-id');
```

#### **subscriptionService** - Gestão de Assinaturas

```javascript
import { subscriptionService } from '../services/firestore';

// ✅ Criar assinatura com recorrência
const subscription = {
  clientId: 'client-123',
  clientName: 'João Silva',
  name: 'Plano Premium',
  amount: 150.00,
  recurrenceType: 'monthly', // daily | weekly | monthly | custom
  dayOfMonth: 15, // Para monthly
  dayOfWeek: 'friday', // Para weekly  
  recurrenceDays: 30, // Para custom
  startDate: '2024-01-15',
  status: 'active'
};

const result = await subscriptionService.create(subscription);

// ✅ Real-time listener
const unsubscribe = subscriptionService.subscribe((subscriptions) => {
  // Processamento automático quando há mudanças
});
```

#### **invoiceService** - Gestão de Faturas

```javascript
import { invoiceService } from '../services/firestore';

// ✅ Gerar faturas mensais (com anti-duplicidade)
const count = await invoiceService.generateForMonth(1, 2024); // Feb 2024
console.log(`${count} faturas geradas`);

// ✅ Atualizar status de fatura
await invoiceService.update('invoice-id', {
  status: 'paid',
  paidDate: '2024-02-20'
});

// ✅ Listener com transformação de dados
const unsubscribe = invoiceService.subscribe((invoices) => {
  // Faturas já vêm com datas convertidas e ordenadas
});
```

---

## 🎣 Custom Hooks

### **useFirestore** - Hook Principal do Banco

```javascript
import { useFirestore } from '../hooks/useFirestore';

function MyComponent() {
  const {
    // 📊 Estados
    clients,
    subscriptions, 
    invoices,
    loading,
    error,
    
    // 👥 Clientes
    createClient,
    updateClient,
    deleteClient,
    
    // 💳 Assinaturas  
    createSubscription,
    updateSubscription,
    deleteSubscription,
    
    // 📋 Faturas
    updateInvoice,
    generateInvoices, // Nova função inteligente
    generateMonthlyInvoices, // Compatibilidade
    
    // 🌱 Utilitários
    createExampleData
  } = useFirestore();

  // Exemplo de uso
  const handleCreateClient = async (clientData) => {
    try {
      const clientId = await createClient(clientData);
      console.log('Cliente criado:', clientId);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div>
          <h2>{clients.length} clientes</h2>
          <button onClick={() => generateInvoices()}>
            Gerar Faturas Inteligentes
          </button>
        </div>
      )}
    </div>
  );
}
```

**Funcionalidades Avançadas:**

- ✅ **Anti-duplicidade**: Previne faturas duplicadas automaticamente
- ✅ **Real-time sync**: Atualizações automáticas via Firestore listeners
- ✅ **Cleanup automático**: Remove dados órfãos periodicamente
- ✅ **Sistema de recorrência**: Suporta 4 tipos diferentes
- ✅ **Error handling**: Tratamento robusto de erros
- ✅ **Performance**: Cache inteligente e otimizações

### **useFirebaseAuth** - Autenticação

```javascript
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

function LoginComponent() {
  const { 
    user, 
    loading, 
    signIn, 
    signInWithGoogle, 
    logout 
  } = useFirebaseAuth();

  const handleLogin = async (email, password) => {
    const result = await signIn(email, password);
    if (!result.success) {
      alert(result.error);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return user ? (
    <div>
      <p>Bem-vindo, {user.email}!</p>
      <button onClick={logout}>Sair</button>
    </div>
  ) : (
    <LoginForm onSubmit={handleLogin} />
  );
}
```

### **useNotifications** - Sistema de Notificações

```javascript
import { useNotifications } from '../hooks/useNotifications';

function NotificationCenter() {
  const {
    // 📧 Email
    sendEmailNotification,
    getEmailHistory,
    
    // 📱 WhatsApp  
    sendWhatsAppNotification,
    checkWhatsAppConnection,
    
    // 📊 Analytics
    getNotificationStats,
    
    // ⚙️ Status
    isEmailConfigured,
    isWhatsAppConnected
  } = useNotifications();

  const sendReminder = async (invoice, client) => {
    try {
      // Tenta WhatsApp primeiro, fallback para email
      let result = await sendWhatsAppNotification({
        type: 'reminder',
        invoice,
        client
      });

      if (!result.success) {
        result = await sendEmailNotification({
          type: 'reminder', 
          invoice,
          client
        });
      }

      console.log('Notificação enviada:', result);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  return (
    <div>
      <div>
        📧 Email: {isEmailConfigured ? '✅' : '❌'}
      </div>
      <div>
        📱 WhatsApp: {isWhatsAppConnected ? '✅' : '❌'}
      </div>
    </div>
  );
}
```

### **useAutomation** - Automação Avançada

```javascript
import { useAutomation } from '../hooks/useAutomation';

function AutomationDashboard() {
  const {
    // 🤖 Controles
    isRunning,
    startAutomation,
    stopAutomation,
    runManualCycle,
    
    // ⚙️ Configuração
    config,
    updateConfig,
    
    // 📊 Métricas
    getAutomationStats,
    getLogs,
    
    // 🔍 Status
    getStatus,
    testConnections
  } = useAutomation();

  const handleStartAutomation = async () => {
    const result = await startAutomation();
    if (result.success) {
      console.log('Automação iniciada!');
    }
  };

  return (
    <div>
      <div>
        Status: {isRunning ? '🟢 Ativo' : '🔴 Parado'}
      </div>
      
      <button onClick={handleStartAutomation}>
        {isRunning ? 'Parar' : 'Iniciar'} Automação
      </button>
      
      <button onClick={runManualCycle}>
        Executar Ciclo Manual
      </button>
    </div>
  );
}
```

---

## 📧 Email Service - EmailJS Integration

### Configuração

```javascript
// .env.local
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxxxx
REACT_APP_EMAILJS_TEMPLATE_OVERDUE=template_overdue
REACT_APP_EMAILJS_TEMPLATE_REMINDER=template_reminder
REACT_APP_EMAILJS_TEMPLATE_PAYMENT=template_payment
REACT_APP_EMAILJS_PUBLIC_KEY=sua_public_key
```

### Uso do Serviço

```javascript
import { emailService } from '../services/emailService';

// ✅ Envio individual
const result = await emailService.sendOverdueNotification(invoice, client);
if (result.success) {
  console.log('Email enviado!');
} else {
  console.error('Erro:', result.error);
}

// ✅ Envio em lote (com rate limiting)
const notifications = [
  { type: 'reminder', invoice: invoice1, client: client1 },
  { type: 'overdue', invoice: invoice2, client: client2 }
];

const results = await emailService.sendBulkEmails(notifications, 2000); // 2s delay
results.forEach(result => {
  console.log(`${result.client}: ${result.success ? '✅' : '❌'}`);
});

// ✅ Histórico de emails
const history = await emailService.getEmailHistory('client-id', 10);
history.forEach(email => {
  console.log(`${email.type} - ${email.status} - ${email.sentAt}`);
});

// ✅ Verificar se já foi enviado hoje (anti-spam)
const sentToday = await emailService.wasEmailSentToday