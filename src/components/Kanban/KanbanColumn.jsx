import { memo, useState, useRef } from 'react'
import KanbanCard from './KanbanCard'

function KanbanColumn({ columnId, title, cards, employees, onCardClick, onDrop, onDragOver, onDragStart }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounterRef = useRef(0)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
    onDragOver(e)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    
    // Só desabilitar o highlight quando realmente sair da área
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDraggingOver(false)
    
    // Pegar o cardId do dataTransfer
    const cardId = e.dataTransfer.getData('cardId')
    onDrop(columnId, cardId)
  }

  return (
    <div className="h-full bg-muted/30 rounded-lg p-4 min-h-[600px] flex flex-col">
      <h3 className="font-semibold text-foreground mb-4 text-center">{title}</h3>
      <div
        className={`flex-1 overflow-y-auto space-y-3 min-h-[200px] transition-colors ${
          isDraggingOver ? 'bg-primary/10 dark:bg-primary/20 rounded-lg p-2 border-2 border-primary border-dashed' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {cards.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhum card
          </div>
        ) : (
          cards.map((card) => {
            // IMPORTANTE: Buscar colaborador mesmo se não encontrado (pode ser null)
            // Isso garante que cards sejam exibidos mesmo quando colaborador não existe
            const employee = card.colaborador_id 
              ? employees.find((e) => e && e.id && String(e.id) === String(card.colaborador_id))
              : null
            
            return (
              <div
                key={String(card.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('cardId', String(card.id))
                  e.dataTransfer.effectAllowed = 'move'
                  onDragStart?.(String(card.id))
                }}
              >
                <KanbanCard
                  card={card}
                  employee={employee || null}
                  responsibleUser={card.responsavel}
                  onClick={() => onCardClick(card, employee || null)}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default memo(KanbanColumn)

