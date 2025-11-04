import { api } from '../lib/api';

class RecommendationService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
  }

  async getHeartbeat() {
    const { data } = await api.get('/worker/heartbeat');
    return data;
  }

  async createJob(payload) {
    const { data } = await api.post('/recommendations/generate', payload);
    return data;
  }

  async getJob(jobId) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    const { data } = await api.get(`/recommendations/${jobId}`);
    return data;
  }

  async listJobs(params) {
    const { data } = await api.get('/jobs', { params });
    return data;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
