import React, { useState, useEffect } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import Modal from '../common/Modal';

const ClientModal = ({ client, onClose }) => {
  const { createClient, updateClient } = useFirestore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    document: '',
    notes: '',
    status: 'active'
  });

  const isEditing = !!client;

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        document: client.document || '',
        notes: client.notes || '',
        status: client.status || 'active'
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.name.trim()) {
        alert('Nome é obrigatório');
        return;
      }
      if (!formData.email.trim()) {
        alert('Email é obrigatório');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert('Email inválido');
        return;
      }

      if (isEditing) {
        await updateClient(client.id, formData);
      } else {
        await createClient(formData);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente: ' + error.message);
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

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        <button onClick={onClose} className="modal-close">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome completo do cliente"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Documento (CPF/CNPJ)</label>
            <input
              type="text"
              className="form-input"
              value={formData.document}
              onChange={(e) => handleChange('document', e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Endereço completo"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              className="form-input"
              rows="3"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observações sobre o cliente..."
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
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Cliente')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientModal;