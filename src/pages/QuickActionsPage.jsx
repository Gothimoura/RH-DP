import { useState, useRef, useEffect } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import { supabase } from '@/lib/supabase'
import { Stethoscope, Laptop, Lock, Car, Zap, AlertTriangle, Search, ChevronDown, Upload, X, FileText, ExternalLink, User, Calendar, Paperclip } from 'lucide-react'
import { useColaboradores } from '@/hooks/useColaboradores'

const quickActions = [
  {
    type: 'atestado',
    icon: Stethoscope,
    label: 'Atestado Médico',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    type: 'equipamento_quebrado',
    icon: Laptop,
    label: 'Equipamento Quebrou',
    color: 'bg-red-500 hover:bg-red-600',
  },
  {
    type: 'bloquear_acesso',
    icon: Lock,
    label: 'Bloquear Acesso',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    type: 'falta_justificada',
    icon: Car,
    label: 'Falta Justificada',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    type: 'advertencia',
    icon: AlertTriangle,
    label: 'Advertência',
    color: 'bg-yellow-500 hover:bg-yellow-600',
  },
]

export default function QuickActionsPage() {
  const { colaboradores: employees, loading } = useColaboradores()
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [observations, setObservations] = useState('')
  const [saving, setSaving] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [acoesComAnexos, setAcoesComAnexos] = useState([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)
  const fileInputRef = useRef(null)
  const employeeInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Função para obter a cor do tipo de ação
  const getActionColor = (tipo) => {
    const action = quickActions.find(a => a.type === tipo)
    if (!action) return 'bg-gray-500'
    
    // Extrair a cor base (sem hover)
    const colorClass = action.color.split(' ')[0]
    return colorClass
  }

  // Função para obter o componente do ícone do tipo de ação
  const getActionIcon = (tipo) => {
    const action = quickActions.find(a => a.type === tipo)
    if (!action || !action.icon) return null
    const IconComponent = action.icon
    return <IconComponent className="w-4 h-4" />
  }

  // Filtrar funcionários baseado na busca
  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearch) return true
    const searchLower = employeeSearch.toLowerCase()
    return (
      emp.nome?.toLowerCase().includes(searchLower) ||
      emp.cargo?.toLowerCase().includes(searchLower) ||
      emp.departamento?.toLowerCase().includes(searchLower)
    )
  })

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        employeeInputRef.current &&
        !employeeInputRef.current.contains(event.target)
      ) {
        setShowEmployeeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Carregar todas as ações rápidas
  const loadAcoesComAnexos = async () => {
    setLoadingAnexos(true)
    try {
      // Buscar todas as ações rápidas
      const { data: acoes, error } = await supabase
        .from('rh_acoes_rapidas')
        .select(`
          *,
          rh_colaboradores (
            id,
            nome,
            cargo
          )
        `)
        .order('criado_em', { ascending: false })
        .limit(100)

      if (error) throw error

      if (!acoes || acoes.length === 0) {
        setAcoesComAnexos([])
        return
      }

      // Buscar nomes dos usuários que anexaram
      const userIds = [...new Set(acoes.map(a => a.executado_por).filter(Boolean))]
      const usuariosMap = {}

      if (userIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)

        if (usuarios) {
          usuarios.forEach(u => {
            usuariosMap[u.id] = u.name || 'Usuário desconhecido'
          })
        }
      }

      // Processar ações e adicionar informações
      const acoesProcessadas = acoes.map(acao => {
        const anexos = acao.dados?.anexos || []
        return {
          ...acao,
          anexos: Array.isArray(anexos) ? anexos : [],
          funcionarioNome: acao.rh_colaboradores?.nome || 'Funcionário não encontrado',
          funcionarioCargo: acao.rh_colaboradores?.cargo || '',
          anexadoPor: usuariosMap[acao.executado_por] || 'Usuário desconhecido',
          dataAnexo: acao.criado_em
        }
      })

      setAcoesComAnexos(acoesProcessadas)
    } catch (error) {
      console.error('Erro ao carregar ações com anexos:', error)
    } finally {
      setLoadingAnexos(false)
    }
  }

  // Carregar ações com anexos ao montar componente
  useEffect(() => {
    loadAcoesComAnexos()
  }, [])

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadingFiles(true)
    const uploadedFiles = []

    try {
      for (const file of files) {
        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`O arquivo ${file.name} excede o tamanho máximo de 10MB`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `acoes-rapidas-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload para storage
        const { error: uploadError } = await supabase.storage
          .from('documentos-acoes-rapidas')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error('Bucket de armazenamento não configurado. Verifique as instruções de configuração.')
          }
          throw uploadError
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('documentos-acoes-rapidas')
          .getPublicUrl(fileName)

        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          fileName: fileName,
          size: file.size,
          type: file.type
        })
      }

      setAttachedFiles([...attachedFiles, ...uploadedFiles])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error)
      alert('Erro ao fazer upload dos arquivos: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeFile = async (fileToRemove) => {
    try {
      // Remover do storage
      const { error } = await supabase.storage
        .from('documentos-acoes-rapidas')
        .remove([fileToRemove.fileName])

      if (error && !error.message.includes('not found')) {
        console.error('Erro ao remover arquivo:', error)
      }

      // Remover da lista
      setAttachedFiles(attachedFiles.filter(f => f.fileName !== fileToRemove.fileName))
    } catch (error) {
      console.error('Erro ao remover arquivo:', error)
      // Mesmo com erro, remover da lista local
      setAttachedFiles(attachedFiles.filter(f => f.fileName !== fileToRemove.fileName))
    }
  }

  const handleAction = async () => {
    if (!selectedEmployee || !selectedAction) {
      alert('Selecione um funcionário e uma ação')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const dados = {
        timestamp: new Date().toISOString(),
      }

      // Adicionar URLs dos anexos se houver
      if (attachedFiles.length > 0) {
        dados.anexos = attachedFiles.map(f => ({
          nome: f.name,
          url: f.url,
          fileName: f.fileName,
          tamanho: f.size,
          tipo: f.type
        }))
      }

      const { error } = await supabase.from('rh_acoes_rapidas').insert({
        tipo: selectedAction,
        colaborador_id: selectedEmployee,
        observacoes: observations,
        dados: dados,
        executado_por: user?.id,
        status: 'executado',
      })

      if (error) throw error

      alert('Ação registrada com sucesso!')
      
      // Limpar formulário
      setSelectedEmployee('')
      setSelectedAction('')
      setObservations('')
      setEmployeeSearch('')
      setAttachedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Recarregar lista de anexos
      await loadAcoesComAnexos()
    } catch (error) {
      console.error('Erro ao registrar ação:', error)
      alert('Erro ao registrar ação: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-warning" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Ações Rápidas
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Registre ações rápidas do dia a dia</p>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">
            O que aconteceu?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <button
                  key={action.type}
                  onClick={() => setSelectedAction(action.type)}
                  className={`${action.color} ${
                    selectedAction === action.type ? 'ring-4 ring-offset-2 ring-gray-300' : ''
                  } text-white p-4 md:p-6 rounded-lg flex flex-col items-center justify-center gap-2 md:gap-3 transition-all`}
                >
                  <div className="w-5 h-5 md:w-6 md:h-6">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <span className="font-medium text-xs md:text-sm text-center">{action.label}</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selecione o funcionário:
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={employeeInputRef}
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value)
                      setShowEmployeeDropdown(true)
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="Buscar funcionário por nome, cargo ou departamento..."
                    className="w-full pl-10 pr-10 py-2 text-sm md:text-base bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                
                {showEmployeeDropdown && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto"
                  >
                    {filteredEmployees.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        Nenhum funcionário encontrado
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(emp.id)
                            setEmployeeSearch(`${emp.nome}${emp.cargo ? ` - ${emp.cargo}` : ''}`)
                            setShowEmployeeDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                            selectedEmployee === emp.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                          }`}
                        >
                          <div className="font-medium">{emp.nome}</div>
                          {emp.cargo && (
                            <div className="text-xs text-muted-foreground">{emp.cargo}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedEmployee && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Selecionado: {employees.find(e => e.id === selectedEmployee)?.nome}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Observações:
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Descreva os detalhes da ação..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Anexar Documentos (opcional):
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-background border border-input rounded-lg hover:bg-muted cursor-pointer transition-colors text-sm md:text-base"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingFiles ? 'Enviando...' : 'Selecionar Arquivos'}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Máximo 10MB por arquivo
                  </span>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file)}
                          className="p-1 hover:bg-background rounded transition-colors shrink-0"
                          disabled={uploadingFiles}
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAction}
              disabled={saving || uploadingFiles || !selectedEmployee || !selectedAction}
              className="w-full bg-primary text-white py-2 md:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {saving ? 'Registrando...' : 'Registrar Ação'}
            </button>
          </div>
        </div>

        {/* Seção de Documentos Anexados */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Paperclip className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground">
                Histórico de Ações Rápidas
              </h2>
            </div>
            <button
              onClick={loadAcoesComAnexos}
              disabled={loadingAnexos}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {loadingAnexos ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {loadingAnexos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando documentos...</p>
            </div>
          ) : acoesComAnexos.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Nenhuma ação rápida registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acoesComAnexos.map((acao) => (
                <div
                  key={acao.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {acao.funcionarioNome}
                        </span>
                        {acao.funcionarioCargo && (
                          <span className="text-sm text-muted-foreground">
                            - {acao.funcionarioCargo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Anexado por: {acao.anexadoPor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(acao.dataAnexo).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`${getActionColor(acao.tipo)} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 shrink-0`}>
                      {getActionIcon(acao.tipo)}
                      <span>{quickActions.find(a => a.type === acao.tipo)?.label || acao.tipo}</span>
                    </div>
                  </div>

                  {acao.observacoes && (
                    <div className="mb-3 p-2 bg-muted/50 rounded text-sm text-foreground">
                      {acao.observacoes}
                    </div>
                  )}

                  {acao.anexos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        <span>Documentos Anexados ({acao.anexos.length}):</span>
                      </div>
                      {acao.anexos.map((anexo, idx) => (
                        <a
                          key={idx}
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-background border border-border rounded hover:bg-muted transition-colors group"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          <span className="flex-1 text-sm text-foreground truncate">
                            {anexo.nome}
                          </span>
                          {anexo.tamanho && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {(anexo.tamanho / 1024).toFixed(2)} KB
                            </span>
                          )}
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

