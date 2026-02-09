import { authAPI } from './api';

class AuthService {
  async login(email, password) {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        this.setAuthData(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        this.setAuthData(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await authAPI.getMe();
      return response.data;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  setAuthData(authData) {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  getAuthData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  }

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  isAdmin() {
    const user = this.getAuthData().user;
    return user?.role === 'admin';
  }

  isStudent() {
    const user = this.getAuthData().user;
    return user?.role === 'student';
  }

  getStudentId() {
    const user = this.getAuthData().user;
    console.log('Auth service - User:', user);
    
    // If user has studentId field directly
    if (user?.studentId) {
      console.log('Found studentId in user:', user.studentId);
      return user.studentId;
    }
    
    // If student data is nested
    if (user?.studentId?._id) {
      console.log('Found nested studentId:', user.studentId._id);
      return user.studentId._id;
    }
    
    // If studentId is a string
    if (typeof user?.studentId === 'string') {
      console.log('Found string studentId:', user.studentId);
      return user.studentId;
    }
    
    console.log('No studentId found in user object:', user);
    return null;
  }
}

// Create and export a single instance
const authService = new AuthService();

// Named export
export { authService };

// Default export
export default authService;