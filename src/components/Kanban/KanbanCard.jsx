import { memo } from 'react'
import { Smartphone, Laptop, CheckCircle, XCircle, Clock, Eye, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

function KanbanCard({ card, employee, responsibleUser, onClick }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta':
        return 'border-l-red-500'
      case 'media':
        return 'border-l-orange-500'
      default:
        return 'border-l-blue-500'
    }
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border border-gray-200 dark:border-gray-700 ${getPriorityColor(
        card.prioridade
      )} p-4 transition-all hover:shadow-lg cursor-move select-none opacity-100 relative z-10`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-foreground">
          {employee?.nome || (card.colaborador_id ? `Colaborador ID: ${card.colaborador_id.substring(0, 8)}...` : 'Sem colaborador')}
        </h4>
        <span className="text-xs text-muted-foreground">
          {formatDate(card.data_inicio)}
        </span>
      </div>

      <p className="text-sm text-foreground mb-3">{employee?.cargo || 'Sem cargo'}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {employee?.departamento || (card.colaborador_id ? 'Colaborador não encontrado' : 'Sem departamento')}
      </p>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          {card.tem_notebook ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground" />
          )}
          <Laptop className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          {card.tem_celular ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground" />
          )}
          <Smartphone className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          {card.tem_acessos ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <Clock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {card.observacoes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{card.observacoes}</p>
      )}

      {/* Responsável atribuído */}
      {responsibleUser && (
        <div className="mt-2 flex items-center gap-2 text-xs text-foreground bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded">
          <User className="w-3 h-3 text-primary" />
          <span className="text-primary font-medium">
            {responsibleUser.name || responsibleUser.email || 'Responsável'}
          </span>
        </div>
      )}

      {/* Botão para ver detalhes */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
      >
        <Eye className="w-3 h-3" />
        Ver Detalhes
      </button>
    </div>
  )
}

export default memo(KanbanCard)

