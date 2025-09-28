/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns {string} Data atual
 */
export const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Obtém a data e hora atual no formato ISO
 * @returns {string} Data e hora atual
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

/**
 * Formata uma data no padrão brasileiro (DD/MM/AAAA)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.warn('⚠️ Data inválida:', date);
      return 'Data inválida';
    }
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('❌ Erro ao formatar data:', error);
    return 'Erro na data';
  }
};

/**
 * Calcula a diferença em dias entre uma data e hoje
 * CORRIGIDO: Agora calcula corretamente considerando timezone
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {number} Diferença em dias (negativo = vencida, positivo = futuro, 0 = hoje)
 */
export const getDaysDifference = (dateString) => {
  if (!dateString) return 0;
  
  try {
    // Criar objetos Date sem considerar timezone
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const targetDate = new Date(dateString + 'T00:00:00');
    const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    // Calcular diferença em milissegundos e converter para dias
    const diffTime = targetDateOnly.getTime() - todayDateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('❌ Erro ao calcular diferença de dias:', error);
    return 0;
  }
};

/**
 * Obtém informações detalhadas sobre os dias até o vencimento
 * @param {string} dueDate - Data de vencimento no formato YYYY-MM-DD
 * @returns {Object} Informações sobre o vencimento
 */
export const getDaysInfo = (dueDate) => {
  const diffDays = getDaysDifference(dueDate);
  
  return {
    days: Math.abs(diffDays),
    diffDays: diffDays,
    isOverdue: diffDays < 0,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
    isThisWeek: diffDays >= 0 && diffDays <= 7,
    text: formatDaysText(diffDays),
    shortText: formatDaysTextShort(diffDays),
    cssClass: getDaysCssClass(diffDays),
    priority: getDaysPriority(diffDays)
  };
};

/**
 * Formata a diferença de dias em texto legível
 * @param {number} diffDays - Diferença em dias
 * @returns {string} Texto formatado
 */
export const formatDaysText = (diffDays) => {
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    if (days === 1) return '1 dia em atraso';
    return `${days} dias em atraso`;
  } else if (diffDays === 0) {
    return 'vence hoje';
  } else if (diffDays === 1) {
    return 'vence amanhã';
  } else if (diffDays === 2) {
    return 'vence depois de amanhã';
  } else if (diffDays <= 7) {
    return `vence em ${diffDays} dias`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    if (remainingDays === 0) {
      return `vence em ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    return `vence em ${diffDays} dias`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `vence em ${months} mês${months > 1 ? 'es' : ''}`;
  }
};

/**
 * Formata a diferença de dias em texto curto
 * @param {number} diffDays - Diferença em dias
 * @returns {string} Texto curto
 */
export const formatDaysTextShort = (diffDays) => {
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d atraso`;
  } else if (diffDays === 0) {
    return 'hoje';
  } else if (diffDays === 1) {
    return 'amanhã';
  } else {
    return `${diffDays}d`;
  }
};

/**
 * Retorna a classe CSS apropriada baseada nos dias
 * @param {number} diffDays - Diferença em dias
 * @returns {string} Classe CSS
 */
export const getDaysCssClass = (diffDays) => {
  if (diffDays < 0) return 'text-red-600 bg-red-100';
  if (diffDays === 0) return 'text-orange-600 bg-orange-100';
  if (diffDays === 1) return 'text-yellow-600 bg-yellow-100';
  if (diffDays <= 3) return 'text-blue-600 bg-blue-100';
  return 'text-gray-600 bg-gray-100';
};

/**
 * Retorna a prioridade baseada nos dias
 * @param {number} diffDays - Diferença em dias
 * @returns {number} Prioridade (1 = alta, 5 = baixa)
 */
export const getDaysPriority = (diffDays) => {
  if (diffDays < 0) return 1; // Vencida - prioridade máxima
  if (diffDays === 0) return 2; // Vence hoje
  if (diffDays === 1) return 3; // Vence amanhã
  if (diffDays <= 3) return 4; // Vence em poucos dias
  return 5; // Vence em muito tempo
};

/**
 * Verifica se uma data está vencida
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} True se vencida
 */
export const isOverdue = (dateString) => {
  return getDaysDifference(dateString) < 0;
};

/**
 * Verifica se uma data é hoje
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} True se é hoje
 */
export const isToday = (dateString) => {
  return getDaysDifference(dateString) === 0;
};

/**
 * Adiciona dias a uma data
 * @param {string} dateString - Data base no formato YYYY-MM-DD
 * @param {number} days - Número de dias a adicionar
 * @returns {string} Nova data no formato YYYY-MM-DD
 */
export const addDays = (dateString, days) => {
  try {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('❌ Erro ao adicionar dias:', error);
    return dateString;
  }
};

/**
 * Subtrai dias de uma data
 * @param {string} dateString - Data base no formato YYYY-MM-DD
 * @param {number} days - Número de dias a subtrair
 * @returns {string} Nova data no formato YYYY-MM-DD
 */
