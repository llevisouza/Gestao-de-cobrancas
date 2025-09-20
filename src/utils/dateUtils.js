// Funções utilitárias para manipulação de datas

export const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const startOfYear = (date) => {
  return new Date(date.getFullYear(), 0, 1);
};

export const endOfYear = (date) => {
  return new Date(date.getFullYear(), 11, 31);
};

export const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const isOverdue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const parseDate = (dateString) => {
  return new Date(dateString + 'T00:00:00.000Z');
};