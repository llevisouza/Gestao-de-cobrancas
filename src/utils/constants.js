// src/utils/constants.js - ARQUIVO ATUALIZADO
export const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  REPORTS: 'reports',
  SETTINGS: 'settings'
};

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.PENDING]: 'Pendente',
  [INVOICE_STATUS.PAID]: 'Pago',
  [INVOICE_STATUS.OVERDUE]: 'Vencido',
  [INVOICE_STATUS.CANCELLED]: 'Cancelado'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled'
};

export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Ativa',
  [SUBSCRIPTION_STATUS.INACTIVE]: 'Inativa',
  [SUBSCRIPTION_STATUS.CANCELLED]: 'Cancelada'
};

export const DAYS_OF_WEEK = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday'
};

export const DAYS_OF_WEEK_LABELS = {
  [DAYS_OF_WEEK.MONDAY]: 'Segunda-feira',
  [DAYS_OF_WEEK.TUESDAY]: 'Terça-feira',
  [DAYS_OF_WEEK.WEDNESDAY]: 'Quarta-feira',
  [DAYS_OF_WEEK.THURSDAY]: 'Quinta-feira',
  [DAYS_OF_WEEK.FRIDAY]: 'Sexta-feira',
  [DAYS_OF_WEEK.SATURDAY]: 'Sábado',
  [DAYS_OF_WEEK.SUNDAY]: 'Domingo'
};

export const PAYMENT_METHODS = {
  PIX: 'pix',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  BOLETO: 'boleto',
  CASH: 'cash'
};

export const PAYMENT_METHODS_LABELS = {
  [PAYMENT_METHODS.PIX]: 'PIX',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Transferência Bancária',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Cartão de Crédito',
  [PAYMENT_METHODS.BOLETO]: 'Boleto',
  [PAYMENT_METHODS.CASH]: 'Dinheiro'
};

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked'
};

export const CLIENT_STATUS_LABELS = {
  [CLIENT_STATUS.ACTIVE]: 'Ativo',
  [CLIENT_STATUS.INACTIVE]: 'Inativo',
  [CLIENT_STATUS.BLOCKED]: 'Bloqueado'
};

// Configurações de validação
export const VALIDATION_RULES = {
  CPF_LENGTH: 11,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 11,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255
};

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_CPF: 'CPF inválido',
  INVALID_PHONE: 'Telefone inválido',
  PASSWORD_TOO_SHORT: `Senha deve ter pelo menos ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caracteres`,
  NAME_TOO_SHORT: `Nome deve ter pelo menos ${VALIDATION_RULES.NAME_MIN_LENGTH} caracteres`,
  GENERIC_ERROR: 'Ocorreu um erro inesperado'
};

// Configurações de formatação
export const FORMAT_CONFIG = {
  CURRENCY: {
    locale: 'pt-BR',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  },
  DATE: {
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo'
  },
  PHONE_MASK: '(XX) XXXXX-XXXX',
  CPF_MASK: 'XXX.XXX.XXX-XX'
};

// Configurações da aplicação
export const APP_CONFIG = {
  NAME: 'Sistema de Cobranças',
  VERSION: '1.0.0',
  COMPANY: 'Conexão Delivery',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  PAGINATION_SIZE: 20,
  DEBOUNCE_DELAY: 300
};

// URLs e endpoints
export const API_CONFIG = {
  FIREBASE_CONFIG: {
    // Configurações do Firebase vão aqui quando necessário
  }
};

// Cores do tema (para uso em componentes que precisam)
export const THEME_COLORS = {
  PRIMARY: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  SUCCESS: {
    500: '#22c55e',
    600: '#16a34a'
  },
  WARNING: {
    500: '#f59e0b',
    600: '#d97706'
  },
  ERROR: {
    500: '#ef4444',
    600: '#dc2626'
  }
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  AUTO_CLOSE_DELAY: 5000,
  MAX_NOTIFICATIONS: 5,
  POSITIONS: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left'
  }
};

export default {
  ROUTES,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_LABELS,
  DAYS_OF_WEEK,
  DAYS_OF_WEEK_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHODS_LABELS,
  CLIENT_STATUS,
  CLIENT_STATUS_LABELS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  FORMAT_CONFIG,
  APP_CONFIG,
  API_CONFIG,
  THEME_COLORS,
  NOTIFICATION_CONFIG
};