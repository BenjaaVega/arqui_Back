import { api } from '../lib/api';

class RecommendationsService {
  async generateFromPurchase(propertyContext = {}, options = {}) {
    try {
      const {
        id,
        url,
        price,
        bedrooms,
        bathrooms,
        location,
        title
      } = propertyContext || {};

      if (!url) {
        console.warn('generateFromPurchase called without a property URL; skipping worker trigger.');
        return null;
      }

      const numericPrice = typeof price === 'number' ? price : Number(price);
      const hasValidPrice = Number.isFinite(numericPrice) && numericPrice > 0;
      const budgetOffset = hasValidPrice ? Math.floor(numericPrice * 0.2) : null;

      const payload = {
        property_id: id != null ? String(id) : null,
        preferences: {},
        budget_min: hasValidPrice ? Math.max(numericPrice - budgetOffset, 0) : null,
        budget_max: hasValidPrice ? numericPrice + budgetOffset : null,
        location: location || null,
        bedrooms: bedrooms != null ? Number(bedrooms) : null,
        bathrooms: bathrooms != null ? Number(bathrooms) : null,
        ...options
      };

      if (hasValidPrice) {
        payload.preferences.price_range = [
          Math.max(numericPrice - budgetOffset, 0),
          numericPrice + budgetOffset
        ];
      }

      if (location) {
        payload.preferences.location = location;
      }

      if (bedrooms != null) {
        payload.preferences.bedrooms = Number(bedrooms);
      }

      if (bathrooms != null) {
        payload.preferences.bathrooms = Number(bathrooms);
      }

      if (title) {
        payload.preferences.reference_title = title;
      }

      const response = await api.post('/recommendations/generate', payload);
      return response.data;
    } catch (error) {
      console.error('Failed to trigger recommendations worker:', error);
      return null;
    }
  }
}

export const recommendationsService = new RecommendationsService();
export default recommendationsService;
