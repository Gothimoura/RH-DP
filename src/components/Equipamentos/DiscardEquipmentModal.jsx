import { X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function DiscardEquipmentModal({ 
  equipment, 
  type, 
  isOpen, 
  onClose, 
  onDiscard 
}) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDiscard = async () => {
    if (!motivo.trim()) {
      alert('Por favor, informe o motivo do descarte')
      return
    }

    const confirmar = window.confirm(
      'Tem certeza que deseja marcar este equipamento como descarte? ' +
      'Esta ação não excluirá o equipamento, apenas alterará seu status.'
    )

    if (!confirmar) return

    setLoading(true)
    try {
      await onDiscard(motivo)
      setMotivo('')
      onClose()
    } catch (error) {
      console.error('Erro ao marcar como descarte:', error)
      alert('Erro ao marcar como descarte')
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
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Marcar como Descarte
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Equipamento:</p>
            <p className="font-semibold text-foreground">
              {type === 'celular' && equipment.CELULAR}
              {type === 'notebook' && `${equipment.Marca || ''} ${equipment.Modelo || ''}`.trim()}
              {type === 'linha' && equipment.NTC}
            </p>
          </div>

          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Atenção:</strong> Esta ação marcará o equipamento como descarte, 
              mas não o excluirá do sistema. O histórico será mantido e o equipamento 
              permanecerá visível para consulta.
            </p>
          </div>

          {equipment['Usuário atual'] && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Usuário atual:</strong> {equipment['Usuário atual']}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O equipamento será liberado automaticamente do usuário atual.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Motivo do descarte *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Equipamento danificado, Obsoleto, Fim de vida útil, etc."
              rows={5}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-destructive focus:border-transparent placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDiscard}
            disabled={loading || !motivo.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Confirmar Descarte'}
          </button>
        </div>
      </div>
    </div>
  )
}


