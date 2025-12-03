import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DiaryPage from './pages/DiaryPage'
import DashboardPage from './pages/DashboardPage'
import ReflectionPage from './pages/ReflectionPage'
import DiaryRedirect from './components/DiaryRedirect'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public only */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/diary/:date" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute><DiaryRedirect /></ProtectedRoute>} />
          <Route path="/reflection" element={<ProtectedRoute><ReflectionPage /></ProtectedRoute>} />

          {/* Default route */}
          <Route path="/" element={<Navigate to="/diary" replace />} />
          
          {/* Catch all - redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
