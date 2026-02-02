import { X } from 'lucide-react'
import { useState } from 'react'

export default function ReleaseEquipmentModal({ 
  equipment, 
  type, 
  isOpen, 
  onClose, 
  onRelease 
}) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRelease = async () => {
    if (!motivo.trim()) {
      alert('Por favor, informe o motivo da devolução')
      return
    }

    setLoading(true)
    try {
      await onRelease(equipment, motivo)
      setMotivo('')
      onClose()
    } catch (error) {
      console.error('Erro ao devolver equipamento:', error)
      alert('Erro ao devolver equipamento')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !equipment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            Devolver Equipamento
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Equipamento:</p>
            <p className="font-semibold text-foreground">
              {type === 'celular' && equipment.CELULAR}
              {type === 'notebook' && `${equipment.Marca || ''} ${equipment.Modelo || ''}`.trim()}
              {type === 'linha' && equipment.NTC}
            </p>
          </div>

          {equipment['Usuário atual'] && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Usuário atual:</p>
              <p className="font-medium text-foreground">{equipment['Usuário atual']}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Motivo da devolução *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Funcionário saiu da empresa, Equipamento em manutenção, etc."
              rows={4}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 p-4 md:p-6 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm md:text-base"
          >
            Cancelar
          </button>
          <button
            onClick={handleRelease}
            disabled={loading || !motivo.trim()}
            className="flex-1 px-4 py-2 bg-warning text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {loading ? 'Devolvendo...' : 'Confirmar Devolução'}
          </button>
        </div>
      </div>
    </div>
  )
}

