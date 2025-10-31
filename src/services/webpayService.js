import { api } from '../lib/api';

/**
 * WebPay Service - Handles all WebPay transactions
 */
class WebPayService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
  }

  /**
   * Creates a new WebPay transaction
   * @param {Object} transactionData - Transaction details
   * @param {number} transactionData.amount - Amount in CLP
   * @param {string} transactionData.url - Property URL (required for reservations)
   * @returns {Promise<Object>} WebPay response with token and URL
   */
  async createTransaction({ amount, url }) {
    try {
      console.log('Creating WebPay transaction:', { amount, url });
      
      if (!url) {
        throw new Error('Property URL is required');
      }
      
      const payload = {
        amount: Number(amount),
        url: url
      };

      const response = await api.post('/webpay/create', payload);
      
      if (!response.data) {
        throw new Error('Invalid response from WebPay service');
      }

      console.log('WebPay transaction created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating WebPay transaction:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Error creating transaction';
        throw new Error(`WebPay Error: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to WebPay service');
      } else {
        throw new Error(`WebPay Error: ${error.message}`);
      }
    }
  }

  /**
   * Commits a WebPay transaction using the token and URL
   * @param {string} token - WebPay transaction token
   * @param {string} url - Property URL (required)
   * @returns {Promise<Object>} Transaction confirmation details
   */
  async commitTransaction(token, url) {
    try {
      console.log('Committing WebPay transaction with token:', token, 'and url:', url);
      
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid WebPay token');
      }
      
      if (!url) {
        throw new Error('Property URL is required');
      }

      const response = await api.post('/webpay/commit', { token, url });
      
      if (!response.data) {
        throw new Error('Invalid response from WebPay service');
      }

      console.log('WebPay transaction committed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error committing WebPay transaction:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Error committing transaction';
        throw new Error(`WebPay Error: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to confirm transaction');
      } else {
        throw new Error(`WebPay Error: ${error.message}`);
      }
    }
  }

  /**
   * Gets the status of a WebPay transaction
   * @param {string} token - WebPay transaction token
   * @returns {Promise<Object>} Transaction status details
   */
  async getTransactionStatus(token) {
    try {
      console.log('Getting WebPay transaction status for token:', token);
      
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid WebPay token');
      }

      const response = await api.get(`/webpay/status/${token}`);
      
      if (!response.data) {
        throw new Error('Invalid response from WebPay service');
      }

      console.log('WebPay transaction status retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting WebPay transaction status:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Error getting transaction status';
        throw new Error(`WebPay Error: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to get transaction status');
      } else {
        throw new Error(`WebPay Error: ${error.message}`);
      }
    }
  }

  /**
   * Validates amount for WebPay transaction
   * @param {number} amount - Amount to validate
   * @returns {Object} Validation result
   */
  validateAmount(amount) {
    const minAmount = 10000; // $10,000 CLP minimum
    const numAmount = Number(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, error: 'El monto debe ser un número válido mayor a 0' };
    }
    
    if (numAmount < minAmount) {
      return { valid: false, error: `El monto mínimo es $${minAmount.toLocaleString('es-CL')} CLP` };
    }
    
    return { valid: true };
  }

  /**
   * Formats currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(Number(amount));
  }

  /**
   * Formats date for display
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export singleton instance
export const webpayService = new WebPayService();
export default webpayService;
