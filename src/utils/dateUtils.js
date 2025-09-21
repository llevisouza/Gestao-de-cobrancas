// src/utils/dateUtils.js - CORREÇÃO DEFINITIVA
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
      // IMPORTANTE: Adicionar T12:00:00 para evitar problema de timezone
      date = new Date(dateInput + 'T12:00:00');
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

// Função para obter data atual no formato correto (FUNDAMENTAL)
export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Função CORRIGIDA para calcular diferença em dias
export const getDaysDifference = (dateString1, dateString2 = null) => {
  try {
    console.log('[DEBUG] Calculando diferença:', { dateString1, dateString2 });
    
    // Data de comparação (hoje se não especificada)
    const today = dateString2 || getCurrentDate();
    
    // Criar datas sempre ao meio-dia para evitar problemas de timezone
    const date1 = new Date(dateString1 + 'T12:00:00');
    const date2 = new Date(today + 'T12:00:00');
    
    console.log('[DEBUG] Datas criadas:', { date1: date1.toString(), date2: date2.toString() });
    
    // Calcular diferença em milissegundos
    const diffTime = date1.getTime() - date2.getTime();
    
    // Converter para dias
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('[DEBUG] Diferença calculada:', diffDays, 'dias');
    
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
    const result = inputDate === today;
    console.log('[DEBUG] IsToday:', { inputDate, today, result });
    return result;
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error);
    return false;
  }
};

// Função para verificar se data é no passado
export const isPast = (dateString) => {
  try {
    const diffDays = getDaysDifference(dateString);
    const result = diffDays < 0;
    console.log('[DEBUG] IsPast:', { dateString, diffDays, result });
    return result;
  } catch (error) {
    console.error('Erro ao verificar se é passado:', error);
    return false;
  }
};

// Função para verificar se data é no futuro
export const isFuture = (dateString) => {
  try {
    const diffDays = getDaysDifference(dateString);
    const result = diffDays > 0;
    console.log('[DEBUG] IsFuture:', { dateString, diffDays, result });
    return result;
  } catch (error) {
    console.error('Erro ao verificar se é futuro:', error);
    return false;
  }
};

// Função para adicionar dias a uma data
export const addDays = (dateString, days) => {
  try {
    const date = new Date(dateString + 'T12:00:00');
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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

// Função CORRIGIDA para calcular próxima data baseada no dia da semana
export const getNextWeekdayDate = (dayOfWeek, fromDate = null) => {
  const daysMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  const targetDay = daysMap[dayOfWeek.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error('Dia da semana inválido: ' + dayOfWeek);
  }
  
  // Data base
  const baseDate = fromDate ? new Date(fromDate + 'T12:00:00') : new Date();
  const currentDay = baseDate.getDay();
  
  // Calcular dias para adicionar
  let daysToAdd = (targetDay - currentDay + 7) % 7;
  
  // Se é hoje, pegar da próxima semana
  if (daysToAdd === 0) {
    daysToAdd = 7;
  }
  
  const nextDate = new Date(baseDate);
  nextDate.setDate(baseDate.getDate() + daysToAdd);
  
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log('[DEBUG] Next weekday:', { dayOfWeek, fromDate, targetDay, daysToAdd, result });
  
  return result;
};

// Função para validar formato de data
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString + 'T12:00:00');
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  } catch (error) {
    return false;
  }
};

// Função para obter data/hora atual ISO
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

// Debug: Função para logging de datas
export const debugDate = (label, dateString) => {
  console.log(`[DATE DEBUG] ${label}:`, {
    input: dateString,
    currentDate: getCurrentDate(),
    daysDiff: getDaysDifference(dateString),
    isPast: isPast(dateString),
    isFuture: isFuture(dateString),
    isToday: isToday(dateString)
  });
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
  getNextWeekdayDate,
  isValidDate,
  debugDate
};