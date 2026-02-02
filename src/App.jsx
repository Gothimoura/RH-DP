import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ColaboradoresPage from './pages/ColaboradoresPage'
import ColaboradorDetailsPage from './pages/ColaboradorDetailsPage'
import OnboardingPage from './pages/OnboardingPage'
import EquipamentosPage from './pages/EquipamentosPage'
import EquipmentDetailsPage from './pages/EquipmentDetailsPage'
import CalendarPage from './pages/CalendarPage'
import DocumentsPage from './pages/DocumentsPage'
import QuickActionsPage from './pages/QuickActionsPage'
import ReportsPage from './pages/ReportsPage'
import AdminPage from './pages/AdminPage'
import AvaliacoesPage from './pages/AvaliacoesPage'
import AvaliacoesPublicPage from './pages/AvaliacoesPublicPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return user ? <Navigate to="/home" replace /> : children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      {/* Redirecionamento de /dashboard para /home (compatibilidade) */}
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/funcionarios"
        element={
          <PrivateRoute>
            <ColaboradoresPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/funcionarios/:id"
        element={
          <PrivateRoute>
            <ColaboradorDetailsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <OnboardingPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/equipamentos"
        element={
          <PrivateRoute>
            <EquipamentosPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/equipamentos/:type/:id"
        element={
          <PrivateRoute>
            <EquipmentDetailsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/calendar"
        element={
          <PrivateRoute>
            <CalendarPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <DocumentsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/quick-actions"
        element={
          <PrivateRoute>
            <QuickActionsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <ReportsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/avaliacoes"
        element={
          <PrivateRoute>
            <AvaliacoesPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/avaliacoes/public/:token"
        element={<AvaliacoesPublicPage />}
      />
    </Routes>
  )
}

export default App

