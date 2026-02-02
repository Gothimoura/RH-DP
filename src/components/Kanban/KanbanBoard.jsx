import { useState, useMemo, useCallback, useEffect } from 'react'
import { useKanban } from '@/hooks/useKanban'
import KanbanColumn from './KanbanColumn'
import EmployeeModal from './EmployeeModal'
import { supabase } from '@/lib/supabase'

export default function KanbanBoard({ tipoProcesso = 'entrada' }) {
  const { cards, employees, loading, moveCard, refetch: loadData } = useKanban(tipoProcesso)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [draggedCardId, setDraggedCardId] = useState(null)
  const [columns, setColumns] = useState([])
  const [loadingColumns, setLoadingColumns] = useState(true)

  // Buscar colunas da tabela Etapas
  useEffect(() => {
    loadColumns()
  }, [tipoProcesso])

  const loadColumns = async () => {
    try {
      setLoadingColumns(true)
      
      const { data: allEtapas, error: allError } = await supabase
        .from('rh_etapas')
        .select('id, tipo, nome')
        .order('nome', { ascending: true })
      
      if (allError || !allEtapas || allEtapas.length === 0) {
        setColumns([])
        return
      }
      
      // "ligado" = onboarding (entrada), "desligado" = offboarding (saída)
      const tipoFiltro = tipoProcesso === 'entrada' ? 'ligado' : 'desligado'
      
      // Filtrar manualmente (case-insensitive)
      const etapasFiltradas = allEtapas.filter(etapa => {
        const tipoEtapaLower = (etapa.tipo || '').toString().toLowerCase().trim()
        
        if (tipoFiltro === 'ligado') {
          return (tipoEtapaLower.startsWith('ligado') || tipoEtapaLower.includes('ligamento')) && 
                 !tipoEtapaLower.includes('desligado') && !tipoEtapaLower.includes('desligamento')
        } else if (tipoFiltro === 'desligado') {
          return tipoEtapaLower.startsWith('desligado') || tipoEtapaLower.includes('desligamento')
        }
        return false
      })

      // Converter etapas para formato de colunas
      const etapasColunas = etapasFiltradas.map(etapa => ({
        id: etapa.id,
        title: etapa.nome || etapa.id,
      }))

      setColumns(etapasColunas)
    } catch (error) {
      setColumns([])
    } finally {
      setLoadingColumns(false)
    }
  }

  // Memoizar os cards por coluna
  const cardsByColumn = useMemo(() => {
    const result = {}
    columns.forEach(column => {
      result[column.id] = cards
        .filter((card) => card && card.id && String(card.coluna || '') === String(column.id || ''))
        .sort((a, b) => (a.posicao || 0) - (b.posicao || 0))
    })
    return result
  }, [cards, columns])

  const handleDragStart = useCallback((cardId) => {
    setDraggedCardId(cardId)
  }, [])

  const handleDrop = useCallback(async (columnId, cardIdFromEvent) => {
    // Usar o cardId do evento ou do state
    const cardId = cardIdFromEvent || draggedCardId
    
    if (!cardId) {
      return
    }
    
    // Limpar draggedCardId imediatamente para melhor UX
    setDraggedCardId(null)
    
    try {
      // Calcular a posição correta baseada nos cards existentes na coluna de destino
      const cardsInColumn = cardsByColumn[columnId] || []
      const currentCard = cards.find(c => String(c.id) === String(cardId))
      const isMovingWithinSameColumn = currentCard && String(currentCard.coluna) === String(columnId)
      
      // Se está movendo na mesma coluna, manter a posição atual ou colocar no final
      let newPosition
      if (isMovingWithinSameColumn) {
        // Manter a posição atual se possível
        newPosition = currentCard.posicao || cardsInColumn.length - 1
      } else {
        // Colocar no final da nova coluna
        newPosition = cardsInColumn.length
      }
      
      // moveCard já faz a atualização otimista, então não precisa aguardar
      moveCard(String(cardId), String(columnId), newPosition).catch(error => {
        // Erro já é tratado no hook com reversão
        console.error('Erro ao mover card:', error)
      })
    } catch (error) {
      // Fallback apenas se houver erro antes de chamar moveCard
      console.error('Erro ao processar drop:', error)
    }
  }, [draggedCardId, moveCard, cardsByColumn, cards])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const handleCardClick = useCallback((card, employee) => {
    setSelectedCard(card)
    setSelectedEmployee(employee)
  }, [])

  // Atualizar selectedCard quando os cards mudarem (após atualização)
  useEffect(() => {
    if (selectedCard) {
      const updatedCard = cards.find(c => String(c.id) === String(selectedCard.id))
      if (updatedCard) {
        setSelectedCard(updatedCard)
      }
    }
  }, [cards, selectedCard?.id])

  // Retornos condicionais APÓS todos os hooks
  if (loadingColumns || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <KanbanColumn
                columnId={column.id}
                title={column.title}
                cards={cardsByColumn[column.id] || []}
                employees={employees}
                onCardClick={handleCardClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedCard && selectedEmployee && (
        <EmployeeModal
          card={selectedCard}
          employee={selectedEmployee}
          tipoProcesso={tipoProcesso}
          onClose={() => {
            setSelectedCard(null)
            setSelectedEmployee(null)
          }}
          onUpdate={loadData}
        />
      )}
    </>
  )
}
