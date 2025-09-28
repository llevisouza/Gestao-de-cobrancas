# Backend Documentation - Sistema de Cobranças v2.1

## Visão Geral do Backend

O backend do Sistema de Cobranças é baseado em Firebase e utiliza uma arquitetura serverless com Cloud Functions para processos automatizados e integrações com APIs externas.

## Estrutura do Backend

```
backend/
├── functions/                    # Firebase Cloud Functions
│   ├── triggers/                # Gatilhos automáticos
│   ├── automation/              # Automação de processos
│   ├── notifications/           # Sistema de notificações
│   └── reports/                 # Relatórios automáticos
├── firestore.rules              # Regras de segurança Firestore
├── firestore.indexes.json       # Índices do banco de dados
├── firebase.json                # Configuração do Firebase
├── .env.example                 # Template de variáveis de ambiente
└── docs/                        # Documentação específica
    ├── api_documentation.md     # Documentação das APIs
    └── whatsapp-implementation-guide.md
```

## Firebase Cloud Functions

### Estrutura das Functions

#### triggers/ - Gatilhos Automáticos

**dailyTasks.js**
- Execução: Todos os dias às 08:00
- Funções:
  - Verificação de faturas vencidas
  - Limpeza de dados temporários
  - Relatórios diários automatizados
  - Backup incremental de dados

**weeklyReports.js**
- Execução: Domingos às 23:00
- Funções:
  - Consolidação de métricas semanais
  - Relatórios de performance
  - Análise de tendências
  - Envio de resumos executivos

**monthlyAnalytics.js**
- Execução: Primeiro dia do mês às 00:00
- Funções:
  - Processamento de analytics mensais
  - Cálculo de KPIs consolidados
  - Geração de faturas recorrentes
  - Arquivamento de dados antigos

#### automation/ - Automação de Processos

**collectionAutomation.js**
- Responsabilidades:
  - Escalonamento inteligente de cobranças
  - Verificação de horário comercial
  - Prevenção de spam (1 mensagem/dia/cliente)
  - Integração com canais de notificação
  - Logs detalhados de todas as operações

**invoiceGenerator.js**
- Responsabilidades:
  - Geração automática de faturas recorrentes
  - Sistema anti-duplicidade
  - Cálculo de valores e datas
  - Atribuição de status inicial
  - Notificação de novas faturas

**overdueChecker.js**
- Responsabilidades:
  - Verificação contínua de vencimentos
  - Atualização automática de status
  - Trigger para sistema de cobranças
  - Cálculo de multas e juros
  - Geração de relatórios de inadimplência

#### notifications/ - Sistema de Notificações

**emailNotifications.js**
- Integrações:
  - EmailJS para envio
  - Templates dinâmicos
  - Sistema de filas
  - Rate limiting
  - Retry automático

**whatsappNotifications.js**
- Integrações:
  - Evolution API
  - Gerenciamento de instâncias
  - Templates com variáveis
  - Status de entrega
  - Fallback para outros canais

**notificationScheduler.js**
- Responsabilidades:
  - Agendamento inteligente
  - Priorização de mensagens
  - Controle de frequência
  - Análise de melhor horário
  - Queue management

#### reports/ - Relatórios Automáticos

**pdfGenerator.js**
- Funcionalidades:
  - Geração de faturas em PDF
  - Relatórios gerenciais
  - Templates profissionais
  - Marca d'água automática
  - Storage otimizado

**analyticsProcessor.js**
- Responsabilidades:
  - Processamento de dados pesados
  - Cálculos estatísticos
  - Análise de tendências
  - Segmentação de clientes
  - Previsões baseadas em ML

**reportScheduler.js**
- Funções:
  - Agendamento de relatórios
  - Distribuição automática
  - Formatos múltiplos
  - Compressão de arquivos
  - Limpeza de arquivos antigos

## Banco de Dados - Firestore

### Estrutura das Collections

