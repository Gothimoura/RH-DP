import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from './Header'
import Sidebar from './Sidebar'

export default function MainLayout({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

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

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar Desktop */}
      {!isMobile && <Sidebar />}
      
      {/* Sidebar Mobile (Drawer) */}
      {isMobile && (
        <>
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-background ${
          isMobile ? 'p-4' : 'p-6'
        }`}>
          {children}
        </main>
      </div>
    </div>
  )
}

