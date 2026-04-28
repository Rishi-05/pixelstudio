import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ps_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, wipe token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ps_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/api/auth/me'),
}

// ── Generation ────────────────────────────────────────────────────────────────
export const generateApi = {
  submit: (payload) => api.post('/api/generate', payload),
  getJob: (jobId) => api.get(`/api/generate/${jobId}`),
}

// ── Images ────────────────────────────────────────────────────────────────────
export const imagesApi = {
  list: (limit = 50, offset = 0) =>
    api.get('/api/images', { params: { limit, offset } }),
  get: (jobId) => api.get(`/api/images/${jobId}`),
  delete: (jobId) => api.delete(`/api/images/${jobId}`),
  share: (jobId) => api.post(`/api/images/${jobId}/share`),
  downloadUrl: (jobId) =>
    `${api.defaults.baseURL}/api/images/${jobId}/download`,
}
