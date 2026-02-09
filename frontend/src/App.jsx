import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Admin Components
import Dashboard from './components/admin/Dashboard';
import StudentManagement from './components/admin/StudentManagement';
import SubjectManagement from './components/admin/SubjectManagement';
import MarksEntry from './components/admin/MarksEntry';
import MarksManagement from './components/admin/MarksManagement';
import BulkUpload from './components/admin/BulkUpload';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import StudentReport from './components/student/StudentReport';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Main Layout Component
const MainLayout = ({ children, isAdmin }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  </div>
);

function App() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            {isAdmin ? (
              <MainLayout isAdmin={true}>
                <Dashboard />
              </MainLayout>
            ) : (
              <MainLayout isAdmin={false}>
                <StudentDashboard />
              </MainLayout>
            )}
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/students" element={
          <ProtectedRoute requireAdmin={true}>
            <MainLayout isAdmin={true}>
              <StudentManagement />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/subjects" element={
          <ProtectedRoute requireAdmin={true}>
            <MainLayout isAdmin={true}>
              <SubjectManagement />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/marks" element={
          <ProtectedRoute requireAdmin={true}>
            <MainLayout isAdmin={true}>
              <MarksEntry />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/marks-management" element={
  <ProtectedRoute requireAdmin={true}>
    <MainLayout isAdmin={true}>
      <MarksManagement />
    </MainLayout>
  </ProtectedRoute>
} />
        <Route path="/admin/bulk-upload" element={
          <ProtectedRoute requireAdmin={true}>
            <MainLayout isAdmin={true}>
              <BulkUpload />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/student/report" element={
          <ProtectedRoute>
            <MainLayout isAdmin={false}>
              <StudentReport />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;