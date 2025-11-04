import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { webpayService } from '../../services/webpayService';
import { recommendationsService } from '../../services/recommendationsService';
import { useApiAuth } from '../../lib/api';
import './WebPayReturn.css';

const WebPayReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  useApiAuth();

  const [status, setStatus] = useState('processing'); // processing, success, error
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [transactionType, setTransactionType] = useState(() => sessionStorage.getItem('webpay_transaction_type'));

  const token = searchParams.get('token_ws');

  const handleWebPayReturn = useCallback(async () => {
    try {
      console.log('Processing WebPay return with token:', token);
      setStatus('processing');

      // Determine transaction type from sessionStorage
      const storedTransactionType = sessionStorage.getItem('webpay_transaction_type');
      setTransactionType(storedTransactionType);

      let propertyUrl;
      if (storedTransactionType === 'wallet_deposit') {
        // For wallet deposits, retrieve the wallet URL from the transaction
        propertyUrl = sessionStorage.getItem('webpay_reservation_url') || 'wallet://deposit';
      } else {
        // For reservations, use the property URL
        propertyUrl = sessionStorage.getItem('webpay_reservation_url');
      }
      
      if (!propertyUrl) {
        throw new Error('No se encontró la información de la transacción');
      }

      console.log('Retrieved URL from sessionStorage:', propertyUrl);

      // Commit the transaction with the URL
      const result = await webpayService.commitTransaction(token, propertyUrl);

      if (!result?.success) {
        throw new Error(result?.error || 'La transacción fue rechazada');
      }

      const propertyContextRaw = sessionStorage.getItem('webpay_reservation_context');
      let propertyContext = null;
      if (propertyContextRaw) {
        try {
          propertyContext = JSON.parse(propertyContextRaw);
        } catch (parseError) {
          console.warn('No se pudo parsear el contexto de reserva para recomendaciones:', parseError);
        }
      }

      if (storedTransactionType !== 'wallet_deposit') {
        recommendationsService.generateFromPurchase(propertyContext ?? { url: propertyUrl }).then((response) => {
          if (response?.job_id) {
            console.log('Recommendation job triggered successfully:', response.job_id);
          }
        });
      }

      if (!result) {
        throw new Error('No se pudo confirmar la transacción');
      }

      console.log('WebPay transaction committed successfully:', result);
      setTransaction(result.transaction || result);
      setStatus('success');

      // Clean up sessionStorage
      sessionStorage.removeItem('webpay_reservation_url');
      sessionStorage.removeItem('webpay_reservation_price');
      sessionStorage.removeItem('webpay_reservation_amount');
      sessionStorage.removeItem('webpay_transaction_type');
      sessionStorage.removeItem('webpay_transaction_description');
      sessionStorage.removeItem('webpay_reservation_context');

    } catch (err) {
      console.error('Error processing WebPay return:', err);
      setError(err.message || 'Error al procesar el pago');
      setStatus('error');

      // Clean up sessionStorage on error
      sessionStorage.removeItem('webpay_reservation_url');
      sessionStorage.removeItem('webpay_reservation_price');
      sessionStorage.removeItem('webpay_reservation_amount');
      sessionStorage.removeItem('webpay_transaction_type');
      sessionStorage.removeItem('webpay_transaction_description');
      sessionStorage.removeItem('webpay_reservation_context');
    }
  }, [token]);

  useEffect(() => {
    // No redirigir inmediatamente si no está autenticado, dejar que el componente renderice
    // La autenticación puede estar cargando
    if (!token) {
      setError('Token de transacción no encontrado');
      setStatus('error');
      return;
    }

    // Solo procesar si está autenticado
    if (isAuthenticated) {
      handleWebPayReturn();
    }
  }, [token, isAuthenticated, handleWebPayReturn]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      // Navigate to different pages based on transaction type
      if (transactionType === 'wallet_deposit') {
        navigate('/wallet');
      } else {
        navigate('/visit-history');
      }
    }
  }, [status, countdown, transactionType, navigate]);

  const handleRetry = () => {
    setError('');
    setStatus('processing');
    handleWebPayReturn();
  };

  const handleGoToWallet = () => {
    navigate('/wallet');
  };

  const renderProcessingState = () => (
    <div className="webpay-return-container">
      <div className="webpay-return-card webpay-return-processing">
        <div className="webpay-return-icon">
          <div className="webpay-return-spinner"></div>
        </div>
        {(() => {
          const isWalletDeposit = transactionType === 'wallet_deposit';
          return isWalletDeposit ? (
            <>
              <h2>Procesando tu pago...</h2>
              <p>Por favor espera mientras confirmamos tu carga de dinero con WebPay</p>
            </>
          ) : (
            <>
              <h2>Procesando tu reserva...</h2>
              <p>Por favor espera mientras confirmamos tu pago de reserva con WebPay</p>
            </>
          );
        })()}
        <div className="webpay-return-details">
          <div className="webpay-return-detail">
            <span>Token:</span>
            <span className="webpay-return-token">{token}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="webpay-return-container">
      <div className="webpay-return-card webpay-return-success">
        <div className="webpay-return-icon">
          <div className="webpay-return-success-icon">✅</div>
        </div>
        {(() => {
          const isWalletDeposit = transactionType === 'wallet_deposit';
          return isWalletDeposit ? (
            <>
              <h2>¡Pago Exitoso!</h2>
              <p>Tu dinero ha sido cargado a tu wallet correctamente</p>
            </>
          ) : (
            <>
              <h2>¡Reserva Confirmada!</h2>
              <p>Tu pago de reserva ha sido procesado correctamente</p>
            </>
          );
        })()}
        
        {transaction && (
          <div className="webpay-return-transaction-details">
            <h3>Detalles de la Transacción</h3>
            <div className="webpay-return-details">
              <div className="webpay-return-detail">
                <span>Monto:</span>
                <span className="webpay-return-amount">
                  {webpayService.formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="webpay-return-detail">
                <span>Descripción:</span>
                <span>{transaction.description || 'Carga de saldo a wallet'}</span>
              </div>
              {transaction.authorization_code && (
                <div className="webpay-return-detail">
                  <span>Código de Autorización:</span>
                  <span className="webpay-return-code">
                    {transaction.authorization_code}
                  </span>
                </div>
              )}
              {transaction.transaction_date && (
                <div className="webpay-return-detail">
                  <span>Fecha:</span>
                  <span>{webpayService.formatDate(transaction.transaction_date)}</span>
                </div>
              )}
              <div className="webpay-return-detail">
                <span>Estado:</span>
                <span className="webpay-return-status webpay-return-status-success">
                  Autorizada
                </span>
              </div>
            </div>
          </div>
        )}

        {(() => {
          const isWalletDeposit = transactionType === 'wallet_deposit';
          return (
            <div className="webpay-return-actions">
              <button
                onClick={() => navigate(isWalletDeposit ? '/wallet' : '/visit-history')}
                className="webpay-return-button webpay-return-button-primary"
              >
                {isWalletDeposit ? 'Ir a Mi Wallet' : 'Ver Historial de Visitas'}
              </button>
            </div>
          );
        })()}

        <div className="webpay-return-countdown">
          <p>Redirigiendo automáticamente en {countdown} segundos...</p>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="webpay-return-container">
      <div className="webpay-return-card webpay-return-error">
        <div className="webpay-return-icon">
          <div className="webpay-return-error-icon">❌</div>
        </div>
        <h2>Error en el Pago</h2>
        <p>No se pudo procesar tu transacción</p>
        
        <div className="webpay-return-error-details">
          <div className="webpay-return-error-message">
            <strong>Detalles del error:</strong>
            <p>{error}</p>
          </div>
          
          {token && (
            <div className="webpay-return-details">
              <div className="webpay-return-detail">
                <span>Token:</span>
                <span className="webpay-return-token">{token}</span>
              </div>
            </div>
          )}
        </div>

        <div className="webpay-return-actions">
          <button 
            onClick={handleRetry}
            className="webpay-return-button webpay-return-button-secondary"
          >
            Reintentar
          </button>
          <button 
            onClick={handleGoToWallet}
            className="webpay-return-button webpay-return-button-primary"
          >
            Ir a Mi Wallet
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  switch (status) {
    case 'processing':
      return renderProcessingState();
    case 'success':
      return renderSuccessState();
    case 'error':
      return renderErrorState();
    default:
      return renderProcessingState();
  }
};

export default WebPayReturn;
