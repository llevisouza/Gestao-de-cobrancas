import React, { useEffect } from 'react';

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    // Fechar modal com ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevenir scroll do body quando modal está aberto
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content fade-in">
        {children}
      </div>
    </div>
  );
};

export default Modal;