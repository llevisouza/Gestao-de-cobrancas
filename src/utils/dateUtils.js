// src/utils/dateUtils.js

/**
 * Retorna o primeiro dia do mês atual.
 * @returns {Date}
 */
export const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Retorna o último dia do mês atual.
 * @returns {Date}
 */
export const getEndOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

/**
 * Formata uma data para o formato YYYY-MM-DD.
 * @param {Date} date - A data para formatar.
 * @returns {string}
 */
export const formatDateToYYYYMMDD = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};