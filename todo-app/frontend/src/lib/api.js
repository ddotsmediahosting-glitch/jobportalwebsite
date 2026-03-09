import axios from 'axios'

// In Electron (file:// protocol) we talk directly to the embedded backend.
// In browser dev mode the Vite proxy forwards /api → localhost:5000.
const isElectron = window.location.protocol === 'file:'
const BASE_URL = isElectron ? 'http://localhost:5199/api' : '/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
