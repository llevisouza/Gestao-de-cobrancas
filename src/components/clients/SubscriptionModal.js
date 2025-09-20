import React, { useState, useEffect } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import Modal from '../common/Modal';
import { BILLING_CYCLES, SERVICE_TYPES } from '../../utils/constants';

const SubscriptionModal = ({ client, subscription, onClose }) => {
  const { createSubscription, updateSubscription } = useFirestore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service: '',
    description: '',
    value: '',
    billingCycle: 'monthly',
    startDate: '',
    status: 'active',
    notes: ''
  });

  const isEditing = !!subscription;

  useEffect(() => {
    if (subscription) {
      setFormData({
        service: subscription.service || '',
        description: subscription.description || '',
        value: subscription.value || '',
        billingCycle: subscription.billingCycle || 'monthly',
        startDate: subscription.startDate || '',
        status: subscription.status || 'active',
        notes: subscription.notes || ''
      });
    } else {
      // Definir data de início como hoje para novas assinaturas
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: today
      }));
    }
  }, [subscription]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.service.trim()) {
        alert('Serviço é obrigatório');
        return;
      }
      if (!formData.value || parseFloat(formData.value) <= 0) {
        alert('Valor deve ser maior que zero');
        return;
      }
      if (!formData.startDate) {
        alert('Data de início é obrigatória');
        return;
      }

      const subscriptionData = {
        ...formData,
        clientId: client.id,
        value: parseFloat(formData.value)
      };

      if (isEditing) {
        await updateSubscription(subscription.id, subscriptionData);
      } else {
        await createSubscription(subscriptionData);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      alert('Erro ao salvar assinatura: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceSelect = (service) => {
    setFormData(prev => ({
      ...prev,
      service: service.name,
      description: service.description,
      value: service.defaultValue || ''
    }));
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">
          {isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}
        </h2>
        <button onClick={onClose} className="modal-close">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {client && (
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <div style={{ 
                padding: '0.625rem 0.75rem', 
                background: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem',
                fontWeight: '500'
              }}>
                {client.name} - {client.email}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Serviço *</label>
            <input
              type="text"
              className="form-input"
              value={formData.service}
              onChange={(e) => handleChange('service', e.target.value)}
              placeholder="Nome do serviço"
              required
            />
          </div>

          {/* Serviços pré-definidos */}
          {!isEditing && (
            <div className="form-group">
              <label className="form-label">Serviços Sugeridos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SERVICE_TYPES.map((service, index) => (
                  <button
                    key={index}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleServiceSelect(service)}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-input"
              rows="2"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descrição detalhada do serviço..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ciclo de Cobrança *</label>
            <select
              className="form-select"
              value={formData.billingCycle}
              onChange={(e) => handleChange('billingCycle', e.target.value)}
              required
            >
              {BILLING_CYCLES.map(cycle => (
                <option key={cycle.value} value={cycle.value}>
                  {cycle.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Data de Início *</label>
            <input
              type="date"
              className="form-input"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="active">Ativa</option>
              <option value="paused">Pausada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              className="form-input"
              rows="2"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observações sobre a assinatura..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Assinatura')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubscriptionModal;