import axios from 'axios';

// Use environment variable for production; fallback to proxy in dev
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor for logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Creates a new tracking session.
 * @returns {Promise<CreateSessionResponse>}
 */
export const createSession = () => api.post('/api/sessions').then((r) => r.data);

/**
 * Retrieves session info and last known location.
 * @param {string} trackingId
 */
export const getSession = (trackingId) =>
  api.get(`/api/sessions/${trackingId}`).then((r) => r.data);

/**
 * Gets the latest location snapshot via REST (fallback before WS connects).
 * @param {string} trackingId
 * @returns {Promise<LocationBroadcast|null>}
 */
export const getLatestLocation = async (trackingId) => {
  try {
    const response = await api.get(`/api/sessions/${trackingId}/location`);
    return response.status === 204 ? null : response.data;
  } catch {
    return null;
  }
};

/**
 * Expires / ends a tracking session.
 * @param {string} trackingId
 */
export const expireSession = (trackingId) =>
  api.delete(`/api/sessions/${trackingId}`).then((r) => r.data);

export default api;
