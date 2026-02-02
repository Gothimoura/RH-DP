import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { User, LogOut, Menu, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditProfileModal from './EditProfileModal'
import NotificationsDropdown from './NotificationsDropdown'

export default function Header({ onMenuClick, isMobile = false }) {
  const { user, userData, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-border bg-card h-14 md:h-16 flex items-center sticky top-0 z-30">
      <div className={`flex items-center justify-between w-full ${
        isMobile ? 'px-4' : 'px-6'
      }`}>
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div>
            <h2 className={`font-medium text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
              {isMobile ? 'RH/DP' : 'Sistema RH/DP'}
            </h2>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">
                Gestão de funcionários e equipamentos
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Botão de toggle de tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          
          <NotificationsDropdown />
          
          {/* Área do usuário - clicável para editar perfil */}
          {!isMobile && (
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              title="Editar perfil"
            >
              {userData?.photo ? (
                <img
                  src={userData.photo}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground">
                {userData?.name || 'Usuário'}
              </span>
            </button>
          )}
          
          {isMobile && (
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              title="Editar perfil"
            >
              {userData?.photo ? (
                <img
                  src={userData.photo}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          )}
          
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal de editar perfil */}
      {showEditProfile && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </header>
  )
}

