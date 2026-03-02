const API_URL = '/api';

/**
 * Client API centralisé pour CarVault
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('carvault_token');
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const { body, method = 'GET', isFormData = false } = options;

    const config = {
      method,
      headers: this.getHeaders(isFormData),
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'Une erreur est survenue');
      error.status = response.status;
      throw error;
    }

    return data;
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, body, isFormData = false) {
    return this.request(endpoint, { method: 'POST', body, isFormData });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();

// ===== Auth =====
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ===== Dashboard =====
export const dashboardApi = {
  getData: () => api.get('/dashboard'),
};

// ===== Vehicles =====
export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  getHealth: (id) => api.get(`/vehicles/${id}/health`),
  create: (formData) => api.post('/vehicles', formData, true),
  update: (id, formData) => api.request(`/vehicles/${id}`, { method: 'PUT', body: formData, isFormData: true }),
  delete: (id) => api.delete(`/vehicles/${id}`),
  downloadPdf: async (id) => {
    const token = localStorage.getItem('carvault_token');
    const response = await fetch(`/api/vehicles/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      let msg = 'Erreur lors de la génération du PDF';
      try {
        const json = JSON.parse(text);
        if (json?.error) msg = json.error;
      } catch (_) {}
      throw new Error(msg);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'CarVault_Dossier.pdf';
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};

// ===== Documents =====
export const documentApi = {
  getAll: (type) => api.get(`/documents${type ? `?type=${type}` : ''}`),
  getByVehicle: (vehicleId, type) => api.get(`/documents/vehicle/${vehicleId}${type ? `?type=${type}` : ''}`),
  create: (formData) => api.post('/documents', formData, true),
  delete: (id) => api.delete(`/documents/${id}`),
  detectType: (filename) => api.get(`/documents/detect-type?filename=${encodeURIComponent(filename)}`),
};

// ===== Expenses =====
export const expenseApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/expenses${query ? `?${query}` : ''}`);
  },
  getByVehicle: (vehicleId) => api.get(`/expenses/vehicle/${vehicleId}`),
  getStats: () => api.get('/expenses/stats'),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// ===== Alerts =====
export const alertApi = {
  getAll: (unread = false) => api.get(`/alerts${unread ? '?unread=true' : ''}`),
  countUnread: () => api.get('/alerts/count'),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  snooze: (id, days) => api.put(`/alerts/${id}/snooze`, { days }),
  checkExpiring: () => api.post('/alerts/check'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// ===== Share Links =====
export const shareApi = {
  create: (vehicleId, expiresInDays) => api.post('/share', { vehicleId, expiresInDays }),
  getLinks: (vehicleId) => api.get(`/share/vehicle/${vehicleId}`),
  revoke: (id) => api.delete(`/share/link/${id}`),
  getPublic: (token) => api.get(`/share/${token}`),
};

// ===== Notification Preferences =====
export const notificationApi = {
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (prefs) => api.put('/notifications/preferences', prefs),
};

// ===== Mileage =====
export const mileageApi = {
  getAll: (vehicleId) => api.get(`/vehicles/${vehicleId}/mileage`),
  create: (vehicleId, data) => api.post(`/vehicles/${vehicleId}/mileage`, data),
  delete: (vehicleId, id) => api.delete(`/vehicles/${vehicleId}/mileage/${id}`),
};

// ===== Brands (marques & modèles via CarAPI) =====
export const brandApi = {
  getAll: () => api.get('/brands'),
  getModels: (brand) => api.get(`/brands/${encodeURIComponent(brand)}/models`),
  search: (q) => api.get(`/brands/search?q=${encodeURIComponent(q)}`),
  getTrims: (year, make, model) => api.get(`/brands/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`),
  getTrimById: (id) => api.get(`/brands/trims/${id}`),
  lookupPlate: (plate) => api.get(`/brands/plate/${encodeURIComponent(plate)}`),
};

export default api;
