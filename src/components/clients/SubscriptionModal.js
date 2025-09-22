// src/components/clients/SubscriptionModal.js - VERSÃO TOTALMENTE CORRIGIDA
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { SUBSCRIPTION_STATUS } from '../../utils/constants';

const SubscriptionModal = ({ isOpen, onClose, onSave, subscription, client, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    recurrenceType: 'monthly', // daily, weekly, monthly, custom
    recurrenceDays: '30', // Para custom
    dayOfMonth: '', // Para monthly
    dayOfWeek: 'monday', // Para weekly
    startDate: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  // Opções de recorrência
  const recurrenceOptions = [
    { value: 'daily', label: 'Diário', description: 'Todo dia' },
    { value: 'weekly', label: 'Semanal', description: 'Toda semana' },
    { value: 'monthly', label: 'Mensal', description: 'Todo mês' },
    { value: 'custom', label: 'Personalizado', description: 'Escolher quantidade de dias' }
  ];

  // Dias da semana
  const weekDays = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  // Reset do formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (subscription) {
        // Editando assinatura existente
        setFormData({
          name: subscription.name || '',
          amount: subscription.amount?.toString() || '',
          recurrenceType: subscription.recurrenceType || 'monthly',
          recurrenceDays: subscription.recurrenceDays?.toString() || '30',
          dayOfMonth: subscription.dayOfMonth?.toString() || '',
          dayOfWeek: subscription.dayOfWeek || 'monday',
          startDate: subscription.startDate || '',
          status: subscription.status || 'active'
        });
      } else {
        // Nova assinatura
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        setFormData({ 
          name: '',
          amount: '', 
          recurrenceType: 'monthly',
          recurrenceDays: '30',
          dayOfMonth: today.getDate().toString(),
          dayOfWeek: 'monday',
          startDate: todayString, 
          status: 'active' 
        });
      }
      setErrors({});
    }
  }, [subscription, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatação para valor monetário
    if (name === 'amount') {
      // Remove caracteres não numéricos exceto vírgula e ponto
      formattedValue = value.replace(/[^\d.,]/g, '');
      // Substitui vírgula por ponto para processamento
      if (formattedValue.includes(',')) {
        formattedValue = formattedValue.replace(',', '.');
      }
    }

    // Validação para dia do mês
    if (name === 'dayOfMonth') {
      const dayNum = parseInt(value);
      if (dayNum < 1) formattedValue = '1';
      if (dayNum > 31) formattedValue = '31';
    }

    // Validação para dias customizados
    if (name === 'recurrenceDays') {
      const daysNum = parseInt(value);
      if (daysNum < 1) formattedValue = '1';
      if (daysNum > 365) formattedValue = '365';
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Limpar erro específico
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Nome obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da assinatura é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Valor obrigatório
    if (!formData.amount) {
      newErrors.amount = 'Valor é obrigatório';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Valor deve ser maior que zero';
      } else if (amount > 999999) {
        newErrors.amount = 'Valor muito alto';
      }
    }

    // Validações específicas por tipo de recorrência
    if (formData.recurrenceType === 'monthly') {
      if (!formData.dayOfMonth) {
        newErrors.dayOfMonth = 'Dia do vencimento é obrigatório';
      } else {
        const day = parseInt(formData.dayOfMonth);
        if (day < 1 || day > 31) {
          newErrors.dayOfMonth = 'Dia deve estar entre 1 e 31';
        }
      }
    }

    if (formData.recurrenceType === 'custom') {
      if (!formData.recurrenceDays) {
        newErrors.recurrenceDays = 'Quantidade de dias é obrigatória';
      } else {
        const days = parseInt(formData.recurrenceDays);
        if (days < 1 || days > 365) {
          newErrors.recurrenceDays = 'Dias deve estar entre 1 e 365';
        }
      }
    }
    
    // Data de início obrigatória
    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      console.log('Validação falhou:', errors);
      return;
    }

    if (!client) {
      setErrors({ general: 'Cliente não especificado' });
      return;
    }

    try {
      // Preparar dados para salvar
      const dataToSave = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        recurrenceType: formData.recurrenceType,
        startDate: formData.startDate,
        status: formData.status,
        clientId: client.id,
        clientName: client.name
      };

      // Adicionar campos específicos baseado no tipo de recorrência
      if (formData.recurrenceType === 'monthly') {
        dataToSave.dayOfMonth = parseInt(formData.dayOfMonth);
      } else if (formData.recurrenceType === 'weekly') {
        dataToSave.dayOfWeek = formData.dayOfWeek;
      } else if (formData.recurrenceType === 'custom') {
        dataToSave.recurrenceDays = parseInt(formData.recurrenceDays);
      }

      console.log('Dados da assinatura para salvar:', dataToSave);
      
      await onSave(dataToSave);
      
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      setErrors({ general: 'Erro ao salvar assinatura. Tente novamente.' });
    }
  };

  // Função para gerar descrição da recorrência
  const getRecurrenceDescription = () => {
    switch (formData.recurrenceType) {
      case 'daily':
        return 'Fatura gerada todo dia';
      case 'weekly':
        const dayLabel = weekDays.find(d => d.value === formData.dayOfWeek)?.label;
        return `Fatura gerada toda ${dayLabel}`;
      case 'monthly':
        return `Fatura gerada todo dia ${formData.dayOfMonth} do mês`;
      case 'custom':
        return `Fatura gerada a cada ${formData.recurrenceDays} dias`;
      default:
        return '';
    }
  };

  // Gerar opções para dia do mês
  const dayOptions = [];
  for (let i = 1; i <= 31; i++) {
    dayOptions.push(
      <option key={i} value={i}>
        Dia {i}
      </option>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? 'Editar Assinatura' : `Nova Assinatura para ${client.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Erro geral */}
        {errors.general && (
          <div className="alert alert-error">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Erro</p>
              <p className="text-sm">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Informação do cliente */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Cliente: {client.name}
              </p>
              <p className="text-sm text-blue-700">
                {client.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nome da Assinatura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Assinatura *
          </label>
          <div className="input-group">
            <div className="input-group-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className={`form-input input-group-input ${errors.name ? 'form-input-error' : ''}`}
              placeholder="Ex: Plano Premium, Delivery Semanal..."
              disabled={loading}
            />
          </div>
          {errors.name && (
            <p className="form-error">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor (R$) *
          </label>
          <div className="input-group">
            <div className="input-group-text">
              <span className="text-gray-500 text-sm">R$</span>
            </div>
            <input 
              type="text" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange}
              className={`form-input input-group-input ${errors.amount ? 'form-input-error' : ''}`}
              placeholder="0,00"
              disabled={loading}
            />
          </div>
          {errors.amount && (
            <p className="form-error">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.amount}
            </p>
          )}
        </div>

        {/* Tipo de Recorrência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Frequência de Cobrança *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recurrenceOptions.map((option) => (
              <label key={option.value} className="relative">
                <input
                  type="radio"
                  name="recurrenceType"
                  value={option.value}
                  checked={formData.recurrenceType === option.value}
                  onChange={handleChange}
                  className="sr-only"
                  disabled={loading}
                />
                <div className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  formData.recurrenceType === option.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.recurrenceType === option.value
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.recurrenceType === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Configurações específicas por tipo */}
        {formData.recurrenceType === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia da Semana *
            </label>
            <select 
              name="dayOfWeek" 
              value={formData.dayOfWeek} 
              onChange={handleChange}
              className="form-select"
              disabled={loading}
            >
              {weekDays.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.recurrenceType === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia do Vencimento *
            </label>
            <select 
              name="dayOfMonth" 
              value={formData.dayOfMonth} 
              onChange={handleChange}
              className={`form-select ${errors.dayOfMonth ? 'form-input-error' : ''}`}
              disabled={loading}
            >
              <option value="">Selecione o dia</option>
              {dayOptions}
            </select>
            {errors.dayOfMonth && (
              <p className="form-error">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.dayOfMonth}
              </p>
            )}
          </div>
        )}

        {formData.recurrenceType === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              A cada quantos dias? *
            </label>
            <div className="input-group">
              <input 
                type="number" 
                name="recurrenceDays" 
                value={formData.recurrenceDays} 
                onChange={handleChange}
                min="1"
                max="365"
                className={`form-input ${errors.recurrenceDays ? 'form-input-error' : ''}`}
                disabled={loading}
              />
              <div className="input-group-text">
                dias
              </div>
            </div>
            {errors.recurrenceDays && (
              <p className="form-error">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.recurrenceDays}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Entre 1 e 365 dias
            </p>
          </div>
        )}

        {/* Data de Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Início *
          </label>
          <div className="input-group">
            <div className="input-group-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input 
              type="date" 
              name="startDate" 
              value={formData.startDate} 
              onChange={handleChange}
              className={`form-input input-group-input ${errors.startDate ? 'form-input-error' : ''}`}
              disabled={loading}
            />
          </div>
          {errors.startDate && (
            <p className="form-error">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.startDate}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value={SUBSCRIPTION_STATUS.ACTIVE}>Ativa</option>
            <option value={SUBSCRIPTION_STATUS.INACTIVE}>Inativa</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.status === 'active' 
              ? 'Faturas serão geradas automaticamente' 
              : 'Nenhuma fatura será gerada'
            }
          </p>
        </div>

        {/* Preview */}
        {formData.name && formData.amount && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-orange-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Resumo da Assinatura
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-orange-700 font-medium">Cliente:</p>
                <p className="text-gray-900">{client.name}</p>
              </div>
              <div>
                <p className="text-orange-700 font-medium">Plano:</p>
                <p className="text-gray-900">{formData.name}</p>
              </div>
              <div>
                <p className="text-orange-700 font-medium">Valor:</p>
                <p className="text-gray-900 font-semibold">R$ {parseFloat(formData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-orange-700 font-medium">Status:</p>
                <p className="text-gray-900">{formData.status === 'active' ? '✅ Ativa' : '⏸️ Inativa'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-orange-700 font-medium">Frequência:</p>
                <p className="text-gray-900">{getRecurrenceDescription()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-orange-700 font-medium">Início:</p>
                <p className="text-gray-900">{formData.startDate ? new Date(formData.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button" 
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Salvando...
              </div>
            ) : (
              subscription ? 'Atualizar Assinatura' : 'Criar Assinatura'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubscriptionModal;