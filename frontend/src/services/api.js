import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Student APIs
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  assignSubjects: (id, subjectIds) => 
    api.post(`/students/${id}/subjects`, { subjectIds }),
};

// Subject APIs
export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  bulkCreate: (subjects) => api.post('/subjects/bulk', { subjects }),
};

// Marks APIs
export const markAPI = {
  enterMarks: (data) => api.post('/marks', data),
  getStudentMarks: (studentId) => api.get(`/marks/student/${studentId}`),
  getSubjectMarks: (subjectId, params) => 
    api.get(`/marks/subject/${subjectId}`, { params }),
  updateMarks: (id, data) => api.put(`/marks/${id}`, data),
  deleteMarks: (id) => api.delete(`/marks/${id}`),
  bulkEnterMarks: (marksData) => api.post('/marks/bulk', { marksData }),
  getDashboardStats: () => api.get('/marks/dashboard'),
};

export default api;