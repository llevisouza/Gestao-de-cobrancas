// src/utils/formatters.js - VERSÃO ATUALIZADA
import { formatDate as formatDateUtil } from './dateUtils';

// Formatação de moeda
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Formatação de data - usar a função corrigida
export const formatDate = (dateInput) => {
  return formatDateUtil(dateInput);
};

// Formatação de telefone
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, '');
  
  // Aplica formatação baseada no tamanho
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};

// Formatação de CPF
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  // Remove tudo que não for número
  const numbers = cpf.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica formatação
  return limitedNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Remover formatação (útil para salvar dados)
export const removeFormatting = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Validação de email
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validação de CPF
export const isValidCPF = (cpf) => {
  if (!cpf) return false;
  
  const numbers = removeFormatting(cpf);
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se não são todos números iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  
  if (firstDigit !== parseInt(numbers.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  
  return secondDigit === parseInt(numbers.charAt(10));
};

// Validação de telefone
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const numbers = removeFormatting(phone);
  return numbers.length >= 10 && numbers.length <= 11;
};

// Formatação de número (genérica)
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return parseFloat(number).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Formatação de percentual
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Capitalizar primeira letra de cada palavra
export const capitalizeWords = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Truncar texto
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
};

// Formatação de arquivo (tamanho)
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Formatação de tempo decorrido
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Agora mesmo';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    return dateString;
  }
};

// Máscara genérica
export const applyMask = (value, mask) => {
  if (!value || !mask) return value;
  
  let maskedValue = '';
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === 'X') {
      maskedValue += value[valueIndex];
      valueIndex++;
    } else {
      maskedValue += mask[i];
    }
  }
  
  return maskedValue;
};

// Limpar e validar entrada numérica
export const cleanNumericInput = (value) => {
  if (!value) return '';
  
  // Remove tudo exceto números, pontos e vírgulas
  let cleaned = value.toString().replace(/[^\d.,]/g, '');
  
  // Substitui vírgula por ponto
  cleaned = cleaned.replace(',', '.');
  
  // Remove pontos extras (manter apenas um)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
};

// Formatação de status
export const formatStatus = (status) => {
  const statusMap = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'pending': 'Pendente',
    'paid': 'Pago',
    'overdue': 'Vencido',
    'cancelled': 'Cancelado'
  };
  
  return statusMap[status] || status;
};

export default {
  formatCurrency,
  formatDate,
  formatPhone,
  formatCPF,
  removeFormatting,
  isValidEmail,
  isValidCPF,
  isValidPhone,
  formatNumber,
  formatPercentage,
  capitalizeWords,
  truncateText,
  formatFileSize,
  formatTimeAgo,
  applyMask,
  cleanNumericInput,
  formatStatus
};