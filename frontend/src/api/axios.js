import axios from 'axios'

const API = axios.create({
  baseURL: '/api',          // uses Vite proxy → http://localhost:5000/api
  withCredentials: true,
})

// Auto-attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('medai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto handle 401 (token expired) → redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medai_token')
      localStorage.removeItem('medai_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default API