const DEFAULT_PUBLIC_APP_URL = 'https://carvio.fr';
const DEFAULT_WEB_API_URL = '/api';
const NATIVE_API_URL = `${DEFAULT_PUBLIC_APP_URL}/api`;

const isNativeCapacitor = () =>
  typeof window !== 'undefined' &&
  (window.Capacitor?.isNativePlatform?.() === true ||
    window.location.protocol === 'capacitor:');

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  const trimmed = trimTrailingSlashes(value.trim());
  return trimmed || '/';
};

const joinUrl = (base, path = '') => {
  if (!path) return base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base || base === '/') return normalizedPath;
  return `${base}${normalizedPath}`;
};

const isAbsoluteAssetUrl = (value) =>
  /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ||
  value.startsWith('data:') ||
  value.startsWith('blob:');

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(value);

const resolveApiUrl = () => {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_URL || '');
  if (isNativeCapacitor()) {
    return configured && isAbsoluteHttpUrl(configured) ? configured : NATIVE_API_URL;
  }
  return configured || DEFAULT_WEB_API_URL;
};

export const API_URL = resolveApiUrl();

export const PUBLIC_APP_URL = normalizeBaseUrl(
  import.meta.env.VITE_PUBLIC_APP_URL ||
  (isNativeCapacitor() ? DEFAULT_PUBLIC_APP_URL : window.location.origin)
);

export const STORAGE_PUBLIC_URL = normalizeBaseUrl(import.meta.env.VITE_STORAGE_PUBLIC_URL || '');

export const getApiUrl = (endpoint = '') => joinUrl(API_URL, endpoint);

export const getBackendUrl = (path = '') => {
  const backendBase = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
  return joinUrl(backendBase, path);
};

export const getAssetUrl = (path) => {
  if (!path || isAbsoluteAssetUrl(path)) return path;
  if (path.startsWith('/uploads/')) return getBackendUrl(path);
  if (/^\/(vehicles|documents|avatars)\//.test(path) && STORAGE_PUBLIC_URL) {
    return joinUrl(STORAGE_PUBLIC_URL, path);
  }
  if (isNativeCapacitor() && path.startsWith('/')) return getBackendUrl(path);
  return path;
};

export const getPublicAppUrl = (path = '') => joinUrl(PUBLIC_APP_URL, path);

const STORAGE_TOKEN = 'carvault_token';
const STORAGE_REFRESH = 'carvault_refresh_token';

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const result = String(reader.result || '');
    resolve(result.includes(',') ? result.split(',')[1] : result);
  };
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const downloadBlob = async (blob, filename) => {
  if (isNativeCapacitor()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const saved = await Filesystem.writeFile({
      path: filename,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: filename,
      text: 'Dossier PDF Carvio',
      url: saved.uri,
      dialogTitle: 'Partager ou enregistrer le PDF',
    });
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  a.remove();
};

export const downloadPdfFromUrl = async (url, filename = 'Carvio_Dossier.pdf', headers = {}) => {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    let msg = 'Erreur lors de la génération du PDF';
    try {
      const json = JSON.parse(text);
      if (json?.error) msg = json.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const blob = await response.blob();
  const dispositionFilename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1];
  await downloadBlob(blob, dispositionFilename || filename);
};

/**
 * Client API centralisé pour Carvio
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
    this._refreshPromise = null; // Prevents parallel refresh calls
  }

  getToken() {
    return localStorage.getItem(STORAGE_TOKEN);
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

  /**
   * Try to refresh the access token using the stored refresh token.
   * Returns true if refresh succeeded, false otherwise.
   */
  async _tryRefresh() {
    const refreshToken = localStorage.getItem(STORAGE_REFRESH);
    if (!refreshToken) return false;

    // If a refresh is already in flight, wait for it
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = (async () => {
      try {
        const res = await fetch(joinUrl(this.baseUrl, '/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem(STORAGE_TOKEN, data.token);
        localStorage.setItem(STORAGE_REFRESH, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  async request(endpoint, options = {}) {
    const { body, method = 'GET', isFormData = false, headers: extraHeaders } = options;

    const config = {
      method,
      headers: { ...this.getHeaders(isFormData), ...(extraHeaders || {}) },
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    let response = await fetch(joinUrl(this.baseUrl, endpoint), config);

    // On 401, attempt a silent refresh and retry once
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      const refreshed = await this._tryRefresh();
      if (refreshed) {
        // Retry with new token
        config.headers = this.getHeaders(isFormData);
        response = await fetch(joinUrl(this.baseUrl, endpoint), config);
      }
    }

    let data;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        const error = new Error(`Erreur serveur (${response.status})`);
        error.status = response.status;
        throw error;
      }
      return null;
    }

    if (!response.ok) {
      const error = new Error(data.error || 'Une erreur est survenue');
      error.status = response.status;
      error.code = data.code;
      throw error;
    }

    return data;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, options);
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
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (formData) => api.request('/auth/profile', { method: 'PATCH', body: formData, isFormData: true }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
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
  backfill: () => api.post('/vehicles/backfill'),
  getMaintenancePlan: (id) => api.get(`/vehicles/${id}/maintenance`),
  updateMaintenancePlan: (id, intervals) => api.put(`/vehicles/${id}/maintenance`, { intervals }),
  downloadPdf: async (id) => {
    const token = localStorage.getItem('carvault_token');
    await downloadPdfFromUrl(getApiUrl(`/vehicles/${id}/pdf`), 'Carvio_Dossier.pdf', {
      Authorization: `Bearer ${token}`,
    });
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
  create: (vehicleId, opts = {}) => api.post('/share', { vehicleId, ...opts }),
  getLinks: (vehicleId) => api.get(`/share/vehicle/${vehicleId}`),
  revoke: (id) => api.delete(`/share/link/${id}`),
  getPublic: (token, password) => {
    const url = `/share/${token}`;
    return api.get(url, password ? { headers: { 'X-Share-Password': password } } : undefined);
  },
  checkAccess: (token) => api.get(`/share/${token}/check`),
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

// ===== Fuel Tracker =====
export const fuelApi = {
  getAll: (vehicleId) => api.get(`/vehicles/${vehicleId}/fuel`),
  create: (vehicleId, data) => api.post(`/vehicles/${vehicleId}/fuel`, data),
  delete: (vehicleId, id) => api.delete(`/vehicles/${vehicleId}/fuel/${id}`),
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

export const badgeApi = {
  getAll: () => api.get('/badges'),
};

export const subscriptionApi = {
  getStatus: () => api.get('/subscription/status'),
  createCheckout: (plan = 'yearly') => api.post('/subscription/checkout', { plan }),
  createPortal: () => api.post('/subscription/portal'),
};

export const pushApi = {
  getVapidKey: () => api.get('/push/vapid-key'),
  subscribe: (subscription) => api.post('/push/subscribe', { subscription }),
  unsubscribe: (endpoint) => api.post('/push/unsubscribe', { endpoint }),
};

export const coteApi = {
  get: (vehicleId) => api.get(`/cote/${vehicleId}`),
  update: (vehicleId, estimatedValue) => api.put(`/cote/${vehicleId}`, { estimatedValue }),
};

