import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, User, Building2, Calendar, FileText, History, Package, 
  Smartphone, Laptop, Phone, Hash, Tag, MapPin, Shield, 
  ArrowRightLeft, Trash2, Save, X, Edit2, Undo2
} from 'lucide-react'
import MainLayout from '@/components/shared/MainLayout'
import { equipamentosService } from '@/services/equipamentos.service'
import { useAuth } from '@/hooks/useAuth'
import TransferEquipmentModal from '@/components/Equipamentos/TransferEquipmentModal'
import DiscardEquipmentModal from '@/components/Equipamentos/DiscardEquipmentModal'
import ReleaseEquipmentModal from '@/components/Equipamentos/ReleaseEquipmentModal'
import AddCommentModal from '@/components/Equipamentos/AddCommentModal'

// Normalizar status do banco para formato de exibição
const normalizeStatus = (status) => {
  if (!status) return 'Disponível'
  const statusLower = status.toLowerCase().trim()
  const statusMap = {
    'disponivel': 'Disponível',
    'disponível': 'Disponível',
    'em_uso': 'Em uso',
    'em uso': 'Em uso',
    'manutencao': 'Manutenção',
    'manutenção': 'Manutenção',
    'indisponivel': 'Indisponível',
    'indisponível': 'Indisponível',
    'descarte': 'Descarte',
  }
  return statusMap[statusLower] || status
}

// Função para formatar observações em lista se seguirem padrão
const formatObservacoes = (obs) => {
  if (!obs) return null
  
  const lines = obs.split(/[\n;]/).map(line => line.trim()).filter(Boolean)
  
  if (lines.length > 1) {
    return lines
  }
  
  const items = obs.split(',').map(item => item.trim()).filter(Boolean)
  if (items.length > 1 && items.every(item => item.length < 50)) {
    return items
  }
  
  return [obs]
}

// Ícones por tipo
const typeIcons = {
  celular: Smartphone,
  notebook: Laptop,
  linha: Phone,
}

