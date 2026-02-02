import { useState, useEffect } from 'react'
import { kanbanService } from '@/services/kanban.service'
import { colaboradoresService } from '@/services/colaboradores.service'
import { useAuth } from '@/hooks/useAuth'

export function useKanban(tipoProcesso = 'entrada') {
  const { userData, user } = useAuth()
  const [cards, setCards] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [tipoProcesso])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const cardsData = await kanbanService.getCards(tipoProcesso)
      
      // IMPORTANTE: Incluir TODOS os cards, mesmo os com colaborador_id null
      // Isso garante que cards não desapareçam se o colaborador foi deletado ou não encontrado
      const colaboradorIds = [...new Set(cardsData.map(c => c.colaborador_id).filter(Boolean))]
      const responsavelIds = [...new Set(cardsData.map(c => c.responsavel_id).filter(Boolean))]

      // Buscar colaboradores primeiro da view (pode ter filtros)
      let employeesData = []
      if (colaboradorIds.length > 0) {
        try {
          employeesData = await colaboradoresService.getByIds(colaboradorIds)
        } catch (error) {
          console.error('Erro ao buscar colaboradores da view:', error)
          employeesData = []
        }
      }

      // IMPORTANTE: Se algum colaborador não foi encontrado na view, buscar diretamente da tabela
      // Isso garante que cards apareçam mesmo se o colaborador não estiver na view
      const { supabase } = await import('@/lib/supabase')
      const encontradosIds = new Set(employeesData.map(e => e.id))
      const naoEncontradosIds = colaboradorIds.filter(id => !encontradosIds.has(id))
      
      if (naoEncontradosIds.length > 0) {
        // Buscar diretamente da tabela rh_colaboradores
        const { data: colaboradoresTabela, error: tabelaError } = await supabase
          .from('rh_colaboradores')
          .select('id, nome, cargo, departamento_id, data_entrada, etapa_id, foto_url, matricula, email, telefone, ativo')
          .in('id', naoEncontradosIds)
        
        if (!tabelaError && colaboradoresTabela && colaboradoresTabela.length > 0) {
          // Buscar nomes dos departamentos para os colaboradores encontrados
          const departamentoIds = [...new Set(colaboradoresTabela.map(c => c.departamento_id).filter(Boolean))]
          let departamentosMap = {}
          
          if (departamentoIds.length > 0) {
            const { data: departamentos } = await supabase
              .from('rh_departamentos')
              .select('id, nome')
              .in('id', departamentoIds)
            
            if (departamentos) {
              departamentos.forEach(d => {
                departamentosMap[d.id] = d.nome
              })
            }
          }
          
          // Normalizar colaboradores da tabela para o formato esperado
          const colaboradoresNormalizados = colaboradoresTabela.map(colab => ({
            id: colab.id,
            nome: colab.nome,
            cargo: colab.cargo,
            departamento: departamentosMap[colab.departamento_id] || null,
            departamento_id: colab.departamento_id,
            data_entrada: colab.data_entrada,
            etapa_id: colab.etapa_id,
            foto_url: colab.foto_url,
            matricula: colab.matricula,
            email: colab.email,
            telefone: colab.telefone,
            ativo: colab.ativo
          }))
          
          // Adicionar aos colaboradores encontrados
          employeesData = [...employeesData, ...colaboradoresNormalizados]
        }
      }

      // Criar mapa de colaboradores por ID para busca rápida
      const employeesMap = {}
      employeesData.forEach(emp => {
        employeesMap[emp.id] = emp
      })

      // Buscar dados dos responsáveis (fallback caso o join não funcione)
      const { usersService } = await import('@/services/users.service')
      const responsaveisData = responsavelIds.length > 0
        ? await Promise.all(
            responsavelIds.map(async (id) => {
              try {
                return await usersService.getById(id)
              } catch {
                return null
              }
            })
          ).then(results => results.filter(Boolean))
        : []

      // Criar mapa de responsáveis por ID
      const responsaveisMap = {}
      responsaveisData.forEach(r => {
        responsaveisMap[r.id] = r
      })

      // Normalizar os cards: usar responsável do join se disponível, senão buscar do mapa
      // IMPORTANTE: Manter TODOS os cards, mesmo sem colaborador encontrado
      const cardsWithResponsible = cardsData.map(card => {
        let responsavel = null
        
        // Se o join trouxe os dados do responsável, usar diretamente
        if (card.responsavel && card.responsavel.id) {
          responsavel = card.responsavel
        } 
        // Caso contrário, buscar do mapa que criamos
        else if (card.responsavel_id && responsaveisMap[card.responsavel_id]) {
          responsavel = responsaveisMap[card.responsavel_id]
        }
        
        return {
          ...card,
          responsavel: responsavel
        }
      })

      setCards(cardsWithResponsible)
      setEmployees(employeesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const moveCard = async (cardId, newColumn, newPosition) => {
    const { supabase } = await import('@/lib/supabase')
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const userId = authUser?.id || null
    
    // Buscar nome do usuário do userData ou usar email como fallback
    const userName = userData?.name || userData?.Nome || userData?.Name || authUser?.email || 'Usuário'

    // Encontrar o card atual
    const currentCard = cards.find(c => String(c.id) === String(cardId))
    if (!currentCard) {
      throw new Error('Card não encontrado')
    }

    // Salvar estado anterior para possível reversão
    const previousCards = [...cards]
    const oldColumn = currentCard.coluna
    const oldPosition = currentCard.posicao

    // Atualização otimista - atualizar estado local imediatamente
    setCards(prevCards => {
      return prevCards.map(card => {
        if (String(card.id) === String(cardId)) {
          // Atualizar o card movido
          return {
            ...card,
            coluna: newColumn,
            posicao: newPosition,
            atualizado_em: new Date().toISOString()
          }
        }
        // Manter outros cards como estão (o backend vai calcular as posições corretas)
        return card
      })
    })

    try {
      // Fazer a operação no banco em background
      // moveCard retorna o card atualizado, então podemos sincronizar apenas esse card
      const updatedCard = await kanbanService.moveCard(cardId, newColumn, newPosition, userId, userName)
      
      // Sincronizar apenas o card atualizado sem recarregar tudo
      if (updatedCard) {
        setCards(prevCards => 
          prevCards.map(card => 
            String(card.id) === String(cardId) ? { ...card, ...updatedCard } : card
          )
        )
      }
    } catch (err) {
      // Reverter estado em caso de erro
      setCards(previousCards)
      setError(err.message)
      throw err
    }
  }

  const updateCard = async (cardId, updates) => {
    try {
      await kanbanService.updateCard(cardId, updates)
      await loadData()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    cards,
    employees,
    loading,
    error,
    moveCard,
    updateCard,
    refetch: loadData,
  }
}

