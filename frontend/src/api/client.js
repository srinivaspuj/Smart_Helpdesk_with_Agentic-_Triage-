import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const client = axios.create({
  baseURL: API_BASE_URL,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const auth = {
  login: (credentials) => client.post('/auth/login', credentials),
  register: (userData) => client.post('/auth/register', userData),
}

export const tickets = {
  getAll: (params = {}) => client.get('/tickets', { params }),
  getById: (id) => client.get(`/tickets/${id}`),
  create: (ticket) => client.post('/tickets', ticket),
  reply: (id, reply) => client.post(`/tickets/${id}/reply`, reply),
  assign: (id, assigneeId) => client.post(`/tickets/${id}/assign`, { assigneeId }),
  getAudit: (id) => client.get(`/tickets/${id}/audit`),
}

export const kb = {
  getAll: (params = {}) => client.get('/kb', { params }),
  getById: (id) => client.get(`/kb/${id}`),
  create: (article) => client.post('/kb', article),
  update: (id, article) => client.put(`/kb/${id}`, article),
  delete: (id) => client.delete(`/kb/${id}`),
}

export const agent = {
  triage: (ticketId) => client.post('/agent/triage', { ticketId }),
  getSuggestion: (ticketId) => client.get(`/agent/suggestion/${ticketId}`),
}

export const config = {
  get: () => client.get('/config'),
  update: (settings) => client.put('/config', settings),
}

export default client