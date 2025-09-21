// src/components/common/RecurrenceBadge.js
import React from 'react';

const RecurrenceBadge = ({ subscription, size = 'medium' }) => {
  if (!subscription || !subscription.recurrenceType) {
    return null;
  }

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-2 py-1',
    large: 'text-base px-3 py-2'
  };

  const getRecurrenceInfo = () => {
    switch (subscription.recurrenceType) {
      case 'daily':
        return {
          icon: '🔄',
          text: 'Diário',
          description: 'Todo dia',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      
      case 'weekly':
        const weekDays = {
          'sunday': 'Dom', 'monday': 'Seg', 'tuesday': 'Ter', 
          'wednesday': 'Qua', 'thursday': 'Qui', 'friday': 'Sex', 'saturday': 'Sáb'
        };
        return {
          icon: '📅',
          text: 'Semanal',
          description: `Toda ${weekDays[subscription.dayOfWeek] || 'Seg'}`,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      
      case 'monthly':
        return {
          icon: '📅',
          text: 'Mensal',
          description: `Dia ${subscription.dayOfMonth || '1'}`,
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      
      case 'custom':
        return {
          icon: '⏱️',
          text: 'Personalizado',
          description: `${subscription.recurrenceDays || 30} dias`,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      
      default:
        return {
          icon: '❓',
          text: 'Indefinido',
          description: '',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const recurrence = getRecurrenceInfo();

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${recurrence.color}`}>
      <span className="mr-1">{recurrence.icon}</span>
      <span>{recurrence.text}</span>
      {recurrence.description && (
        <span className="ml-1 opacity-75">({recurrence.description})</span>
      )}
    </div>
  );
};

export default RecurrenceBadge;