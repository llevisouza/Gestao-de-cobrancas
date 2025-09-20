// src/utils/constants.js

// Configurações da aplicação
export const APP_CONFIG = {
  name: 'Sistema de Gestão de Cobranças',
  version: '1.0.0',
  author: 'Sua Empresa'
};

// Rotas da aplicação
export const ROUTES = {
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  REPORTS: '/reports',
  SUBSCRIPTIONS: '/subscriptions',
  INVOICES: '/invoices'
};

// Status das faturas
export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

// Cores dos status das faturas
export const INVOICE_STATUS_COLORS = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger'
};

// Labels dos status das faturas
export const INVOICE_STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido'
};

// Status das assinaturas - OBJETO
export const SUBSCRIPTION_STATUS_OBJ = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
};

// Status das assinaturas - ARRAY para select
export const SUBSCRIPTION_STATUS = [
  { value: 'active', label: 'Ativa', color: 'success' },
  { value: 'paused', label: 'Pausada', color: 'warning' },
  { value: 'cancelled', label: 'Cancelada', color: 'danger' }
];

// Ciclos de cobrança
export const BILLING_CYCLES = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' }
];

// Tipos de serviços pré-definidos
export const SERVICE_TYPES = [
  {
    name: 'Website Básico',
    description: 'Manutenção de website básico',
    defaultValue: '300.00'
  },
  {
    name: 'Website Avançado',
    description: 'Manutenção completa com atualizações',
    defaultValue: '500.00'
  },
  {
    name: 'E-commerce',
    description: 'Gestão completa de loja virtual',
    defaultValue: '800.00'
  },
  {
    name: 'SEO Básico',
    description: 'Otimização SEO básica',
    defaultValue: '400.00'
  },
  {
    name: 'SEO Premium',
    description: 'Otimização SEO completa com relatórios',
    defaultValue: '800.00'
  },
  {
    name: 'Marketing Digital',
    description: 'Gestão de redes sociais e campanhas',
    defaultValue: '600.00'
  },
  {
    name: 'Consultoria',
    description: 'Consultoria estratégica personalizada',
    defaultValue: '1200.00'
  },
  {
    name: 'Hospedagem',
    description: 'Hospedagem com suporte técnico',
    defaultValue: '100.00'
  },
  {
    name: 'Backup e Segurança',
    description: 'Backup automático e monitoramento',
    defaultValue: '150.00'
  }
];

// Dias da semana
export const DAYS_OF_WEEK = [
  'domingo', 'segunda', 'terça', 'quarta', 
  'quinta', 'sexta', 'sábado'
];

// Labels dos dias da semana
export const DAYS_OF_WEEK_LABELS = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  terça: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sábado: 'Sábado'
};

// Períodos para relatórios
export const REPORT_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom'
};

// Labels dos períodos
export const REPORT_PERIOD_LABELS = {
  today: 'Hoje',
  week: 'Esta Semana',
  month: 'Este Mês',
  quarter: 'Este Trimestre',
  year: 'Este Ano',
  custom: 'Período Personalizado'
};

// Cores do sistema
export const COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  gray: '#6b7280'
};

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
};

// Formatos de data
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'dd/MM/yyyy'
};

// Configurações de validação
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\(\)\s\-\+\d]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_TEXT_LENGTH: 255,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999.99
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseFloat(value));
};

export const formatDate = (date) => {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, '');
  
  // Formata o telefone
  if (numbers.length <= 10) {
    // Telefone fixo: (11) 1234-5678
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    // Celular: (11) 91234-5678
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};

export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  // Remove tudo que não é número
  const numbers = cpf.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);
  
  // Aplica a formatação
  return limited.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const removeFormatting = (text) => {
  if (!text) return '';
  return text.replace(/\D/g, '');
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCPF = (cpf) => {
  if (!cpf) return false;
  
  const numbers = removeFormatting(cpf);
  
  // CPF deve ter 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação do algoritmo do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers[9]) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers[10]) === digit2;
};