export const subtractDays = (dateString, days) => {
  try {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('❌ Erro ao subtrair dias:', error);
    return dateString;
  }
};

/**
 * Obtém o primeiro dia do mês
 * @param {Date} date - Data base
 * @returns {Date} Primeiro dia do mês
 */
export const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Obtém o último dia do mês
 * @param {Date} date - Data base
 * @returns {Date} Último dia do mês
 */
export const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Obtém o primeiro dia do ano
 * @param {Date} date - Data base
 * @returns {Date} Primeiro dia do ano
 */
export const startOfYear = (date) => {
  return new Date(date.getFullYear(), 0, 1);
};

/**
 * Obtém o último dia do ano
 * @param {Date} date - Data base
 * @returns {Date} Último dia do ano
 */
export const endOfYear = (date) => {
  return new Date(date.getFullYear(), 11, 31);
};

/**
 * Converte uma data para o formato brasileiro com hora
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada com hora
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    
    return dateObj.toLocaleString('pt-BR');
  } catch (error) {
    console.error('❌ Erro ao formatar data/hora:', error);
    return 'Erro na data';
  }
};

/**
 * Valida se uma string é uma data válida
 * @param {string} dateString - String da data
 * @returns {boolean} True se válida
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Obtém a próxima data de cobrança baseada na recorrência
 * @param {string} lastDate - Última data de cobrança
 * @param {string} recurrenceType - Tipo de recorrência
 * @param {Object} options - Opções adicionais
 * @returns {string} Próxima data no formato YYYY-MM-DD
 */
export const getNextBillingDate = (lastDate, recurrenceType, options = {}) => {
  try {
    const baseDate = new Date(lastDate + 'T00:00:00');
    
    switch (recurrenceType) {
      case 'daily':
        baseDate.setDate(baseDate.getDate() + 1);
        break;
        
      case 'weekly':
        baseDate.setDate(baseDate.getDate() + 7);
        break;
        
      case 'monthly':
        if (options.dayOfMonth) {
          baseDate.setMonth(baseDate.getMonth() + 1);
          baseDate.setDate(options.dayOfMonth);
        } else {
          baseDate.setMonth(baseDate.getMonth() + 1);
        }
        break;
        
      case 'custom':
        const days = options.recurrenceDays || 30;
        baseDate.setDate(baseDate.getDate() + days);
        break;
        
      default:
        throw new Error('Tipo de recorrência inválido');
    }
    
    return baseDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('❌ Erro ao calcular próxima data:', error);
    return addDays(lastDate, 30); // Fallback para 30 dias
  }
};

/**
 * Formata período para exibição (ex: "Últimos 30 dias")
 * @param {number} days - Número de dias
 * @returns {string} Período formatado
 */
export const formatPeriod = (days) => {
  if (days === 1) return 'Hoje';
  if (days === 7) return 'Últimos 7 dias';
  if (days === 30) return 'Últimos 30 dias';
  if (days === 365) return 'Último ano';
  return `Últimos ${days} dias`;
};

/**
 * Obtém a idade de uma data em relação a hoje
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {Object} Informações sobre a idade
 */
export const getAge = (dateString) => {
  const diffDays = Math.abs(getDaysDifference(dateString));
  
  if (diffDays === 0) return { text: 'hoje', value: 0, unit: 'day' };
  if (diffDays === 1) return { text: '1 dia', value: 1, unit: 'day' };
  if (diffDays < 7) return { text: `${diffDays} dias`, value: diffDays, unit: 'day' };
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return { text: `${weeks} semana${weeks > 1 ? 's' : ''}`, value: weeks, unit: 'week' };
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return { text: `${months} mês${months > 1 ? 'es' : ''}`, value: months, unit: 'month' };
  }
  
  const years = Math.floor(diffDays / 365);
  return { text: `${years} ano${years > 1 ? 's' : ''}`, value: years, unit: 'year' };
};

/**
 * Adiciona semanas a uma data
 * @param {Date} date - Data base
 * @param {number} weeks - Número de semanas a adicionar
 * @returns {string} Nova data no formato YYYY-MM-DD
 */
export const addWeeks = (date, weeks) => {
  try {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result.toISOString().split('T')[0];
  } catch (error) {
    console.error('❌ Erro ao adicionar semanas:', error);
    return date.toISOString().split('T')[0];
  }
};

/**
 * Adiciona meses a uma data, respeitando o dia do mês especificado
 * @param {Date} date - Data base
 * @param {number} months - Número de meses a adicionar
 * @param {number} dayOfMonth - Dia do mês desejado
 * @returns {string} Nova data no formato YYYY-MM-DD
 */
export const addMonths = (date, months, dayOfMonth) => {
  try {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    if (dayOfMonth) result.setDate(Math.min(dayOfMonth, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
    return result.toISOString().split('T')[0];
  } catch (error) {
    console.error('❌ Erro ao adicionar meses:', error);
    return date.toISOString().split('T')[0];
  }
};