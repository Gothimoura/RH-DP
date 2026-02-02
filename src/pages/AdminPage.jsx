import { useState, useEffect } from 'react'
import { Settings, FileText, Edit, Trash2, Plus, Eye, EyeOff, Search, Users, Shield, Mail, Calendar } from 'lucide-react'
import MainLayout from '@/components/shared/MainLayout'
import { supabase } from '@/lib/supabase'
import CreateTemplateModal from '@/components/Documents/CreateTemplateModal'
import EditUserModal from '@/components/Admin/EditUserModal'
import CreateUserModal from '@/components/Admin/CreateUserModal'
import { usersService } from '@/services/users.service'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates()
    } else if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('rh_documentos_templates')
        .select('*')
        .order('criado_em', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      alert('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (template) => {
    try {
      const { error } = await supabase
        .from('rh_documentos_templates')
        .update({ ativo: !template.ativo })
        .eq('id', template.id)

      if (error) throw error
      await loadTemplates()
      alert(`Template ${!template.ativo ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status do template:', error)
      alert('Erro ao alterar status do template')
    }
  }

  const handleDelete = async (template) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o template "${template.nome}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('rh_documentos_templates')
        .delete()
        .eq('id', template.id)

      if (error) throw error
      await loadTemplates()
      alert('Template excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      alert('Erro ao excluir template')
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingTemplate(null)
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersService.getAll()
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      alert('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowEditUserModal(true)
  }

  const filteredTemplates = templates.filter(template =>
    template.nome?.toLowerCase().includes(search.toLowerCase()) ||
    template.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    template.conteudo?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.role?.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'rh':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'templates', label: 'Templates de Documentos', icon: FileText },
    { id: 'users', label: 'Gerenciar Usuários', icon: Users },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Painel Administrativo</h1>
                <p className="text-muted-foreground text-sm md:text-base">Gerencie configurações e templates do sistema</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="border-b border-border">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar templates..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingTemplate(null)
                      setShowCreateModal(true)
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Template
                  </button>
                </div>

                {/* Templates List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Carregando templates...</p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {search ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
                    </p>
                    {!search && (
                      <button
                        onClick={() => {
                          setEditingTemplate(null)
                          setShowCreateModal(true)
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar Primeiro Template
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-muted/30 border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{template.nome}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                template.ativo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {template.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Código:</span> <code className="bg-muted px-1 rounded">{template.codigo}</code>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Criado em:</span>{' '}
                                {new Date(template.criado_em).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="bg-card border border-border rounded p-3 max-h-32 overflow-y-auto">
                              <div 
                                className="text-xs text-muted-foreground prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: template.conteudo.length > 200 
                                    ? template.conteudo.substring(0, 200) + '...' 
                                    : template.conteudo 
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleEdit(template)}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(template)}
                              className={`p-2 rounded-lg transition-colors ${
                                template.ativo
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={template.ativo ? 'Desativar' : 'Ativar'}
                            >
                              {template.ativo ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(template)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar usuários..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                  </button>
                </div>

                {/* Users List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </p>
                    {!search && (
                      <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar Primeiro Usuário
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="divide-y divide-border">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              {user.photo ? (
                                <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <span className="text-primary font-bold text-lg">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 items-center">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{user.name || 'Sem nome'}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                  {user.role === 'admin' ? 'Administrador' : user.role === 'rh' ? 'RH' : 'Usuário'}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 mb-1">
                                  <Shield className="w-3 h-3" />
                                  <span className="font-medium">Permissões:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {user.access_medicoes && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                      Medições
                                    </span>
                                  )}
                                  {user.access_dp_rh && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                      DP/RH
                                    </span>
                                  )}
                                  {!user.access_medicoes && !user.access_dp_rh && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                                      Nenhuma
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Abas: {user.allowed_tabs?.length || 10}/{10}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateTemplateModal
            isOpen={showCreateModal}
            onClose={handleCloseModal}
            onSuccess={() => {
              loadTemplates()
              handleCloseModal()
            }}
            editingTemplate={editingTemplate}
          />
        )}

        {showEditUserModal && editingUser && (
          <EditUserModal
            user={editingUser}
            isOpen={showEditUserModal}
            onClose={() => {
              setShowEditUserModal(false)
              setEditingUser(null)
            }}
            onSuccess={() => {
              loadUsers()
            }}
          />
        )}

        {showCreateUserModal && (
          <CreateUserModal
            isOpen={showCreateUserModal}
            onClose={() => {
              setShowCreateUserModal(false)
            }}
            onSuccess={() => {
              loadUsers()
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}

