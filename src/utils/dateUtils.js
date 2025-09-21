// src/utils/dateUtils.js - VERSÃO COMPLETAMENTE CORRIGIDA
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    let date;
    
    // Se é uma string de data ISO com timezone
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      date = new Date(dateInput);
    } 
    // Se é uma string de data simples YYYY-MM-DD
    else if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Criar data local sem problemas de timezone
      const [year, month, day] = dateInput.split('-');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } 
    // Outros casos
    else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateInput);
      return dateInput.toString();
    }
    
    // Formatação para português brasileiro
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateInput);
    return dateInput.toString();
  }
};

// Função para obter data atual no formato YYYY-MM-DD
export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Função TOTALMENTE CORRIGIDA para calcular diferença em dias
export const getDaysDifference = (dateString1, dateString2 = null) => {
  try {
    // Data de comparação (hoje se não especificada)
    const today = dateString2 || getCurrentDate();
    
    // Extrair apenas as partes da data (sem horário)
    const [year1, month1, day1] = dateString1.split('T')[0].split('-').map(Number);
    const [year2, month2, day2] = today.split('T')[0].split('-').map(Number);
    
    // Criar datas locais sem problemas de timezone
    const date1 = new Date(year1, month1 - 1, day1);
    const date2 = new Date(year2, month2 - 1, day2);
    
    // Calcular diferença em milissegundos
    const diffTime = date1.getTime() - date2.getTime();
    
    // Converter para dias (24 * 60 * 60 * 1000 = 86400000)
    const diffDays = Math.round(diffTime / 86400000);
    
    console.log('[DEBUG] Diferença calculada:', { 
      dateString1, 
      today, 
      date1: date1.toDateString(), 
      date2: date2.toDateString(), 
      diffDays 
    });
    
    return diffDays;
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return 0;
  }
};

// Função para verificar se data é hoje
export const isToday = (dateString) => {
  try {
    const today = getCurrentDate();
    const inputDate = dateString.split('T')[0]; // Pegar só a parte da data
    return inputDate === today;
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error);
    return false;
  }
};

// Função para verificar se data é no passado
export const isPast = (dateString) => {
  try {
    const diffDays = getDaysDifference(dateString);
    return diffDays < 0;
  } catch (error) {
    console.error('Erro ao verificar se é passado:', error);
    return false;
  }
};

// Função para verificar se data é no futuro
export const isFuture = (dateString) => {
  try {
    const diffDays = getDaysDifference(dateString);
    return diffDays > 0;
  } catch (error) {
    console.error('Erro ao verificar se é futuro:', error);
    return false;
  }
};

// Função para adicionar dias a uma data
export const addDays = (dateString, days) => {
  try {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    
    return `${newYear}-${newMonth}-${newDay}`;
  } catch (error) {
    console.error('Erro ao adicionar dias:', error);
    return dateString;
  }
};

// Função para obter início do mês
export const startOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Função para obter fim do mês
export const endOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Função para obter início do ano
export const startOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 0, 1);
};

// Função para obter fim do ano
export const endOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 11, 31);
};

// Função para calcular data de vencimento baseada no dia do mês
export const calculateDueDateByDayOfMonth = (dayOfMonth, referenceMonth = null, referenceYear = null) => {
  try {
    const today = new Date();
    const year = referenceYear || today.getFullYear();
    const month = referenceMonth !== null ? referenceMonth : today.getMonth(); // 0-11
    
    // Criar data para o dia especificado do mês
    let dueDate = new Date(year, month, dayOfMonth);
    
    // Se a data já passou neste mês (só para mês atual), usar próximo mês
    if (referenceMonth === null && dueDate <= today) {
      dueDate = new Date(year, month + 1, dayOfMonth);
    }
    
    // Formatar como YYYY-MM-DD
    const dueDateYear = dueDate.getFullYear();
    const dueDateMonth = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dueDateDay = String(dueDate.getDate()).padStart(2, '0');
    
    return `${dueDateYear}-${dueDateMonth}-${dueDateDay}`;
  } catch (error) {
    console.error('Erro ao calcular data de vencimento:', error);
    return getCurrentDate();
  }
};

// Função para validar formato de data
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}/);
  } catch (error) {
    return false;
  }
};

// Função para obter data/hora atual ISO
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

// Função para obter informações detalhadas de uma data
export const getDateInfo = (dateString) => {
  const diffDays = getDaysDifference(dateString);
  
  return {
    original: dateString,
    formatted: formatDate(dateString),
    diffDays,
    isPast: diffDays < 0,
    isToday: diffDays === 0,
    isFuture: diffDays > 0,
    status: diffDays < 0 ? 'overdue' : diffDays === 0 ? 'today' : 'future'
  };
};

export default {
  formatDate,
  getCurrentDate,
  getCurrentDateTime,
  getDaysDifference,
  isToday,
  isPast,
  isFuture,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  calculateDueDateByDayOfMonth,
  isValidDate,
  getDateInfo
};