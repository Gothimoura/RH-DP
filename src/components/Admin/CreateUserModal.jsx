import { X, User, Mail, Shield, CheckSquare, Square, LayoutGrid, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { authService } from '@/services/auth.service'
import { usersService } from '@/services/users.service'

// Definição das abas disponíveis no sistema
const AVAILABLE_TABS = [
  { id: 'home', label: 'Home', description: 'Página inicial do sistema' },
  { id: 'funcionarios', label: 'Funcionários', description: 'Gerenciamento de funcionários' },
  { id: 'equipamentos', label: 'Equipamentos', description: 'Gerenciamento de equipamentos' },
  { id: 'onboarding', label: 'Onboarding', description: 'Processo de integração' },
  { id: 'calendario', label: 'Calendário', description: 'Agenda e eventos' },
  { id: 'documentos', label: 'Documentos', description: 'Geração de documentos' },
  { id: 'avaliacoes', label: 'Avaliações', description: 'Avaliações de desempenho' },
  { id: 'quick-actions', label: 'Ações Rápidas', description: 'Atalhos do sistema' },
  { id: 'reports', label: 'Relatórios', description: 'Relatórios e estatísticas' },
  { id: 'admin', label: 'Administração', description: 'Configurações do sistema' },
]

export default function CreateUserModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('user')
  const [accessMedicoes, setAccessMedicoes] = useState(true)
  const [accessDpRh, setAccessDpRh] = useState(false)
  const [allowedTabs, setAllowedTabs] = useState(AVAILABLE_TABS.map(t => t.id))

  useEffect(() => {
    if (isOpen) {
      // Resetar formulário quando abrir
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('user')
      setAccessMedicoes(true)
      setAccessDpRh(false)
      setAllowedTabs(AVAILABLE_TABS.map(t => t.id))
    }
  }, [isOpen])

  const toggleTab = (tabId) => {
    setAllowedTabs(prev => 
      prev.includes(tabId) 
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId]
    )
  }

  const selectAllTabs = () => {
    setAllowedTabs(AVAILABLE_TABS.map(t => t.id))
  }

  const deselectAllTabs = () => {
    setAllowedTabs([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name || !email || !password) {
      alert('Nome, email e senha são obrigatórios')
      return
    }

    if (password !== confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      // Criar usuário no Supabase Auth
      const authData = await authService.signUp(email.trim(), password, { name: name.trim() })

      if (authData.user) {
        // Aguardar um pouco para garantir que o trigger do Supabase tenha criado o registro
        await new Promise(resolve => setTimeout(resolve, 500))

        // Usar upsert para criar ou atualizar o registro na tabela profiles
        // Isso resolve o problema de race condition com o trigger do Supabase
        await usersService.upsert({
          id: authData.user.id,
          name: name.trim(),
          email: email.trim(),
          role: role,
          access_medicoes: accessMedicoes,
          access_dp_rh: accessDpRh,
          allowed_tabs: allowedTabs,
        })

        alert('Usuário criado com sucesso!')
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Novo Usuário</h2>
              <p className="text-sm text-muted-foreground">Criar um novo usuário no sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                required
                minLength={6}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Perfil de Acesso
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
              <option value="rh">RH</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Administradores têm acesso completo ao sistema
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Permissões de Acesso</h3>
            
            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <button
                type="button"
                onClick={() => setAccessMedicoes(!accessMedicoes)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {accessMedicoes ? (
                  <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Acesso a Medições</p>
                  <p className="text-xs text-muted-foreground">Permite acesso ao módulo de medições</p>
                </div>
              </button>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <button
                type="button"
                onClick={() => setAccessDpRh(!accessDpRh)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {accessDpRh ? (
                  <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Acesso a DP/RH</p>
                  <p className="text-xs text-muted-foreground">Permite acesso ao módulo de DP/RH</p>
                </div>
              </button>
            </div>
          </div>

          {/* Permissões de Abas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Abas Permitidas
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllTabs}
                  className="text-xs text-primary hover:underline"
                >
                  Selecionar todas
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={deselectAllTabs}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Selecione quais abas do menu este usuário pode visualizar
            </p>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {AVAILABLE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => toggleTab(tab.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                    allowedTabs.includes(tab.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                  }`}
                >
                  {allowedTabs.includes(tab.id) ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tab.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{tab.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {allowedTabs.length} de {AVAILABLE_TABS.length} abas selecionadas
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-background border border-input rounded-lg hover:bg-muted transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
