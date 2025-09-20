# 🔥 Sistema de Cobranças

Sistema moderno de gestão de cobranças desenvolvido com **React** e **Firebase**. Perfeito para freelancers, pequenas empresas e prestadores de serviços que precisam gerenciar clientes, assinaturas e faturas de forma eficiente.

## ✨ Funcionalidades

### 📊 Dashboard
- Visualização de KPIs (total faturado, pendente, vencido)
- Lista de faturas recentes
- Estatísticas de clientes ativos

### 👥 Gestão de Clientes
- Cadastro completo de clientes
- Validação de CPF e email
- Formatação automática de telefone e CPF
- Chave PIX para facilitar pagamentos

### 💳 Assinaturas
- Criação de assinaturas recorrentes
- Definição de dia da semana para cobrança
- Status ativo/inativo
- Valores personalizados

### 📋 Relatórios
- Filtros por período
- Exportação de dados
- Status de pagamentos

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Ícones**: Heroicons
- **Formatação**: Intl API para moeda brasileira
- **Validações**: CPF, email, telefone

## 🔧 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Firebase

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/sistema-cobrancas.git
cd sistema-cobrancas
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase**
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o .env.local com suas configurações do Firebase
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm start
```

## ⚙️ Configuração do Firebase

### Passo 1: Criar Projeto
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Clique em "Criar projeto"
3. Nomeie seu projeto (ex: "sistema-cobrancas")
4. Configure Analytics (opcional)

### Passo 2: Authentication
1. Vá para "Authentication" → "Get started"
2. Em "Sign-in method", habilite "Email/password"
3. Crie um usuário de teste em "Users" → "Add user"

### Passo 3: Firestore Database
1. Vá para "Firestore Database" → "Create database"
2. Escolha "Start in test mode"
3. Selecione localização (us-central recomendado)

### Passo 4: Configuração Web
1. Vá para "Project Settings" (ícone engrenagem)
2. Em "Your apps", clique no ícone Web (</>)
3. Registre o app e copie a configuração
4. Cole no arquivo `.env.local`

## 📝 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/              # Autenticação e setup
│   ├── clients/           # Gestão de clientes
│   ├── common/            # Componentes reutilizáveis
│   ├── dashboard/         # Dashboard principal
│   └── reports/           # Relatórios
├── hooks/                 # Custom hooks
├── services/              # Serviços (Firebase)
├── styles/                # Estilos globais
└── utils/                 # Utilitários e formatadores
```

## 🎯 Como Usar

### Primeira Execução
1. Faça login com as credenciais criadas no Firebase
2. Clique em "Dados Exemplo" para gerar dados de teste
3. Explore as funcionalidades do sistema

### Fluxo de Trabalho
1. **Cadastre clientes** na aba "Clientes"
2. **Crie assinaturas** para cada cliente
3. **Monitore faturas** no Dashboard
4. **Gere relatórios** para análise

## 🔍 Funcionalidades Avançadas

### Formatação Automática
- **Telefone**: (11) 99999-9999
- **CPF**: 123.456.789-00
- **Moeda**: R$ 1.234,56
- **Data**: 20/09/2024

### Validações
- Email válido
- CPF com dígito verificador
- Telefone com mínimo de dígitos
- Campos obrigatórios

### Status Inteligente
- **Pendente**: Aguardando pagamento
- **Pago**: Confirmado
- **Vencido**: Passou da data

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Firebase Hosting
```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Netlify
```bash
npm run build
# Faça upload da pasta build/ no Netlify
```

## 📈 Próximas Funcionalidades

- [ ] Notificações por email
- [ ] Geração de boletos
- [ ] Integração com PIX
- [ ] Dashboard com gráficos
- [ ] Exportação para PDF
- [ ] App mobile (React Native)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [seu-linkedin](https://linkedin.com/in/seu-linkedin)
- Email: seu.email@exemplo.com

## 🙏 Agradecimentos

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)

---

⭐ Se este projeto te ajudou, não esqueça de dar uma estrela!

## 🐛 Problemas Conhecidos

Se encontrar algum erro, verifique:

1. **Variáveis de ambiente** estão corretas
2. **Regras do Firestore** permitem leitura/escrita
3. **Usuário tem permissão** no Firebase Auth
4. **Dependências instaladas** corretamente

Para mais ajuda, abra uma [issue](https://github.com/seu-usuario/sistema-cobrancas/issues).