import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DiaryPage from './pages/DiaryPage'
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
          <Route path="/diary/:date" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute><DiaryRedirect /></ProtectedRoute>} />

          {/* Default route */}
          <Route path="/" element={<Navigate to="/diary" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
