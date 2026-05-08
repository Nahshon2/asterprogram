import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; organization?: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateMe: (data: { name?: string; organization?: string }) => api.patch('/auth/me', data),
}

// Doctors
export const doctorsApi = {
  list: (params?: Record<string, any>) => api.get('/doctors', { params }),
  get: (id: string) => api.get(`/doctors/${id}`),
  create: (data: any) => api.post('/doctors', data),
  update: (id: string, data: any) => api.patch(`/doctors/${id}`, data),
  delete: (id: string) => api.delete(`/doctors/${id}`),
  setPrimaryImage: (doctorId: string, imageId: string) =>
    api.patch(`/doctors/${doctorId}/images/${imageId}/primary`),
  deleteImage: (doctorId: string, imageId: string) =>
    api.delete(`/doctors/${doctorId}/images/${imageId}`),
}

// Upload
export const uploadApi = {
  uploadImages: (doctorId: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api.post(`/upload/doctor/${doctorId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Templates
export const templatesApi = {
  list: (params?: Record<string, any>) => api.get('/templates', { params }),
  get: (id: string) => api.get(`/templates/${id}`),
}

// Generations
export const generationsApi = {
  list: (params?: Record<string, any>) => api.get('/generations', { params }),
  get: (id: string) => api.get(`/generations/${id}`),
  create: (data: {
    doctorId: string
    templateId: string
    selectedImages?: string[]
    customizations?: Record<string, any>
    hospitalThemeId?: string
  }) => api.post('/generations', data),
  status: (id: string) => api.get(`/generations/${id}/status`),
  delete: (id: string) => api.delete(`/generations/${id}`),
}

// Scraper
export const scraperApi = {
  extract: (url: string) => api.post('/scraper/extract', { url }),
  createDoctor: (url: string) => api.post('/scraper/create-doctor', { url }),
}

// Admin
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params?: Record<string, any>) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  generations: (params?: Record<string, any>) => api.get('/admin/generations', { params }),
  themes: () => api.get('/admin/themes'),
  createTheme: (data: any) => api.post('/admin/themes', data),
  updateTheme: (id: string, data: any) => api.patch(`/admin/themes/${id}`, data),
  settings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: string) => api.patch(`/admin/settings/${key}`, { value }),
}
