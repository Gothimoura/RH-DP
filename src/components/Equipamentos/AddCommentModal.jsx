import { X } from 'lucide-react'
import { useState } from 'react'

export default function AddCommentModal({ 
  equipment, 
  type, 
  isOpen, 
  onClose, 
  onAddComment 
}) {
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!comentario.trim()) {
      alert('Por favor, digite um comentário')
      return
    }

    setLoading(true)
    try {
      await onAddComment(comentario)
      setComentario('')
      onClose()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      alert('Erro ao adicionar comentário')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !equipment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            Adicionar Comentário ao Histórico
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Equipamento:</p>
            <p className="font-semibold text-foreground">
              {type === 'celular' && equipment.CELULAR}
              {type === 'notebook' && `${equipment.Marca || ''} ${equipment.Modelo || ''}`.trim()}
              {type === 'linha' && equipment.NTC}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Comentário *
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Digite seu comentário sobre este equipamento..."
              rows={6}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este comentário será registrado no histórico do equipamento
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !comentario.trim()}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adicionando...' : 'Adicionar Comentário'}
          </button>
        </div>
      </div>
    </div>
  )
}


