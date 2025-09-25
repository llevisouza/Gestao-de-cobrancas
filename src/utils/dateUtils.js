// src/utils/dateUtils.js

/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA).
 * Lida com strings ISO, objetos Date e strings YYYY-MM-DD.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    let date;
    
    // Se é uma string de data ISO com timezone (ex: "2025-09-24T10:00:00.000Z")
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      date = new Date(dateInput);
    } 
    // Se é uma string de data simples (ex: "2025-09-24")
    else if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Cria a data local sem problemas de fuso horário, tratando como UTC para evitar off-by-one
      const [year, month, day] = dateInput.split('-').map(Number);
      date = new Date(Date.UTC(year, month - 1, day));
    } 
    // Outros casos (ex: objeto Date)
    else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Data inválida fornecida para formatação:', dateInput);
      return dateInput.toString();
    }
    
    // Formatação para português brasileiro (DD/MM/AAAA)
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'UTC', // Garante que a data não mude por causa do fuso horário do cliente
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateInput);
    return dateInput.toString();
  }
};

/**
 * Retorna a data atual no formato YYYY-MM-DD.
 */
export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calcula a diferença em dias entre duas datas.
 * Ignora o fuso horário e a parte de tempo das datas.
 */
export const getDaysDifference = (dateString1, dateString2 = null) => {
  try {
    // Usa a data atual se a segunda data não for fornecida
    const today = dateString2 || getCurrentDate();
    
    // ✅ CORREÇÃO: Extrai apenas a parte YYYY-MM-DD das strings de data
    const date1Str = dateString1.includes('T') ? dateString1.split('T')[0] : dateString1;
    const date2Str = today.includes('T') ? today.split('T')[0] : today;
    
    // ✅ CORREÇÃO: Se as datas forem idênticas, retorna 0 imediatamente para otimização
    if (date1Str === date2Str) {
      return 0;
    }
    
    // Extrai os componentes ano, mês e dia
    const [year1, month1, day1] = date1Str.split('-').map(Number);
    const [year2, month2, day2] = date2Str.split('-').map(Number);
    
    // Cria objetos Date em UTC para evitar problemas de fuso horário e horário de verão
    const date1 = new Date(Date.UTC(year1, month1 - 1, day1));
    const date2 = new Date(Date.UTC(year2, month2 - 1, day2));
    
    // Calcula a diferença em milissegundos
    const diffTime = date1.getTime() - date2.getTime();
    
    // ✅ CORREÇÃO: Arredonda o resultado para obter o número inteiro de dias
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('❌ Erro ao calcular diferença de dias:', error);
    return 0; // Retorna 0 em caso de erro
  }
};

/**
 * Verifica se uma data é hoje.
 */
export const isToday = (dateString) => {
  try {
    const today = getCurrentDate();
    const inputDate = dateString.split('T')[0];
    return inputDate === today;
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error);
    return false;
  }
};

/**
 * Verifica se uma data está no passado.
 */
export const isPast = (dateString) => {
  try {
    const diffDays = getDaysDifference(dateString);
    return diffDays < 0;
  } catch (error) {
    console.error('Erro ao verificar se é passado:', error);
    return false;
  }
};

/**
 * Verifica se uma data está no futuro.
 */
export const isFuture = (dateString) => {
  try {
    const diffDays = getDaysDifference(dateString);
    return diffDays > 0;
  } catch (error) {
    console.error('Erro ao verificar se é futuro:', error);
    return false;
  }
};

/**
 * Adiciona um número de dias a uma data no formato YYYY-MM-DD.
 */
export const addDays = (dateString, days) => {
  try {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);
    
    const newYear = date.getUTCFullYear();
    const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const newDay = String(date.getUTCDate()).padStart(2, '0');
    
    return `${newYear}-${newMonth}-${newDay}`;
  } catch (error) {
    console.error('Erro ao adicionar dias:', error);
    return dateString;
  }
};

// Funções para obter início/fim de períodos
export const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
export const endOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
export const startOfYear = (date = new Date()) => new Date(date.getFullYear(), 0, 1);
export const endOfYear = (date = new Date()) => new Date(date.getFullYear(), 11, 31);

/**
 * Calcula uma data de vencimento com base em um dia do mês.
 */
export const calculateDueDateByDayOfMonth = (dayOfMonth, referenceMonth = null, referenceYear = null) => {
  try {
    const today = new Date();
    const year = referenceYear || today.getFullYear();
    const month = referenceMonth !== null ? referenceMonth : today.getMonth(); // 0-11
    
    let dueDate = new Date(year, month, dayOfMonth);
    
    // Se a data já passou no mês corrente, avança para o próximo mês
    if (referenceMonth === null && dueDate <= today) {
      dueDate = new Date(year, month + 1, dayOfMonth);
    }
    
    const dueDateYear = dueDate.getFullYear();
    const dueDateMonth = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dueDateDay = String(dueDate.getDate()).padStart(2, '0');
    
    return `${dueDateYear}-${dueDateMonth}-${dueDateDay}`;
  } catch (error) {
    console.error('Erro ao calcular data de vencimento:', error);
    return getCurrentDate();
  }
};

/**
 * Valida se uma string está no formato de data YYYY-MM-DD.
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const datePart = dateString.split('T')[0];
    if (!datePart.match(/^\d{4}-\d{2}-\d{2}$/)) return false;

    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return !isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  } catch (error) {
    return false;
  }
};

/**
 * Retorna a data e hora atual no formato ISO 8601.
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

/**
 * Retorna informações de status (cor, texto, prioridade) para uma fatura.
 */
export const getInvoiceStatusInfo = (invoice) => {
  const diffDays = getDaysDifference(invoice.dueDate);
  
  let status, statusText, statusColor, priority, icon;
  
  if (invoice.status === 'paid') {
    status = 'paid';
    statusText = 'Pago';
    statusColor = 'text-green-600 bg-green-50 border-green-200';
    priority = 4; // Prioridade baixa
    icon = '✅';
  } else if (diffDays < 0) {
    status = 'overdue';
    const daysOverdue = Math.abs(diffDays);
    statusText = `${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} em atraso`;
    statusColor = 'text-red-600 bg-red-50 border-red-200';
    priority = 1; // Prioridade máxima
    icon = '🚨';
  } else if (diffDays === 0) {
    status = 'today';
    statusText = 'Vence hoje';
    statusColor = 'text-orange-600 bg-orange-50 border-orange-200';
    priority = 2; // Prioridade alta
    icon = '⚠️';
  } else if (diffDays <= 3) {
    status = 'soon';
    statusText = `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';
    priority = 3; // Prioridade média
    icon = '⏰';
  } else {
    status = 'pending';
    statusText = `Vence em ${diffDays} dias`;
    statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
    priority = 5; // Prioridade mais baixa
    icon = '📅';
  }
  
  return {
    status,
    statusText,
    statusColor,
    priority,
    icon,
    diffDays,
    daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
    isOverdue: diffDays < 0,
    isToday: diffDays === 0,
    isSoon: diffDays > 0 && diffDays <= 3
  };
};

// Exportação padrão de todas as funções
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
  getInvoiceStatusInfo
};