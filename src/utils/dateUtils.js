// src/utils/dateUtils.js - VERSÃO FINAL CORRIGIDA
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
    
    // Zerar horas para comparação exata
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    
    console.log('[DEBUG] Datas criadas:', { 
      date1: date1.toDateString(), 
      date2: date2.toDateString() 
    });
    
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

// Função NOVA: Calcular data de vencimento baseada no dia do mês
export const calculateDueDateByDayOfMonth = (dayOfMonth, referenceMonth = null, referenceYear = null) => {
  try {
    const today = new Date();
    const year = referenceYear || today.getFullYear();
    const month = referenceMonth !== null ? referenceMonth : today.getMonth(); // 0-11
    
    // Criar data para o dia especificado do mês
    let dueDate = new Date(year, month, dayOfMonth, 12, 0, 0);
    
    // Se a data já passou neste mês (só para mês atual), usar próximo mês
    if (referenceMonth === null && dueDate <= today) {
      dueDate = new Date(year, month + 1, dayOfMonth, 12, 0, 0);
    }
    
    // Formatar como YYYY-MM-DD
    const dueDateYear = dueDate.getFullYear();
    const dueDateMonth = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dueDateDay = String(dueDate.getDate()).padStart(2, '0');
    
    const result = `${dueDateYear}-${dueDateMonth}-${dueDateDay}`;
    
    console.log('[DEBUG] Data de vencimento por dia do mês:', {
      dayOfMonth,
      referenceMonth,
      referenceYear,
      calculatedDate: dueDate.toDateString(),
      result
    });
    
    return result;
  } catch (error) {
    console.error('Erro ao calcular data de vencimento:', error);
    return getCurrentDate();
  }
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
  debugDate,
  getDateInfo
};