#### clients
```json
{
  "id": "auto-generated",
  "name": "string",
  "email": "string",
  "phone": "string",
  "cpf": "string",
  "pix": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "status": "active|inactive"
}
```

#### subscriptions
```json
{
  "id": "auto-generated",
  "clientId": "reference",
  "clientName": "string",
  "name": "string",
  "amount": "number",
  "recurrenceType": "daily|weekly|monthly|custom",
  "dayOfMonth": "number",
  "dayOfWeek": "string",
  "recurrenceDays": "number",
  "startDate": "string",
  "status": "active|inactive|paused",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### invoices
```json
{
  "id": "auto-generated",
  "clientId": "reference",
  "subscriptionId": "reference",
  "clientName": "string",
  "subscriptionName": "string",
  "amount": "number",
  "dueDate": "string",
  "status": "pending|paid|overdue",
  "paidDate": "string|null",
  "createdAt": "timestamp",
  "generatedBy": "auto|manual"
}
```

#### notifications
```json
{
  "id": "auto-generated",
  "clientId": "reference",
  "invoiceId": "reference",
  "type": "reminder|overdue|payment|new_invoice",
  "channel": "email|whatsapp",
  "status": "sent|delivered|failed",
  "sentAt": "timestamp",
  "deliveredAt": "timestamp|null",
  "message": "string",
  "response": "object"
}
```

### Índices do Firestore (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "clientId", "order": "ASCENDING"},
        {"fieldPath": "dueDate", "order": "DESCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "subscriptions",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "clientId", "order": "ASCENDING"},
        {"fieldPath": "startDate", "order": "DESCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "name", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Regras de Segurança (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Clients collection
    match /clients/{clientId} {
      allow read, write: if request.auth != null;
    }
    
    // Subscriptions collection
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null;
    }
    
    // Invoices collection
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // System logs (read-only for users)
    match /logs/{logId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write logs
    }
  }
}
```

## APIs e Integrações

### Firebase Services

#### Authentication
```javascript
// Configuração de autenticação
const auth = getAuth();
const signInConfig = {
  signInSuccessUrl: '/dashboard',
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID,
    GoogleAuthProvider.PROVIDER_ID
  ]
};
```

#### Cloud Functions Deployment
```bash
# Deploy todas as functions
firebase deploy --only functions

# Deploy function específica
firebase deploy --only functions:dailyTasks

# Visualizar logs
firebase functions:log
```

### EmailJS Integration

**Configuração:**
```javascript
// Service configuration
const emailConfig = {
  serviceId: process.env.EMAILJS_SERVICE_ID,
  templates: {
    reminder: process.env.EMAILJS_TEMPLATE_REMINDER,
    overdue: process.env.EMAILJS_TEMPLATE_OVERDUE,
    payment: process.env.EMAILJS_TEMPLATE_PAYMENT,
    new_invoice: process.env.EMAILJS_TEMPLATE_NEW
  },
  publicKey: process.env.EMAILJS_PUBLIC_KEY
};
```

**Rate Limiting:**
```javascript
const rateLimiter = {
  maxEmailsPerMinute: 10,
  maxEmailsPerHour: 100,
  delayBetweenEmails: 2000 // 2 seconds
};
```

### WhatsApp Evolution API

**Configuração Base:**
```javascript
const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL,
  apiKey: process.env.WHATSAPP_API_KEY,
  instance: process.env.WHATSAPP_INSTANCE,
  webhook: process.env.WHATSAPP_WEBHOOK_URL
};
```

**Endpoints Principais:**
- `GET /instance/connect` - Conectar instância
- `GET /instance/qr` - Obter QR Code
- `POST /message/sendText` - Enviar mensagem
- `GET /instance/status` - Status da conexão

### Automação e Cron Jobs

