import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Vaults
import VaultList from './pages/vaults/VaultList';
import VaultDetail from './pages/vaults/VaultDetail';

// Passwords
import PasswordList from './pages/passwords/PasswordList';

// Documents
import DocumentList from './pages/documents/DocumentList';
import DocumentDetail from './pages/documents/DocumentDetail';

// Settings
import Profile from './pages/settings/Profile';
import Security from './pages/settings/Security';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Vaults */}
          <Route path="vaults" element={<VaultList />} />
          <Route path="vaults/:id" element={<VaultDetail />} />

          {/* Passwords */}
          <Route path="passwords" element={<PasswordList />} />

          {/* Documents */}
          <Route path="documents" element={<DocumentList />} />
          <Route path="documents/:id" element={<DocumentDetail />} />

          {/* Settings */}
          <Route path="settings/profile" element={<Profile />} />
          <Route path="settings/security" element={<Security />} />
        </Route>

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

