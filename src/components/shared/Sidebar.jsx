import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Zap,
  BarChart3,
  KanbanSquare,
  Package,
  Building2,
  Settings,
  Target,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// Mapeamento de rotas para IDs de permissão
const menuItems = [
  { href: '/home', label: 'Home', icon: Home, tabId: 'home' },
  { href: '/funcionarios', label: 'Funcionários', icon: Users, tabId: 'funcionarios' },
  { href: '/equipamentos', label: 'Equipamentos', icon: Package, tabId: 'equipamentos' },
  { href: '/onboarding', label: 'Onboarding', icon: KanbanSquare, tabId: 'onboarding' },
  { href: '/calendar', label: 'Calendário', icon: Calendar, tabId: 'calendario' },
  { href: '/documents', label: 'Documentos', icon: FileText, tabId: 'documentos' },
  { href: '/avaliacoes', label: 'Avaliações', icon: Target, tabId: 'avaliacoes' },
  { href: '/quick-actions', label: 'Ações Rápidas', icon: Zap, tabId: 'quick-actions' },
  { href: '/reports', label: 'Relatórios', icon: BarChart3, tabId: 'reports' },
  { href: '/admin', label: 'Administração', icon: Settings, tabId: 'admin' },
]

export default function Sidebar({ onClose }) {
  const location = useLocation()
  const pathname = location.pathname
  const { userData } = useAuth()

  // Filtrar itens de menu baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Se userData não está carregado ou não tem allowed_tabs, mostrar todos os itens
    if (!userData || !userData.allowed_tabs) {
      return true
    }
    // Verificar se o usuário tem permissão para esta aba
    return userData.allowed_tabs.includes(item.tabId)
  })

  return (
    <aside className="w-64 h-full border-r border-border bg-card flex flex-col relative">
      <div className="p-4 md:p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-medium text-foreground">RH/DP</h1>
            <p className="text-xs text-muted-foreground hidden md:block">Sistema</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm relative group',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