**Configuração de Cron:**
```javascript
const cronConfig = {
  dailyTasks: '0 8 * * *',      // 08:00 todos os dias
  weeklyReports: '0 23 * * 0',   // 23:00 aos domingos
  monthlyAnalytics: '0 0 1 * *', // 00:00 no dia 1 de cada mês
  overdueCheck: '*/10 * * * *'   // A cada 10 minutos
};
```

**Horário Comercial:**
```javascript
const businessHours = {
  start: '08:00',
  end: '18:00',
  timezone: 'America/Sao_Paulo',
  workDays: [1, 2, 3, 4, 5], // Segunda a Sexta
  holidays: [] // Array de datas em formato YYYY-MM-DD
};
```

## Variáveis de Ambiente

### .env.example
```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_REMINDER=template_reminder_id
EMAILJS_TEMPLATE_OVERDUE=template_overdue_id
EMAILJS_TEMPLATE_PAYMENT=template_payment_id
EMAILJS_TEMPLATE_NEW=template_new_invoice_id
EMAILJS_PUBLIC_KEY=your_public_key

# WhatsApp Evolution API
WHATSAPP_API_URL=https://your_evolution_api_url
WHATSAPP_API_KEY=your_api_key
WHATSAPP_INSTANCE_NAME=your_instance_name
WHATSAPP_WEBHOOK_URL=your_webhook_url

# Company Information
COMPANY_NAME="Sua Empresa"
COMPANY_PHONE="(11) 99999-9999"
COMPANY_PIX="sua-chave-pix"
COMPANY_EMAIL="contato@empresa.com"

# Other Settings
NODE_ENV=development
PORT=5000
TZ=America/Sao_Paulo
```

## Monitoramento e Logs

### Sistema de Logs
```javascript
const logLevels = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug'
};

// Estrutura padrão de log
const logEntry = {
  timestamp: new Date().toISOString(),
  level: logLevels.INFO,
  function: 'functionName',
  message: 'Log message',
  data: {}, // Dados adicionais
  userId: 'user_id',
  requestId: 'request_id'
};
```

### Métricas de Performance
```javascript
const performanceMetrics = {
  functionExecutionTime: 'milliseconds',
  databaseQueries: 'count',
  apiCalls: 'count',
  memoryUsage: 'MB',
  errorRate: 'percentage',
  successRate: 'percentage'
};
```

## Deployment e CI/CD

### Scripts de Deploy
```bash
# Build e deploy completo
npm run build && firebase deploy

# Deploy apenas functions
firebase deploy --only functions

# Deploy apenas Firestore rules
firebase deploy --only firestore:rules

# Deploy apenas indexes
firebase deploy --only firestore:indexes
```

### Configuração Firebase (firebase.json)
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Segurança

### Proteções Implementadas
- **Authentication**: Firebase Auth com email/senha
- **Authorization**: Firestore rules baseadas em usuário
- **Input Validation**: Validação em todas as functions
- **Rate Limiting**: Controle de taxa para APIs externas
- **Data Sanitization**: Limpeza de dados de entrada
- **Encryption**: Dados sensíveis criptografados

### Backup e Recovery
```javascript
// Configuração de backup automático
const backupConfig = {
  schedule: 'daily',
  time: '02:00',
  retention: '30 days',
  location: 'us-central1',
  collections: ['clients', 'subscriptions', 'invoices']
};
```

## Troubleshooting

### Problemas Comuns

#### Functions não executam
```bash
# Verificar logs
firebase functions:log

# Verificar configuração
firebase functions:config:get

# Redeploy
firebase deploy --only functions
```

#### Problemas de conexão WhatsApp
```bash
# Verificar status da Evolution API
curl -X GET "http://localhost:8080/instance/status"

# Recriar instância se necessário
curl -X POST "http://localhost:8080/instance/create"
```

#### Firestore rules bloqueando
```javascript
// Testar rules no console do Firebase
// Ou usar o emulador local
firebase emulators:start --only firestore
```

---

**Documentação Backend**  
**Última atualização:** Setembro 2025 - v2.1.0