import { X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { colaboradoresService } from '@/services/colaboradores.service'

export default function TransferEquipmentModal({ 
  equipment, 
  type, 
  isOpen, 
  onClose, 
  onTransfer 
}) {
  const [colaboradores, setColaboradores] = useState([])
  const [search, setSearch] = useState('')
  const [selectedColaborador, setSelectedColaborador] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadColaboradores()
      setSelectedColaborador(null)
      setSearch('')
    }
  }, [isOpen])

  const loadColaboradores = async () => {
    setLoading(true)
    try {
      const data = await colaboradoresService.getAll()
      // Remover o colaborador atual da lista
      const filtered = data.filter(colab => colab.nome !== equipment['Usuário atual'])
      setColaboradores(filtered)
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredColaboradores = colaboradores.filter(colab =>
    colab.nome?.toLowerCase().includes(search.toLowerCase()) ||
    colab.cargo?.toLowerCase().includes(search.toLowerCase()) ||
    colab.departamento?.toLowerCase().includes(search.toLowerCase())
  )

  const handleTransfer = async () => {
    if (!selectedColaborador) {
      alert('Por favor, selecione um colaborador')
      return
    }

    setLoading(true)
    try {
      await onTransfer(selectedColaborador.nome)
      setSelectedColaborador(null)
      onClose()
    } catch (error) {
      console.error('Erro ao transferir equipamento:', error)
      alert('Erro ao transferir equipamento')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !equipment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            Transferir Equipamento
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

          {equipment['Usuário atual'] && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Usuário atual:</strong> {equipment['Usuário atual']}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Transferir para:
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar colaborador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              />
            </div>

            {/* Lista de Colaboradores */}
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Carregando...</div>
              ) : filteredColaboradores.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum colaborador encontrado
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredColaboradores.map((colab) => (
                    <button
                      key={colab.id}
                      onClick={() => setSelectedColaborador(colab)}
                      className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                        selectedColaborador?.id === colab.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <p className="font-medium text-foreground">{colab.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {colab.cargo} • {colab.departamento}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedColaborador && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Transferir para: {selectedColaborador.nome}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedColaborador.cargo} • {selectedColaborador.departamento}
              </p>
            </div>
          )}
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
            onClick={handleTransfer}
            disabled={loading || !selectedColaborador}
            className="flex-1 px-4 py-2 bg-warning text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Transferindo...' : 'Confirmar Transferência'}
          </button>
        </div>
      </div>
    </div>
  )
}


