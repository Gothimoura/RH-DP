import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, User, Building2, Calendar, Package, 
  Smartphone, Laptop, Phone, Hash, Tag, MapPin, 
  CheckCircle, XCircle, MessageSquare, Send, Edit2,
  FileText, History, Clock, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import MainLayout from '@/components/shared/MainLayout'
import { colaboradoresService } from '@/services/colaboradores.service'
import { equipamentosService } from '@/services/equipamentos.service'
import { kanbanService } from '@/services/kanban.service'
import { kanbanCommentsService } from '@/services/kanban-comments.service'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import CreateColaboradorModal from '@/components/Colaboradores/CreateColaboradorModal'
import { supabase } from '@/lib/supabase'

export default function ColaboradorDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [colaborador, setColaborador] = useState(null)
  const [equipamentos, setEquipamentos] = useState({
    celulares: [],
    notebooks: [],
    linhas: []
  })
  const [cardsKanban, setCardsKanban] = useState([])
  const [etapas, setEtapas] = useState({})
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardComments, setCardComments] = useState({})
  const [newComment, setNewComment] = useState('')
  const [historicoGeral, setHistoricoGeral] = useState([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar colaborador
      const colaboradorData = await colaboradoresService.getById(id)
      if (!colaboradorData) {
        navigate('/funcionarios')
        return
      }
      setColaborador(colaboradorData)

      // Carregar equipamentos atribuídos
      await loadEquipamentos(colaboradorData.nome)

      // Carregar nomes das etapas primeiro (necessário para histórico)
      await loadEtapas()

      // Carregar cards do kanban
      await loadCardsKanban(id)

      // Carregar histórico geral (depois de etapas e cards)
      await loadHistoricoGeral(colaboradorData.nome, id)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      navigate('/funcionarios')
    } finally {
      setLoading(false)
    }
  }

  const loadEquipamentos = async (nomeColaborador) => {
    try {
      const [celulares, notebooks, linhas] = await Promise.all([
        equipamentosService.getCelulares({ usuario_atual: nomeColaborador }),
        equipamentosService.getNotebooks({ usuario_atual: nomeColaborador }),
        equipamentosService.getLinhas({ usuario_atual: nomeColaborador })
      ])

      setEquipamentos({
        celulares: celulares || [],
        notebooks: notebooks || [],
        linhas: linhas || []
      })
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    }
  }

  const loadCardsKanban = async (colaboradorId) => {
    try {
      // Buscar todos os cards (entrada e saída)
      const [cardsEntrada, cardsSaida] = await Promise.all([
        kanbanService.getCards('entrada'),
        kanbanService.getCards('saida')
      ])

      const allCards = [
        ...cardsEntrada.filter(c => String(c.colaborador_id) === String(colaboradorId)),
        ...cardsSaida.filter(c => String(c.colaborador_id) === String(colaboradorId))
      ]

      // Ordenar por data de criação (mais recente primeiro)
      allCards.sort((a, b) => {
        const dateA = new Date(a.criado_em || a.data_inicio || 0)
        const dateB = new Date(b.criado_em || b.data_inicio || 0)
        return dateB - dateA
      })

      setCardsKanban(allCards)

      // Carregar comentários para cada card
      for (const card of allCards) {
        await loadCardComments(card.id)
      }
    } catch (error) {
      console.error('Erro ao carregar cards do kanban:', error)
    }
  }

  const loadEtapas = async () => {
    try {
      const { data } = await supabase
        .from('rh_etapas')
        .select('id, nome, tipo')

      if (data) {
        const etapasMap = {}
        data.forEach(etapa => {
          etapasMap[etapa.id] = etapa.nome || etapa.id
        })
        setEtapas(etapasMap)
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error)
    }
  }

  const loadCardComments = async (cardId) => {
    try {
      const comments = await kanbanCommentsService.getComments(cardId)
      setCardComments(prev => ({
        ...prev,
        [cardId]: comments || []
      }))
    } catch (error) {
      // Ignorar erro se tabela não existir
      setCardComments(prev => ({
        ...prev,
        [cardId]: []
      }))
    }
  }

  const handleAddComment = async (cardId) => {
    if (!newComment.trim() || !user?.id) return

    try {
      let userName = user?.email || 'Usuário'
      
      // Tentar buscar nome do usuário
      try {
        userName = await kanbanService.getUserName(user.id) || userName
      } catch (error) {
        // Usar email como fallback
      }

      await kanbanCommentsService.createComment(cardId, newComment.trim(), user.id, userName)
      
      // Limpar input e recarregar comentários
      setNewComment('')
      await loadCardComments(cardId)
    } catch (error) {
      alert('Erro ao adicionar comentário: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleEdit = async (updates) => {
    try {
      const updated = await colaboradoresService.update(id, updates)
      setColaborador(updated)
      setShowEditModal(false)
      alert('Funcionário atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error)
      alert('Erro ao atualizar funcionário')
    }
  }

  const getTipoProcesso = (card) => {
    // Verificar se o card está em uma etapa de entrada ou saída
    const etapaId = card.coluna
    const etapaNome = etapas[etapaId] || ''
    const tipoNormalizado = etapaNome.toLowerCase()
    
    if (tipoNormalizado.includes('desligado') || tipoNormalizado.includes('saída') || tipoNormalizado.includes('offboarding')) {
      return 'saida'
    }
    return 'entrada'
  }

  const loadHistoricoGeral = async (nomeColaborador, colaboradorId) => {
    setLoadingHistorico(true)
    try {
      const historicoItems = []

      // 1. Histórico de movimentações do kanban - buscar via cards do colaborador
      const { data: cardsColaborador } = await supabase
        .from('rh_kanban_cartoes')
        .select('id')
        .eq('colaborador_id', colaboradorId)

      if (cardsColaborador && cardsColaborador.length > 0) {
        const cardIds = cardsColaborador.map(c => c.id)
        const { data: historicoKanban } = await supabase
          .from('rh_kanban_historico')
          .select('*')
          .in('cartao_id', cardIds)
          .order('criado_em', { ascending: false })

        if (historicoKanban) {
          historicoKanban.forEach(item => {
            historicoItems.push({
              tipo: 'kanban_movimentacao',
              data: item.criado_em,
              titulo: 'Movimentação no Processo',
              descricao: `De "${item.de_coluna || 'Início'}" para "${item.para_coluna || 'Fim'}"`,
              usuario: item.movido_por || 'Sistema',
              icon: 'ArrowRight'
            })
          })
        }
      }

      // 2. Cards criados - buscar diretamente
      const { data: cardsCriados } = await supabase
        .from('rh_kanban_cartoes')
        .select('id, coluna, criado_em, data_inicio, tipo_processo')
        .eq('colaborador_id', colaboradorId)
        .order('criado_em', { ascending: false })

      // Buscar nomes das etapas para usar no histórico
      const { data: etapasData } = await supabase
        .from('rh_etapas')
        .select('id, nome')
      
      const etapasMap = {}
      if (etapasData) {
        etapasData.forEach(etapa => {
          etapasMap[etapa.id] = etapa.nome || etapa.id
        })
      }

      if (cardsCriados) {
        cardsCriados.forEach(card => {
          const tipoProcesso = card.tipo_processo || (card.coluna?.includes('entrada') ? 'entrada' : 'saida')
          historicoItems.push({
            tipo: 'card_criado',
            data: card.criado_em || card.data_inicio,
            titulo: 'Processo Criado',
            descricao: `${tipoProcesso === 'entrada' ? 'Onboarding' : 'Offboarding'} - ${etapasMap[card.coluna] || card.coluna || 'Etapa inicial'}`,
            usuario: 'Sistema',
            icon: 'FileText'
          })
        })
      }

      // 3. Comentários nos cards
      if (cardsCriados && cardsCriados.length > 0) {
        const cardIds = cardsCriados.map(c => c.id)
        const { data: comentarios } = await supabase
          .from('rh_kanban_comentarios')
          .select('*')
          .in('cartao_id', cardIds)
          .order('criado_em', { ascending: false })

        if (comentarios) {
          comentarios.forEach(comment => {
            historicoItems.push({
              tipo: 'comentario',
              data: comment.criado_em,
              titulo: 'Comentário Adicionado',
              descricao: comment.comentario,
              usuario: comment.usuario_nome || 'Usuário',
              icon: 'MessageSquare'
            })
          })
        }
      }

      // Ordenar por data (mais recente primeiro)
      historicoItems.sort((a, b) => {
        const dateA = new Date(a.data || 0)
        const dateB = new Date(b.data || 0)
        return dateB - dateA
      })

      setHistoricoGeral(historicoItems)
    } catch (error) {
      console.error('Erro ao carregar histórico geral:', error)
      setHistoricoGeral([])
    } finally {
      setLoadingHistorico(false)
    }
  }

  const formatarTelefone = (telefone) => {
    if (!telefone) return null
    // Remove caracteres não numéricos
    const apenasNumeros = telefone.replace(/\D/g, '')
    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (apenasNumeros.length === 11) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`
    } else if (apenasNumeros.length === 10) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`
    }
    return telefone
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando informações do funcionário...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!colaborador) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Funcionário não encontrado</p>
          <button
            onClick={() => navigate('/funcionarios')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Voltar para Funcionários
          </button>
        </div>
      </MainLayout>
    )
  }

  const totalEquipamentos = equipamentos.celulares.length + equipamentos.notebooks.length + equipamentos.linhas.length
  const cardAtual = cardsKanban.length > 0 ? cardsKanban[0] : null

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/funcionarios')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {colaborador.foto_url ? (
              <img
                src={colaborador.foto_url}
                alt={colaborador.nome}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {colaborador.nome || 'Sem nome'}
              </h1>
              <p className="text-muted-foreground">
                {colaborador.cargo || 'Sem cargo'} {colaborador.departamento && `• ${colaborador.departamento}`}
              </p>
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Data de Entrada</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {colaborador.data_entrada 
                ? new Date(colaborador.data_entrada).toLocaleDateString('pt-BR')
                : 'Não informado'}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Equipamentos</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{totalEquipamentos}</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Processos</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{cardsKanban.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Pessoais */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Nome Completo</label>
                  <p className="text-sm font-medium text-foreground">{colaborador.nome || '-'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Matrícula</label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    {colaborador.matricula || '-'}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Cargo</label>
                  <p className="text-sm font-medium text-foreground">{colaborador.cargo || '-'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Departamento</label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {colaborador.departamento || '-'}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Telefone Corporativo</label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {colaborador.telefone ? formatarTelefone(colaborador.telefone) : '-'}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Telefone Pessoal</label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {colaborador.telefone_pessoal ? formatarTelefone(colaborador.telefone_pessoal) : '-'}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Data de Entrada</label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {colaborador.data_entrada 
                      ? new Date(colaborador.data_entrada).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
                {colaborador.email && (
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">E-mail</label>
                    <p className="text-sm font-medium text-foreground">{colaborador.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Equipamentos Atribuídos */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Equipamentos Atribuídos ({totalEquipamentos})
              </h3>

              {/* Notebooks */}
              {equipamentos.notebooks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Laptop className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Notebooks ({equipamentos.notebooks.length})</span>
                  </div>
                  <div className="space-y-2">
                    {equipamentos.notebooks.map((notebook) => (
                      <div 
                        key={notebook['Row ID']} 
                        className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigate(`/equipamentos/notebook/${encodeURIComponent(notebook['Row ID'])}?returnUrl=${encodeURIComponent(`/funcionarios/${id}`)}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {notebook.Marca} {notebook.Modelo}
                            </p>
                            {notebook['Nº Matricula'] && (
                              <p className="text-xs text-muted-foreground">Patrimônio: {notebook['Nº Matricula']}</p>
                            )}
                          </div>
                          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Celulares */}
              {equipamentos.celulares.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Celulares ({equipamentos.celulares.length})</span>
                  </div>
                  <div className="space-y-2">
                    {equipamentos.celulares.map((celular) => (
                      <div 
                        key={celular['Row ID']} 
                        className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigate(`/equipamentos/celular/${encodeURIComponent(celular['Row ID'])}?returnUrl=${encodeURIComponent(`/funcionarios/${id}`)}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {celular.CELULAR || celular.Modelo || 'Celular'}
                            </p>
                            {celular.IMEI && (
                              <p className="text-xs text-muted-foreground">IMEI: {celular.IMEI}</p>
                            )}
                          </div>
                          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linhas */}
              {equipamentos.linhas.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Linhas/Chips ({equipamentos.linhas.length})</span>
                  </div>
                  <div className="space-y-2">
                    {equipamentos.linhas.map((linha) => (
                      <div 
                        key={linha['Row ID']} 
                        className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigate(`/equipamentos/linha/${encodeURIComponent(linha['Row ID'])}?returnUrl=${encodeURIComponent(`/funcionarios/${id}`)}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {linha.NTC || linha.Número || 'Linha'}
                            </p>
                            {linha.Empresa && (
                              <p className="text-xs text-muted-foreground">Empresa: {linha.Empresa}</p>
                            )}
                          </div>
                          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalEquipamentos === 0 && (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum equipamento atribuído</p>
                </div>
              )}
            </div>

            {/* Histórico Geral */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico Geral
              </h3>

              {loadingHistorico ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando histórico...</p>
                </div>
              ) : historicoGeral.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum registro no histórico</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historicoGeral.map((item, index) => {
                    const IconComponent = {
                      'ArrowRight': ArrowLeft,
                      'FileText': FileText,
                      'MessageSquare': MessageSquare
                    }[item.icon] || Clock

                    return (
                      <div
                        key={index}
                        className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{item.titulo}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.data 
                                ? new Date(item.data).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mb-1">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            Por: {item.usuario}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Jornada Completa - Todos os Cards */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Jornada Completa ({cardsKanban.length} processo{cardsKanban.length !== 1 ? 's' : ''})
              </h3>

              {cardsKanban.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum processo iniciado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cardsKanban.map((card, index) => {
                    const tipoProcesso = getTipoProcesso(card)
                    const etapaNome = etapas[card.coluna] || card.coluna || 'Etapa não definida'
                    const comments = cardComments[card.id] || []
                    const isExpanded = selectedCard === card.id

                    return (
                      <div 
                        key={card.id} 
                        className="border border-border rounded-lg overflow-hidden bg-muted/30"
                      >
                        {/* Header do Card */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => setSelectedCard(isExpanded ? null : card.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  tipoProcesso === 'entrada' 
                                    ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                                    : 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                }`}>
                                  {tipoProcesso === 'entrada' ? 'Onboarding' : 'Offboarding'}
                                </span>
                                <span className="text-sm font-medium text-foreground">{etapaNome}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {card.data_inicio && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Início: {formatDate(card.data_inicio)}
                                  </span>
                                )}
                                {card.data_prevista && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Previsto: {formatDate(card.data_prevista)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {card.responsavel && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  {card.responsavel.name || card.responsavel.email || 'Responsável'}
                                </div>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo Expandido */}
                        {isExpanded && (
                          <div className="border-t border-border bg-card p-4 space-y-4">
                            {/* Checklist */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-xs text-foreground">Notebook</span>
                                {card.tem_notebook ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-xs text-foreground">Celular</span>
                                {card.tem_celular ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-xs text-foreground">Acessos</span>
                                {card.tem_acessos ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {/* Observações */}
                            {card.observacoes && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Observações</label>
                                <p className="text-sm text-foreground bg-muted/50 p-2 rounded">{card.observacoes}</p>
                              </div>
                            )}

                            {/* Comentários */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">Comentários ({comments.length})</span>
                              </div>
                              
                              {/* Lista de Comentários */}
                              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                {comments.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário</p>
                                ) : (
                                  comments.map((comment) => (
                                    <div key={comment.id} className="bg-muted/50 rounded p-2">
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs font-medium text-foreground">
                                          {comment.usuario_nome || comment.usuario?.name || 'Usuário'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(comment.criado_em).toLocaleString('pt-BR')}
                                        </span>
                                      </div>
                                      <p className="text-xs text-foreground">{comment.comentario}</p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Adicionar Comentário */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleAddComment(card.id)
                                    }
                                  }}
                                  placeholder="Adicione um comentário..."
                                  className="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                />
                                <button
                                  onClick={() => handleAddComment(card.id)}
                                  disabled={!newComment.trim() || !user?.id}
                                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Resumo
              </h3>
              
              {/* Status Atual */}
              {cardAtual && (
                <div className="mb-4 p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30">
                  <label className="text-xs font-medium text-primary uppercase tracking-wide block mb-1">
                    Status Atual
                  </label>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {etapas[cardAtual.coluna] || cardAtual.coluna || 'Não definido'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTipoProcesso(cardAtual) === 'entrada' ? 'Onboarding' : 'Offboarding'}
                  </p>
                </div>
              )}

              {/* Estatísticas Rápidas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Equipamentos</span>
                  <span className="text-sm font-semibold text-foreground">{totalEquipamentos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processos</span>
                  <span className="text-sm font-semibold text-foreground">{cardsKanban.length}</span>
                </div>
                {colaborador.data_entrada && (() => {
                  const dataEntrada = new Date(colaborador.data_entrada)
                  const hoje = new Date()
                  
                  let anos = hoje.getFullYear() - dataEntrada.getFullYear()
                  let meses = hoje.getMonth() - dataEntrada.getMonth()
                  let dias = hoje.getDate() - dataEntrada.getDate()
                  
                  if (dias < 0) {
                    meses--
                    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate()
                    dias += ultimoDiaMesAnterior
                  }
                  
                  if (meses < 0) {
                    anos--
                    meses += 12
                  }
                  
                  const partes = []
                  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`)
                  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`)
                  if (dias > 0 || partes.length === 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`)
                  
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tempo na Empresa</span>
                      <span className="text-sm font-semibold text-foreground">
                        {partes.join(', ')}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && (
        <CreateColaboradorModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadData()
            setShowEditModal(false)
          }}
          editingColaborador={colaborador}
        />
      )}
    </MainLayout>
  )
}
