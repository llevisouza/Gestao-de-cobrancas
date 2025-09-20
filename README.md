# Sistema de Gestão de Cobranças

Um sistema completo de gestão de cobranças recorrentes desenvolvido com React e Firebase, ideal para freelancers e pequenas empresas que precisam gerenciar clientes, assinaturas e faturas de forma eficiente.

## 🚀 Funcionalidades

### ✅ **Gestão de Clientes**
- Cadastro completo de clientes (nome, email, telefone, documento, endereço)
- Busca e filtros avançados
- Histórico de atividades
- Status de cliente (ativo/inativo)

### ✅ **Sistema de Assinaturas**
- Criação de assinaturas recorrentes
- Múltiplos ciclos de cobrança (mensal, trimestral, semestral, anual)
- Serviços pré-definidos configuráveis
- Status de assinatura (ativa, pausada, cancelada)

### ✅ **Gestão de Faturas**
- Geração automática de faturas baseada nas assinaturas
- Controle de status (pendente, paga, vencida)
- Atualização automática de faturas vencidas
- Histórico de pagamentos

### ✅ **Dashboard e Relatórios**
- KPIs em tempo real
- Relatórios por período
- Exportação para CSV
- Filtros avançados por data e status

### ✅ **Autenticação Firebase**
- Login/logout seguro
- Gerenciamento de usuários
- Proteção de rotas

## 📱 Interface

- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **UI/UX Moderna**: Interface clean e intuitiva
- **Tempo Real**: Dados atualizados automaticamente via Firestore
- **Loading States**: Indicadores visuais de carregamento
- **Feedback Visual**: Mensagens de sucesso e erro

## 🛠 Tecnologias Utilizadas

- **Frontend**: React 18, Hooks, Context API
- **Backend**: Firebase (Firestore, Authentication)
- **Styling**: CSS3 com variáveis customizadas
- **Estado**: React Hooks (useState, useEffect)
- **Data**: Firestore em tempo real
- **Build**: Create React App

## 📦 Estrutura do Projeto

```
sistema-cobrancas/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/           # Componentes de autenticação
│   │   ├── common/         # Componentes reutilizáveis
│   │   ├── dashboard/      # Dashboard e KPIs
│   │   ├── clients/        # Gestão de clientes
│   │   └── reports/        # Relatórios
│   ├── hooks/              # Custom hooks
│   ├── services/           # Integração Firebase
│   ├── utils/              # Funções utilitárias
│   └── styles/             # Estilos CSS
├── package.json
└── README.md
```

## 🔧 Instalação e Configuração

### 1. **Pré-requisitos**
- Node.js 16+ e npm/yarn
- Conta no Firebase
- Editor de código (VS Code recomendado)

### 2. **Clone e Instalação**
```bash
git clone <seu-repositorio>
cd sistema-cobrancas
npm install
```

### 3. **Configuração do Firebase**

#### 3.1. Criar projeto no Firebase Console
1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Escolha um nome para o projeto
4. Ative o Google Analytics (opcional)

#### 3.2. Configurar Authentication
1. No console Firebase: **Authentication** → **Começar**
2. **Sign-in method** → **Email/senha** → **Ativar**
3. **Users** → **Adicionar usuário**
   - Email: admin@exemplo.com
   - Senha: (sua senha segura)

#### 3.3. Configurar Firestore Database
1. **Firestore Database** → **Criar banco de dados**
2. **Modo de produção** → **Avançar**
3. **Localização**: us-central1 → **Concluído**

#### 3.4. Configurar Regras de Segurança

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 3.5. Obter Configurações
1. **Configurações do projeto** → **Seus aplicativos**
2. **Adicionar app** → **Web** (🌐)
3. **Registrar app** → Copiar configuração

### 4. **Configurar Variáveis de Ambiente**

Crie o arquivo `.env.local` na raiz do projeto:
```env
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 5. **Executar o Projeto**
```bash
npm start
```

Acesse: http://localhost:3000

## 📚 Como Usar

### 1. **Primeiro Acesso**
- Faça login com as credenciais criadas no Firebase
- Clique em **"Dados Exemplo"** para popular o sistema
- Explore as funcionalidades

### 2. **Fluxo de Trabalho Recomendado**
1. **Cadastrar Clientes** → Página "Clientes"
2. **Criar Assinaturas** → Botão "Nova Assinatura"
3. **Gerar Faturas** → Dashboard → "Gerar Faturas"
4. **Acompanhar Resultados** → Dashboard e Relatórios

### 3. **Principais Ações**
- ➕ **Novo Cliente**: Cadastrar cliente completo
- 🔄 **Nova Assinatura**: Vincular serviços ao cliente
- 🧾 **Gerar Faturas**: Criar faturas do mês automaticamente
- 📊 **Relatórios**: Filtrar e exportar dados
- ✅ **Marcar como Paga**: Atualizar status das faturas

## 🎯 Funcionalidades Avançadas

### **Dados de Exemplo**
O sistema inclui dados de exemplo para teste:
- 5 clientes fictícios
- 8 assinaturas variadas
- Faturas dos últimos 3 meses
- Diferentes status e valores

### **Geração Automática de Faturas**
- Baseada nas assinaturas ativas
- Respeita o ciclo de cobrança
- Calcula data de vencimento automaticamente
- Evita duplicatas

### **Relatórios Dinâmicos**
- Filtros por período (hoje, mês, ano)
- Filtros por status
- Exportação CSV completa
- Ordenação por colunas

### **Tempo Real**
- Dados sincronizados automaticamente
- Múltiplos usuários simultâneos
- Atualizações instantâneas

## 🔒 Segurança

- **Autenticação obrigatória** para acesso
- **Regras de segurança** do Firestore
- **Validação de dados** no frontend
- **Variáveis de ambiente** para configurações sensíveis

## 🚀 Deploy

### **Firebase Hosting**
```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### **Vercel/Netlify**
1. Conecte o repositório
2. Configure as variáveis de ambiente
3. Deploy automático

## 📈 Próximas Funcionalidades

- [ ] Notificações por email
- [ ] Integração WhatsApp
- [ ] Relatórios em PDF
- [ ] Backup automático
- [ ] API para integração
- [ ] App mobile

## 🐛 Troubleshooting

### **Erro de Configuração Firebase**
- Verifique se todas as variáveis `.env.local` estão corretas
- Confirme se o projeto Firebase está ativo

### **Erro de Permissão**
- Verifique se o usuário está autenticado
- Confira as regras de segurança do Firestore

### **Dados não Aparecem**
- Aguarde o carregamento inicial
- Verifique a conexão com internet
- Tente recarregar a página

## 📞 Suporte

Para dúvidas e suporte:
- Abra uma **Issue** no GitHub
- Consulte a documentação do Firebase
- Verifique o console do navegador para erros

## 📄 Licença

MIT License - Veja o arquivo LICENSE para mais detalhes.

---

**🎉 Sistema Completo e Funcional!**

Este sistema está pronto para uso profissional. Personalize conforme suas necessidades e comece a gerenciar suas cobranças de forma eficiente!

**Desenvolvido com ❤️ usando React + Firebase**