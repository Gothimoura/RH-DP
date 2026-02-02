import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, MessageSquare, Send, Trash2, User, Laptop, Smartphone, Phone, Package } from 'lucide-react'
import { kanbanService } from '@/services/kanban.service'
import { kanbanCommentsService } from '@/services/kanban-comments.service'
import { equipamentosService } from '@/services/equipamentos.service'
import { notificationsService } from '@/services/notifications.service'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import AssignEquipmentModal from './AssignEquipmentModal'
import AssignUserModal from './AssignUserModal'

export default function EmployeeModal({ card, employee, tipoProcesso = 'entrada', onClose, onUpdate }) {
  const { user, userData } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAssignUserModal, setShowAssignUserModal] = useState(false)
  const [equipmentType, setEquipmentType] = useState('celular')
  const [equipmentField, setEquipmentField] = useState('')
  const [responsibleUser, setResponsibleUser] = useState(null)
  const [equipamentosAtribuidos, setEquipamentosAtribuidos] = useState({
    celulares: [],
    notebooks: [],
    linhas: []
  })
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false)
  const [allCards, setAllCards] = useState([])

  useEffect(() => {
    loadComments()
    loadResponsibleUser()
    loadEquipamentosAtribuidos()
    loadAllCards()
  }, [card.id, card.responsavel_id, card.responsavel, employee?.id])

  // Atualizar responsável quando o card mudar
  useEffect(() => {
    if (card.responsavel) {
      setResponsibleUser(card.responsavel)
    } else if (card.responsavel_id) {
      loadResponsibleUser()
    } else {
      setResponsibleUser(null)
    }
  }, [card.responsavel, card.responsavel_id])

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const data = await kanbanCommentsService.getComments(card.id)
      setComments(data)
    } catch (error) {
      // Se a tabela não existir, apenas logar e continuar sem comentários
      if (error.message?.includes('não foi criada')) {
      } else {
      }
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id) return

    try {
      // Tentar usar o nome do userData primeiro (mais rápido e confiável)
      let userName = userData?.Nome || userData?.Name
      
      // Se não tiver no userData, buscar usando o serviço
      if (!userName || userName.trim() === '') {
        userName = await kanbanService.getUserName(user.id)
      }
      
      // Se ainda não tiver nome (retornou null), buscar diretamente na tabela Users
      if (!userName || userName.trim() === '') {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: userDataFromDb } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .maybeSingle()
          
          if (userDataFromDb && userDataFromDb.name) {
            userName = userDataFromDb.name
          }
        } catch (dbError) {
        }
      }
      
      // Se ainda não tiver nome, usar email como último recurso
      if (!userName || userName.trim() === '') {
        userName = user?.email || 'Usuário'
      }
      
      const comment = await kanbanCommentsService.createComment(card.id, newComment.trim(), user.id, userName.trim())
      setComments([comment, ...comments])
      setNewComment('')
    } catch (error) {
      if (error.message?.includes('não foi criada')) {
        alert('A tabela de comentários ainda não foi criada. Execute o script migrate_kanban_comentarios.sql no Supabase.')
      } else {
        alert('Erro ao adicionar comentário: ' + (error.message || 'Erro desconhecido'))
      }
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Deseja realmente excluir este comentário?')) return

    try {
      await kanbanCommentsService.deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
    } catch (error) {
      alert('Erro ao excluir comentário')
    }
  }

  const handleToggle = async (field) => {
    // Se for celular ou notebook e não estiver atribuído, abrir modal de seleção
    if ((field === 'tem_celular' || field === 'tem_notebook') && !card[field] && tipoProcesso === 'entrada') {
      setEquipmentType(field === 'tem_celular' ? 'celular' : 'notebook')
      setEquipmentField(field)
      setShowAssignModal(true)
      return
    }

    setUpdating(true)
    try {
      await kanbanService.updateCard(card.id, {
        [field]: !card[field],
      })
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
    } finally {
      setUpdating(false)
    }
  }

  const loadResponsibleUser = async () => {
    // Se o card já tem os dados do responsável (vindo do hook), usar diretamente
    if (card.responsavel) {
      setResponsibleUser(card.responsavel)
      return
    }

    // Caso contrário, buscar pelo ID
    if (!card.responsavel_id) {
      setResponsibleUser(null)
      return
    }

    try {
      const { usersService } = await import('@/services/users.service')
      const userData = await usersService.getById(card.responsavel_id)
      setResponsibleUser(userData)
    } catch (error) {
      console.error('Erro ao carregar responsável:', error)
      setResponsibleUser(null)
    }
  }

  const handleAssignUser = async (userId) => {
    try {
      setUpdating(true)
      
      // Buscar nome do usuário atual
      const assignedByName = userData?.name || userData?.Nome || user?.email || 'Usuário'
      
      // Atribuir usuário ao card
      await kanbanService.assignUser(
        card.id,
        userId,
        user?.id,
        assignedByName
      )

      // Se um usuário foi atribuído, criar notificação
      if (userId) {
        try {
          const { usersService } = await import('@/services/users.service')
          const assignedUser = await usersService.getById(userId)
          const userName = assignedUser?.name || assignedUser?.email || 'Usuário'
          
          await notificationsService.create(
            userId,
            'kanban',
            'Card atribuído a você',
            `Você foi atribuído como responsável pelo card de ${employee.nome}${employee.cargo ? ` (${employee.cargo})` : ''}`
          )
        } catch (notifError) {
          console.error('Erro ao criar notificação:', notifError)
          // Não bloquear a operação se falhar a notificação
        }
      }

      // Atualizar o card local com o novo responsavel_id
      // Isso garante que a UI seja atualizada imediatamente
      if (userId) {
        const { usersService } = await import('@/services/users.service')
        const assignedUser = await usersService.getById(userId)
        setResponsibleUser(assignedUser)
      } else {
        setResponsibleUser(null)
      }

      // Recarregar comentários para mostrar o comentário automático
      await loadComments()

      // Recarregar todos os dados do kanban (incluindo cards)
      if (onUpdate) {
        onUpdate()
      }
      
      setShowAssignUserModal(false)
    } catch (error) {
      alert('Erro ao atribuir usuário: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setUpdating(false)
    }
  }

  const loadEquipamentosAtribuidos = async () => {
    if (!employee?.nome) return
    
    setLoadingEquipamentos(true)
    try {
      // Buscar equipamentos atribuídos ao funcionário pelo nome
      const [celulares, notebooks, linhas] = await Promise.all([
        equipamentosService.getCelulares({ usuario_atual: employee.nome }),
        equipamentosService.getNotebooks({ usuario_atual: employee.nome }),
        equipamentosService.getLinhas({ usuario_atual: employee.nome })
      ])
      
      setEquipamentosAtribuidos({
        celulares: celulares || [],
        notebooks: notebooks || [],
        linhas: linhas || []
      })
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    } finally {
      setLoadingEquipamentos(false)
    }
  }

  const loadAllCards = async () => {
    if (!employee?.id) return
    
    try {
      // Buscar todos os cards do funcionário (entrada e saída)
      const [cardsEntrada, cardsSaida] = await Promise.all([
        kanbanService.getCards('entrada'),
        kanbanService.getCards('saida')
      ])
      
      const allCardsDoFuncionario = [
        ...cardsEntrada.filter(c => String(c.colaborador_id) === String(employee.id)),
        ...cardsSaida.filter(c => String(c.colaborador_id) === String(employee.id))
      ]
      
      setAllCards(allCardsDoFuncionario)
    } catch (error) {
      console.error('Erro ao carregar cards:', error)
    }
  }

  const handleAssignEquipment = async (equipment) => {
    try {
      setUpdating(true)
      
      // Atribuir equipamento ao colaborador
      if (equipmentType === 'celular') {
        await equipamentosService.assignCelular(equipment['Row ID'], employee.id, user?.id)
      } else if (equipmentType === 'notebook') {
        await equipamentosService.assignNotebook(equipment['Row ID'], employee.id, user?.id)
      }

      // Atualizar card do kanban
      await kanbanService.updateCard(card.id, {
        [equipmentField]: true,
      })

      // Recarregar equipamentos
      await loadEquipamentosAtribuidos()

      if (onUpdate) {
        onUpdate()
      }
      
      setShowAssignModal(false)
    } catch (error) {
      alert('Erro ao atribuir equipamento')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Detalhes do Funcionário</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Funcionário */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Informações Pessoais</h3>
              <button
                onClick={() => setShowAssignUserModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <User className="w-4 h-4" />
                {responsibleUser ? 'Alterar Responsável' : 'Atribuir Responsável'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-foreground">{employee.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                <p className="text-foreground">{employee.cargo || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                <p className="text-foreground">{employee.departamento || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Entrada</label>
                <p className="text-foreground">{formatDate(employee.data_entrada)}</p>
              </div>
            </div>
          </div>

          {/* Seção de Responsável - Sempre visível */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Responsável pelo Card
            </h3>
            {responsibleUser ? (
              <div className="p-4 bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {responsibleUser.photo ? (
                      <img
                        src={responsibleUser.photo}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center border-2 border-primary">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-primary uppercase tracking-wide">Responsável Atual</label>
                      <p className="text-lg text-primary font-bold">
                        {responsibleUser.name || responsibleUser.email || 'Usuário'}
                      </p>
                      {responsibleUser.email && responsibleUser.name && (
                        <p className="text-xs text-muted-foreground mt-1">{responsibleUser.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted border-2 border-dashed border-border rounded-lg text-center">
                <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Nenhum responsável atribuído</p>
                <p className="text-xs text-muted-foreground mt-1">Clique em "Atribuir Responsável" para atribuir um usuário</p>
              </div>
            )}
          </div>

          {/* Equipamentos Atribuídos */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Equipamentos Atribuídos
            </h3>
            {loadingEquipamentos ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Notebooks */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Notebooks</span>
                    </div>
                    {tipoProcesso === 'entrada' && (
                      <button
                        onClick={() => {
                          setEquipmentType('notebook')
                          setEquipmentField('tem_notebook')
                          setShowAssignModal(true)
                        }}
                        className="text-xs text-primary hover:opacity-80"
                      >
                        + Atribuir
                      </button>
                    )}
                  </div>
                  {equipamentosAtribuidos.notebooks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum notebook atribuído</p>
                  ) : (
                    <div className="space-y-2">
                      {equipamentosAtribuidos.notebooks.map((notebook) => (
                        <div key={notebook['Row ID']} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {notebook.Marca} {notebook.Modelo}
                            </p>
                            {notebook.NTC && (
                              <p className="text-xs text-muted-foreground">NTC: {notebook.NTC}</p>
                            )}
                          </div>
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Celulares */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Celulares</span>
                    </div>
                    {tipoProcesso === 'entrada' && (
                      <button
                        onClick={() => {
                          setEquipmentType('celular')
                          setEquipmentField('tem_celular')
                          setShowAssignModal(true)
                        }}
                        className="text-xs text-primary hover:opacity-80"
                      >
                        + Atribuir
                      </button>
                    )}
                  </div>
                  {equipamentosAtribuidos.celulares.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum celular atribuído</p>
                  ) : (
                    <div className="space-y-2">
                      {equipamentosAtribuidos.celulares.map((celular) => (
                        <div key={celular['Row ID']} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {celular.CELULAR || celular.Modelo}
                            </p>
                            {celular.IMEI && (
                              <p className="text-xs text-muted-foreground">IMEI: {celular.IMEI}</p>
                            )}
                          </div>
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linhas */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Linhas/Chips</span>
                    </div>
                  </div>
                  {equipamentosAtribuidos.linhas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma linha atribuída</p>
                  ) : (
                    <div className="space-y-2">
                      {equipamentosAtribuidos.linhas.map((linha) => (
                        <div key={linha['Row ID']} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {linha.NTC || linha.Número}
                            </p>
                            {linha.Operadora && (
                              <p className="text-xs text-muted-foreground">Operadora: {linha.Operadora}</p>
                            )}
                          </div>
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Jornada Atual (Card do Kanban) */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Jornada Atual - {tipoProcesso === 'entrada' ? 'Onboarding' : 'Offboarding'}
            </h3>
            <div className="p-4 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Etapa Atual</p>
                  <p className="text-lg font-semibold text-foreground">
                    {card.coluna || 'Não definida'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                  <p className="text-sm text-foreground">{formatDate(card.data_inicio)}</p>
                </div>
              </div>
              
              {/* Checklist do Processo */}
              <div className="space-y-2 mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Notebook</span>
                  {card.tem_notebook ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Celular</span>
                  {card.tem_celular ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Acessos</span>
                  {card.tem_acessos ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Processos */}
          {allCards.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Histórico de Processos</h3>
              <div className="space-y-2">
                {allCards
                  .filter(c => String(c.id) !== String(card.id))
                  .map((histCard) => (
                    <div key={histCard.id} className="p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {histCard.coluna || 'Processo'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(histCard.data_inicio)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            histCard.prioridade === 'alta' ? 'bg-destructive/20 text-destructive' :
                            histCard.prioridade === 'media' ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {histCard.prioridade || 'normal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {card.observacoes && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Observações</h3>
              <p className="text-foreground bg-muted p-3 rounded-lg">{card.observacoes}</p>
            </div>
          )}

          {/* Comentários */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentários
            </h3>
            
            {/* Lista de Comentários */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {loadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhum comentário ainda</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-muted rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {comment.usuario_nome || comment.usuario?.Nome || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.criado_em).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {comment.usuario_id === user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{comment.comentario}</p>
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
                    handleAddComment()
                  }
                }}
                placeholder="Adicione um comentário..."
                className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || !user?.id}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Seleção de Equipamento */}
      {showAssignModal && (
        <AssignEquipmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignEquipment}
          tipoEquipamento={equipmentType}
        />
      )}

      {/* Modal de Atribuição de Usuário */}
      {showAssignUserModal && (
        <AssignUserModal
          isOpen={showAssignUserModal}
          onClose={() => setShowAssignUserModal(false)}
          onAssign={handleAssignUser}
          currentUserId={card.responsavel_id}
        />
      )}
    </div>
  )
}

