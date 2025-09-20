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

  useEffect(() => {
    if (subscription) {
      setFormData({
        amount: subscription.amount || '',
        dayOfWeek: subscription.dayOfWeek || 'monday',
        startDate: subscription.startDate || '',
        status: subscription.status || 'active'
      });
    } else {
      setFormData({ amount: '', dayOfWeek: 'monday', startDate: '', status: 'active' });
    }
  }, [subscription, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      clientId: client.id,
      clientName: client.name,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? 'Editar Assinatura' : `Nova Assinatura para ${client?.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
          <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dia da Cobrança</label>
          <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            {Object.entries(DAYS_OF_WEEK_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Data de Início</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            <option value={SUBSCRIPTION_STATUS.ACTIVE}>Ativa</option>
            <option value={SUBSCRIPTION_STATUS.INACTIVE}>Inativa</option>
          </select>
        </div>
        <div className="pt-4 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  );
};

export default SubscriptionModal;