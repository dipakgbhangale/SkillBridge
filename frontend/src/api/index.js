import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

// Attach JWT token on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sb_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('sb_token')
            localStorage.removeItem('sb_user')
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export default api

// ── Auth ──────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
}

// ── Users ─────────────────────────────────────────
export const usersAPI = {
    me: () => api.get('/users/me'),
    update: (data) => api.put('/users/me', data),
    getById: (id) => api.get(`/users/${id}`),
    providers: (params) => api.get('/users/providers', { params }),
    uploadAvatar: (base64) => api.put('/users/me', { avatar_url: base64 }),
}

// ── Services ──────────────────────────────────────
export const servicesAPI = {
    list: (params) => api.get('/services/', { params }),
    my: () => api.get('/services/my'),
    byProvider: (id) => api.get(`/services/provider/${id}`),
    create: (data) => api.post('/services/', data),
    update: (id, data) => api.put(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
}

// ── Bookings ──────────────────────────────────────
export const bookingsAPI = {
    create: (data) => api.post('/bookings/', data),
    myAsUser: () => api.get('/bookings/user'),
    myAsProvider: () => api.get('/bookings/provider'),
    updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
}

// ── Reviews ───────────────────────────────────────
export const reviewsAPI = {
    submit: (data) => api.post('/reviews/', data),
    edit: (bookingId, data) => api.put(`/reviews/${bookingId}`, data),
    byBooking: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
    byProvider: (id) => api.get(`/reviews/provider/${id}`),
    avgRating: (id) => api.get(`/reviews/provider/${id}/avg`),
}

// ── Calendar ──────────────────────────────────────
export const calendarAPI = {
    list: () => api.get('/calendar/'),
    create: (data) => api.post('/calendar/', data),
    delete: (id) => api.delete(`/calendar/${id}`),
}

// ── Notifications ─────────────────────────────────
export const notificationsAPI = {
    list: () => api.get('/notifications/'),
    unreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
}

// ── Availability ──────────────────────────────────
export const availabilityAPI = {
    get: () => api.get('/availability/'),
    set: (data) => api.post('/availability/', data),
    delete: (day) => api.delete(`/availability/${day}`),
}

// ── Platform Stats ────────────────────────────────
export const statsAPI = {
    get: () => api.get('/stats'),
}
