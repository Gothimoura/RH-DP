import { X, User, Mail, Shield, CheckSquare, Square, LayoutGrid } from 'lucide-react'
import { useState, useEffect } from 'react'
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

export default function EditUserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [accessMedicoes, setAccessMedicoes] = useState(true)
  const [accessDpRh, setAccessDpRh] = useState(false)
  const [allowedTabs, setAllowedTabs] = useState(AVAILABLE_TABS.map(t => t.id))

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setRole(user.role || 'user')
      setAccessMedicoes(user.access_medicoes !== undefined ? user.access_medicoes : true)
      setAccessDpRh(user.access_dp_rh !== undefined ? user.access_dp_rh : false)
      
      // Tratar allowed_tabs: pode ser null, undefined, ou array vazio
      if (user.allowed_tabs && Array.isArray(user.allowed_tabs) && user.allowed_tabs.length > 0) {
        setAllowedTabs(user.allowed_tabs)
      } else {
        // Se não tem allowed_tabs definido, permitir todas as abas por padrão
        setAllowedTabs(AVAILABLE_TABS.map(t => t.id))
      }
      
      console.log('Carregando dados do usuário:', {
        id: user.id,
        name: user.name,
        role: user.role,
        access_medicoes: user.access_medicoes,
        access_dp_rh: user.access_dp_rh,
        allowed_tabs: user.allowed_tabs
      })
    }
  }, [isOpen, user])

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
    
    if (!name || !email) {
      alert('Nome e email são obrigatórios')
      return
    }

    if (!user || !user.id) {
      alert('Erro: ID do usuário não encontrado')
      return
    }

    setLoading(true)
    try {
      // Preparar dados para atualização
      const updateData = {
        name: name.trim(),
        email: email.trim(),
        role: role || 'user',
        access_medicoes: accessMedicoes !== undefined ? accessMedicoes : true,
        access_dp_rh: accessDpRh !== undefined ? accessDpRh : false,
        allowed_tabs: allowedTabs && allowedTabs.length > 0 ? allowedTabs : AVAILABLE_TABS.map(t => t.id),
      }

      console.log('Atualizando usuário:', user.id, 'com dados:', updateData)

      // Usar o usersService para garantir consistência
      const updatedUser = await usersService.update(user.id, updateData)

      console.log('Resposta do update:', updatedUser)

      // Verificar se a atualização realmente aconteceu
      if (!updatedUser) {
        throw new Error('A atualização não retornou dados')
      }

      // Verificar se os valores foram realmente atualizados
      const verification = await usersService.getById(user.id)
      console.log('Verificação pós-update:', verification)

      if (verification.role !== updateData.role) {
        console.warn('Aviso: O role não foi atualizado corretamente')
      }

      alert('Usuário atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      console.error('Detalhes do erro:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        user: user
      })
      
      let errorMessage = 'Erro ao atualizar usuário'
      if (error?.message) {
        errorMessage += ': ' + error.message
      } else if (error?.code) {
        errorMessage += ' (Código: ' + error.code + ')'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

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
              <h2 className="text-xl font-bold text-foreground">Editar Usuário</h2>
              <p className="text-sm text-muted-foreground">Atualize as informações do usuário</p>
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
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