export default function EquipmentDetailsPage() {
  const { type, id: rawId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [equipment, setEquipment] = useState(null)
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false) // Modo de edição global
  const [pendingChanges, setPendingChanges] = useState({}) // Alterações pendentes: { fieldName: newValue }
  const [saving, setSaving] = useState(false) // Salvando alterações
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showAddCommentModal, setShowAddCommentModal] = useState(false)

  // Decodificar o ID da URL
  const id = rawId ? decodeURIComponent(rawId) : null
  
  // Parâmetros de retorno para manter filtros e aba
  const returnTo = searchParams.get('returnTo')
  const returnUrl = searchParams.get('returnUrl') // URL direta de retorno (ex: colaborador)

  const TypeIcon = typeIcons[type] || Smartphone
  
  // Função para voltar mantendo filtros
  const handleGoBack = () => {
    // Prioridade 1: URL direta de retorno (ex: voltar para página do colaborador)
    if (returnUrl) {
      navigate(decodeURIComponent(returnUrl))
    } 
    // Prioridade 2: Parâmetros de filtro da lista de equipamentos
    else if (returnTo) {
      navigate(`/equipamentos?${decodeURIComponent(returnTo)}`)
    } 
    // Fallback: voltar para a aba do tipo atual
    else {
      const tabMap = {
        'celular': 'celulares',
        'notebook': 'notebooks',
        'linha': 'linhas'
      }
      navigate(`/equipamentos?tab=${tabMap[type] || 'celulares'}`)
    }
  }

  useEffect(() => {
    if (id) {
      loadEquipment()
    }
  }, [type, id])

  const loadEquipment = async () => {
    setLoading(true)
    try {
      let data = null
      if (type === 'celular') {
        data = await equipamentosService.getCelularById(id)
      } else if (type === 'notebook') {
        data = await equipamentosService.getNotebookById(id)
      } else if (type === 'linha') {
        data = await equipamentosService.getLinhaById(id)
      }

      if (data) {
        setEquipment(data)
        await loadHistorico()
      } else {
        handleGoBack()
      }
    } catch (error) {
      console.error('Erro ao carregar equipamento:', error)
      handleGoBack()
    } finally {
      setLoading(false)
    }
  }

  const loadHistorico = async () => {
    try {
      let data = []
      if (type === 'celular') {
        data = await equipamentosService.getHistoricoCelular(id)
      } else if (type === 'notebook') {
        data = await equipamentosService.getHistoricoNotebook(id)
      } else if (type === 'linha') {
        data = await equipamentosService.getHistoricoLinha(id)
      }
      setHistorico(data)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const enterEditMode = () => {
    setIsEditMode(true)
    setPendingChanges({})
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    setPendingChanges({})
  }

  const updatePendingChange = (fieldName, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const saveAllChanges = async () => {
    if (!equipment || Object.keys(pendingChanges).length === 0) {
      setIsEditMode(false)
      return
    }

    try {
      setSaving(true)
      
      // Preparar updates
      const updates = {}
      const changes = []
      
      Object.entries(pendingChanges).forEach(([fieldName, newValue]) => {
        const oldValue = equipment[fieldName] || ''
        const trimmedValue = newValue?.trim() || null
        
        // Só adiciona se mudou
        if (oldValue !== trimmedValue) {
          updates[fieldName] = trimmedValue
          const fieldLabel = getFieldLabel(fieldName)
          changes.push(`${fieldLabel}: "${oldValue || '(vazio)'}" → "${trimmedValue || '(vazio)'}"`)
        }
      })

      if (Object.keys(updates).length === 0) {
        setIsEditMode(false)
        setPendingChanges({})
        return
      }

      // Salvar no banco
      let updated = null
      if (type === 'celular') {
        updated = await equipamentosService.updateCelular(id, updates, user?.id)
      } else if (type === 'notebook') {
        updated = await equipamentosService.updateNotebook(id, updates, user?.id)
      } else if (type === 'linha') {
        updated = await equipamentosService.updateLinha(id, updates, user?.id)
      }

      if (updated) {
        setEquipment(updated)
        
        // Registrar todas as mudanças no histórico
        if (changes.length > 0) {
          const comentario = changes.join('\n')
          
          if (type === 'celular') {
            await equipamentosService.addComentarioCelular(id, comentario, user?.id)
          } else if (type === 'notebook') {
            await equipamentosService.addComentarioNotebook(id, comentario, user?.id)
          } else if (type === 'linha') {
            await equipamentosService.addComentarioLinha(id, comentario, user?.id)
          }
        }
        
        await loadHistorico()
        setIsEditMode(false)
        setPendingChanges({})
        alert('Alterações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar alterações:', error)
      alert('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const getFieldLabel = (fieldName) => {
    const labels = {
      'Modelo': 'Modelo',
      'IMEI': 'IMEI',
      'NºCHIP': 'Nº Chip',
      'Nº Matricula': 'Matrícula',
      'Marca': 'Marca',
      'Motivo': 'Motivo',
      'Empresa': 'Empresa',
      'Cód Emp': 'Código Empresa',
      'Local': 'Local',
      'OBS': 'Observações',
      'ACESSORIOS': 'Acessórios',
      'CELULAR': 'Celular',
      'NTC': 'NTC'
    }
    return labels[fieldName] || fieldName
  }

  // Componente de campo editável inline
  const EditableField = ({ fieldName, label, value, isMonospace = false, isTextarea = false, rows = 3 }) => {
    const currentValue = pendingChanges.hasOwnProperty(fieldName) 
      ? pendingChanges[fieldName] 
      : (value || '')
    const displayValue = value || '-'
    const hasChanges = pendingChanges.hasOwnProperty(fieldName) && pendingChanges[fieldName] !== (value || '')

    if (isEditMode) {
      return (
        <div className="space-y-1">
          {isTextarea ? (
            <textarea
              value={currentValue}
              onChange={(e) => updatePendingChange(fieldName, e.target.value)}
              rows={rows}
              className={`w-full px-3 py-2 bg-background border-2 ${
                hasChanges ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-foreground resize-y ${
                isMonospace ? 'font-mono text-sm' : ''
              }`}
            />
          ) : (
            <input
              type="text"
              value={currentValue}
              onChange={(e) => updatePendingChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 bg-background border-2 ${
                hasChanges ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-foreground ${
                isMonospace ? 'font-mono text-sm' : ''
              }`}
            />
          )}
          {hasChanges && (
            <p className="text-xs text-primary font-medium">Alterado</p>
          )}
        </div>
      )
    }

    return (
      <div className="group relative">
        <div className="flex items-start gap-2">
          {isTextarea ? (
            <p className={`text-sm text-foreground flex-1 whitespace-pre-wrap ${
              displayValue === '-' ? 'text-muted-foreground italic' : ''
            }`}>
              {displayValue}
            </p>
          ) : (
            <p className={`text-sm font-medium text-foreground flex-1 ${
              isMonospace ? 'font-mono' : ''
            } ${
              displayValue === '-' ? 'text-muted-foreground italic' : ''
            }`}>
              {displayValue}
            </p>
          )}
        </div>
      </div>
    )
  }

  const handleTransfer = async (colaboradorId) => {
    try {
      if (type === 'celular') {
        await equipamentosService.transferCelular(id, colaboradorId, user?.id)
      } else if (type === 'notebook') {
        await equipamentosService.transferNotebook(id, colaboradorId, user?.id)
      } else if (type === 'linha') {
        await equipamentosService.transferLinha(id, colaboradorId, user?.id)
      }

      await loadEquipment()
      setShowTransferModal(false)
      alert('Equipamento transferido com sucesso!')
    } catch (error) {
      console.error('Erro ao transferir equipamento:', error)
      alert('Erro ao transferir equipamento')
    }
  }

  const handleRelease = async (equipment, motivo) => {
    try {
      if (type === 'celular') {
        await equipamentosService.releaseCelular(id, motivo, user?.id)
      } else if (type === 'notebook') {
        await equipamentosService.releaseNotebook(id, motivo, user?.id)
      } else if (type === 'linha') {
        await equipamentosService.releaseLinha(id, motivo, user?.id)
      }

      await loadEquipment()
      setShowReleaseModal(false)
      alert('Equipamento devolvido com sucesso!')
    } catch (error) {
      console.error('Erro ao devolver equipamento:', error)
      alert('Erro ao devolver equipamento')
    }
  }

  const handleDiscard = async (motivo) => {
    try {
      if (type === 'celular') {
        await equipamentosService.discardCelular(id, motivo, user?.id)
      } else if (type === 'notebook') {
        await equipamentosService.discardNotebook(id, motivo, user?.id)
      } else if (type === 'linha') {
        await equipamentosService.discardLinha(id, motivo, user?.id)
      }

      await loadEquipment()
      setShowDiscardModal(false)
      alert('Equipamento marcado como descarte com sucesso!')
    } catch (error) {
      console.error('Erro ao marcar como descarte:', error)
      alert('Erro ao marcar como descarte')
    }
  }

  const handleAddComment = async (comentario) => {
    try {
      if (type === 'celular') {
        await equipamentosService.addComentarioCelular(id, comentario, user?.id)
      } else if (type === 'notebook') {
        await equipamentosService.addComentarioNotebook(id, comentario, user?.id)
      } else if (type === 'linha') {
        await equipamentosService.addComentarioLinha(id, comentario, user?.id)
      }

      await loadHistorico()
      alert('Comentário adicionado ao histórico com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      alert('Erro ao adicionar comentário')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando equipamento...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!equipment) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Equipamento não encontrado</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Voltar para Equipamentos
          </button>
        </div>
      </MainLayout>
    )
  }

  const observacoesFormatadas = formatObservacoes(equipment.OBS)
  const acessoriosFormatados = formatObservacoes(equipment.ACESSORIOS)
  const isDiscarded = normalizeStatus(equipment.Status) === 'Descarte'

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 bg-primary/20 rounded-lg">
              <TypeIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {type === 'celular' && (equipment.CELULAR || 'Celular')}
                {type === 'notebook' && `${equipment.Marca || ''} ${equipment.Modelo || 'Notebook'}`.trim()}
                {type === 'linha' && (equipment.NTC || 'Linha')}
              </h1>
              <p className="text-muted-foreground">
                {type === 'celular' && 'Celular'}
                {type === 'notebook' && 'Notebook'}
                {type === 'linha' && 'Linha/Chip'}
              </p>
            </div>
          </div>
          
          {/* Ações */}
          {!isDiscarded && (
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <button
                    onClick={saveAllChanges}
                    disabled={saving || Object.keys(pendingChanges).length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    onClick={cancelEditMode}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={enterEditMode}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  {equipment['Usuário atual'] && (
                    <>
                      <button
                        onClick={() => setShowReleaseModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold"
                      >
                        <Undo2 className="w-4 h-4" />
                        Devolver
                      </button>
                      <button
                        onClick={() => setShowTransferModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transferir
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDiscardModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Marcar Descarte
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            normalizeStatus(equipment.Status) === 'Em uso' ? 'bg-success/20 text-success border border-success/30' :
            normalizeStatus(equipment.Status) === 'Disponível' ? 'bg-primary/20 text-primary border border-primary/30' :
            normalizeStatus(equipment.Status) === 'Manutenção' ? 'bg-warning/20 text-warning border border-warning/30' :
            normalizeStatus(equipment.Status) === 'Descarte' ? 'bg-destructive/20 text-destructive border border-destructive/30' :
            'bg-muted text-foreground border border-border'
          }`}>
            {normalizeStatus(equipment.Status)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Técnicas */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Informações Técnicas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {type === 'celular' && (
                  <>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
                      <EditableField 
                        fieldName="Modelo" 
                        label="Modelo" 
                        value={equipment.Modelo} 
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">IMEI</label>
                      <EditableField 
                        fieldName="IMEI" 
                        label="IMEI" 
                        value={equipment.IMEI} 
                        isMonospace={true}
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Nº Chip</label>
                      <EditableField 
                        fieldName="NºCHIP" 
                        label="Nº Chip" 
                        value={equipment['NºCHIP']} 
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Matrícula</label>
                      <EditableField 
                        fieldName="Nº Matricula" 
                        label="Matrícula" 
                        value={equipment['Nº Matricula']} 
                      />
                    </div>
                  </>
                )}

                {type === 'notebook' && (
                  <>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Marca</label>
                      <EditableField 
                        fieldName="Marca" 
                        label="Marca" 
                        value={equipment.Marca} 
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
                      <EditableField 
                        fieldName="Modelo" 
                        label="Modelo" 
                        value={equipment.Modelo} 
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Patrimônio</label>
                      <EditableField 
                        fieldName="Nº Matricula" 
                        label="Patrimônio" 
                        value={equipment['Nº Matricula']} 
                        isMonospace={true}
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Motivo</label>
                      <EditableField 
                        fieldName="Motivo" 
                        label="Motivo" 
                        value={equipment.Motivo} 
                      />
                    </div>
                  </>
                )}

                {type === 'linha' && (
                  <>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Empresa</label>
                      <EditableField 
                        fieldName="Empresa" 
                        label="Empresa" 
                        value={equipment.Empresa} 
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="text-xs text-muted-foreground block mb-1">Código Empresa</label>
                      <EditableField 
                        fieldName="Cód Emp" 
                        label="Código Empresa" 
                        value={equipment['Cód Emp']} 
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1">Local</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <EditableField 
                          fieldName="Local" 
                          label="Local" 
                          value={equipment.Local} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Usuário Atual */}
            {equipment['Usuário atual'] && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Usuário Atual</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-xl">
                      {equipment['Usuário atual']?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-lg">{equipment['Usuário atual']}</p>
                    {(equipment.Departamento || equipment.DPTO || equipment['Centro de custo']) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4" />
                        {equipment.Departamento || equipment.DPTO || equipment['Centro de custo']}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Último Usuário */}
            {(equipment['Último usuário'] || equipment['Útimo usuário']) && !equipment['Usuário atual'] && (
              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Último Usuário</h3>
                </div>
                <p className="text-foreground">{equipment['Último usuário'] || equipment['Útimo usuário']}</p>
              </div>
            )}

            {/* Acessórios (para celulares) */}
            {type === 'celular' && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-success" />
                  <h3 className="text-lg font-semibold text-foreground">Acessórios Inclusos</h3>
                </div>
                {!isEditMode && acessoriosFormatados && acessoriosFormatados.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {acessoriosFormatados.map((item, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium border border-success/30"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {isEditMode && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-success/30">
                    <EditableField 
                      fieldName="ACESSORIOS" 
                      label="Acessórios" 
                      value={equipment.ACESSORIOS} 
                      isTextarea={true}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-warning" />
                <h3 className="text-lg font-semibold text-foreground">Observações</h3>
              </div>
              {!isEditMode && observacoesFormatadas && observacoesFormatadas.length > 0 && (
                <div>
                  {observacoesFormatadas.length === 1 ? (
                    <p className="text-foreground">{observacoesFormatadas[0]}</p>
                  ) : (
                    <ul className="space-y-2">
                      {observacoesFormatadas.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-foreground">
                          <Tag className="w-4 h-4 mt-1 shrink-0 text-warning" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {isEditMode && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-warning/30">
                  <EditableField 
                    fieldName="OBS" 
                    label="Observações" 
                    value={equipment.OBS} 
                    isTextarea={true}
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral - Histórico */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Histórico</h3>
                </div>
                <button
                  onClick={() => setShowAddCommentModal(true)}
                  className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  + Comentário
                </button>
              </div>
              
              {historico.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-4">Nenhum registro no histórico</p>
                  <button
                    onClick={() => setShowAddCommentModal(true)}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Adicionar Primeiro Comentário
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {historico.map((item, index) => (
                    <div
                      key={index}
                      className="bg-muted/50 border border-border rounded-lg p-4"
                    >
                      <div className="flex flex-col gap-1 mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.usuario || 'Sistema'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.data_hora 
                            ? new Date(item.data_hora).toLocaleString('pt-BR')
                            : '-'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{item.comentario || '-'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showReleaseModal && (
          <ReleaseEquipmentModal
            equipment={equipment}
            type={type}
            isOpen={showReleaseModal}
            onClose={() => setShowReleaseModal(false)}
            onRelease={handleRelease}
          />
        )}

        {showTransferModal && (
          <TransferEquipmentModal
            equipment={equipment}
            type={type}
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            onTransfer={handleTransfer}
          />
        )}

        {showDiscardModal && (
          <DiscardEquipmentModal
            equipment={equipment}
            type={type}
            isOpen={showDiscardModal}
            onClose={() => setShowDiscardModal(false)}
            onDiscard={handleDiscard}
          />
        )}

        {showAddCommentModal && (
          <AddCommentModal
            equipment={equipment}
            type={type}
            isOpen={showAddCommentModal}
            onClose={() => setShowAddCommentModal(false)}
            onAddComment={handleAddComment}
          />
        )}
      </div>
    </MainLayout>
  )
}

