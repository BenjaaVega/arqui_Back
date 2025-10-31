import React, { useState } from 'react';
import { webpayService } from '../../services/webpayService';
import './WebPayForm.css';

const WebPayForm = ({ 
  amount, 
  description, 
  propertyId = null, 
  onSuccess, 
  onError, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customAmount, setCustomAmount] = useState(amount?.toString() || '');
  const [customDescription, setCustomDescription] = useState(description || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate amount
      const validation = webpayService.validateAmount(customAmount);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // For wallet deposits, use a generic identifier as URL
      const walletUrl = 'wallet://deposit/' + Date.now();
      
      // Save transaction info in sessionStorage for wallet deposits
      sessionStorage.setItem('webpay_transaction_type', 'wallet_deposit');
      sessionStorage.setItem('webpay_transaction_description', customDescription || 'Carga de saldo a wallet');
      sessionStorage.setItem('webpay_reservation_url', walletUrl);
      sessionStorage.setItem('webpay_reservation_amount', customAmount);

      // Create WebPay transaction
      const response = await webpayService.createTransaction({
        amount: Number(customAmount),
        url: walletUrl
      });

      if (!response.token || !response.url) {
        throw new Error('Invalid response from WebPay service');
      }

      // Build the complete WebPay URL with token
      let completeUrl = response.url;
      if (!completeUrl.includes('token_ws=')) {
        const separator = completeUrl.includes('?') ? '&' : '?';
        completeUrl = `${completeUrl}${separator}token_ws=${response.token}`;
      }
      
      console.log('WebPay transaction created, redirecting to:', completeUrl);
      
      // Redirect to WebPay
      window.location.href = completeUrl;
      
    } catch (err) {
      console.error('WebPay transaction error:', err);
      setError(err.message || 'Error al procesar el pago con WebPay');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleDescriptionChange = (e) => {
    setCustomDescription(e.target.value);
  };

  return (
    <div className="webpay-form-overlay">
      <div className="webpay-form-container">
        <div className="webpay-form-header">
          <h2>💳 Pago con WebPay</h2>
          <button 
            className="webpay-form-close" 
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="webpay-form">
          <div className="webpay-form-content">
            <div className="webpay-form-info">
              <p className="webpay-form-description">
                Completa los datos para procesar tu pago de forma segura con WebPay
              </p>
            </div>

            <div className="webpay-form-field">
              <label htmlFor="webpay-amount" className="webpay-form-label">
                Monto a cargar *
              </label>
              <div className="webpay-form-input-group">
                <span className="webpay-form-currency">$</span>
                <input
                  id="webpay-amount"
                  type="number"
                  value={customAmount}
                  onChange={handleAmountChange}
                  placeholder="10000"
                  min="10000"
                  step="1"
                  required
                  disabled={loading}
                  className="webpay-form-input"
                />
              </div>
              <small className="webpay-form-help">
                Monto mínimo: $10.000 CLP
              </small>
            </div>

            <div className="webpay-form-field">
              <label htmlFor="webpay-description" className="webpay-form-label">
                Descripción (opcional)
              </label>
              <input
                id="webpay-description"
                type="text"
                value={customDescription}
                onChange={handleDescriptionChange}
                placeholder="Carga de saldo a wallet"
                disabled={loading}
                className="webpay-form-input"
                maxLength="100"
              />
            </div>

            {error && (
              <div className="webpay-form-error" role="alert">
                <span className="webpay-form-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="webpay-form-summary">
              <div className="webpay-form-summary-item">
                <span>Monto:</span>
                <span className="webpay-form-summary-amount">
                  {webpayService.formatCurrency(customAmount || 0)}
                </span>
              </div>
              <div className="webpay-form-summary-item">
                <span>Descripción:</span>
                <span>{customDescription || 'Carga de saldo a wallet'}</span>
              </div>
            </div>
          </div>

          <div className="webpay-form-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="webpay-form-button webpay-form-button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !customAmount || Number(customAmount) < 10000}
              className="webpay-form-button webpay-form-button-primary"
            >
              {loading ? (
                <>
                  <span className="webpay-form-spinner"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <span className="webpay-form-icon">💳</span>
                  Pagar con WebPay
                </>
              )}
            </button>
          </div>
        </form>

        <div className="webpay-form-footer">
          <p className="webpay-form-security">
            🔒 Tu pago está protegido por WebPay Plus
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebPayForm;
