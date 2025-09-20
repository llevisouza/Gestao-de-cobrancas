// src/components/clients/SubscriptionModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { DAYS_OF_WEEK_LABELS, SUBSCRIPTION_STATUS } from '../../utils/constants';

const SubscriptionModal = ({ isOpen, onClose, onSave, subscription, client }) => {
  const [formData, setFormData] = useState({
    amount: '',
    dayOfWeek: 'monday',
    startDate: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscription) {
      setFormData({
        amount: subscription.amount || '',
        dayOfWeek: subscription.dayOfWeek || 'monday',
        startDate: subscription.startDate || '',
        status: subscription.status || 'active'
      });
    } else {
      // Definir data de hoje como padrão para nova assinatura
      const today = new Date().toISOString().split('T')[0];
      setFormData({ 
        amount: '', 
        dayOfWeek: 'monday', 
        startDate: today, 
        status: 'active' 
      });
    }
    setErrors({});
  }, [subscription, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatação para valor monetário
    if (name === 'amount') {
      // Remove caracteres não numéricos exceto ponto e vírgula
      formattedValue = value.replace(/[^\d.,]/g, '');
      // Substitui vírgula por ponto para cálculos
      if (formattedValue.includes(',')) {
        formattedValue = formattedValue.replace(',', '.');
      }
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Limpar erro específico
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Valor obrigatório e maior que zero
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
    
    // Data de início obrigatória
    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Data não pode ser no passado';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        amount: parseFloat(formData.amount),
        clientId: client.id,
        clientName: client.name,
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      setErrors({ general: 'Erro ao salvar assinatura. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? 'Editar Assinatura' : `Nova Assinatura para ${client?.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Erro geral */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informação do cliente */}
        {client && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Cliente:</strong> {client.name}
                </p>
                <p className="text-sm text-blue-700">
                  {client.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Valor (R$) *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">R$</span>
            </div>
            <input 
              type="text" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange}
              className={`form-input pl-12 ${errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="0,00"
              disabled={loading}
            />
          </div>
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.amount}
            </p>
          )}
        </div>

        {/* Dia da Cobrança */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dia da Cobrança *
          </label>
          <select 
            name="dayOfWeek" 
            value={formData.dayOfWeek} 
            onChange={handleChange}
            className="form-input"
            disabled={loading}
          >
            {Object.entries(DAYS_OF_WEEK_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Faturas serão geradas toda semana neste dia
          </p>
        </div>

        {/* Data de Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Início *
          </label>
          <input 
            type="date" 
            name="startDate" 
            value={formData.startDate} 
            onChange={handleChange}
            className={`form-input ${errors.startDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            disabled={loading}
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.startDate}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status *
          </label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className="form-input"
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
        {formData.amount && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Resumo da Assinatura</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Cliente:</strong> {client?.name}</p>
              <p><strong>Valor:</strong> R$ {parseFloat(formData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Cobrança:</strong> Toda {DAYS_OF_WEEK_LABELS[formData.dayOfWeek]}</p>
              <p><strong>Início:</strong> {formData.startDate ? new Date(formData.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
              <p><strong>Status:</strong> {formData.status === 'active' ? 'Ativa' : 'Inativa'}</p>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="pt-4 flex justify-end space-x-3">
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
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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