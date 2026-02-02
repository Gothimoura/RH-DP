import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { equipamentosService } from '@/services/equipamentos.service'

export default function AssignEquipmentModal({ 
  isOpen, 
  onClose, 
  onAssign,
  tipoEquipamento = 'celular' // 'celular' ou 'notebook'
}) {
  const [equipamentos, setEquipamentos] = useState([])
  const [search, setSearch] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadEquipamentos()
    }
  }, [isOpen, tipoEquipamento])

  const loadEquipamentos = async () => {
    setLoading(true)
    try {
      let data = []
      if (tipoEquipamento === 'celular') {
        data = await equipamentosService.getCelulares({ status: 'Disponível' })
      } else if (tipoEquipamento === 'notebook') {
        data = await equipamentosService.getNotebooks({ status: 'Disponível' })
      }
      setEquipamentos(data)
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipamentos = equipamentos.filter(eq => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    if (tipoEquipamento === 'celular') {
      return (
        (eq.CELULAR?.toLowerCase().includes(searchLower)) ||
        (eq.Modelo?.toLowerCase().includes(searchLower)) ||
        (eq.IMEI?.toLowerCase().includes(searchLower))
      )
    } else if (tipoEquipamento === 'notebook') {
      return (
        (eq.Modelo?.toLowerCase().includes(searchLower)) ||
        (eq.Marca?.toLowerCase().includes(searchLower)) ||
        (eq.NTC?.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  const handleAssign = () => {
    if (selectedEquipment) {
      onAssign(selectedEquipment)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Selecionar {tipoEquipamento === 'celular' ? 'Celular' : 'Notebook'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Buscar ${tipoEquipamento === 'celular' ? 'celular' : 'notebook'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Lista de Equipamentos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando equipamentos...</p>
            </div>
          ) : filteredEquipamentos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum {tipoEquipamento === 'celular' ? 'celular' : 'notebook'} disponível encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEquipamentos.map((equipment) => (
                <button
                  key={equipment['Row ID']}
                  onClick={() => setSelectedEquipment(equipment)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    selectedEquipment?.['Row ID'] === equipment['Row ID']
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {tipoEquipamento === 'celular' 
                          ? equipment.CELULAR || equipment.Modelo
                          : `${equipment.Marca || ''} ${equipment.Modelo || ''}`.trim() || equipment.NTC
                        }
                      </p>
                      {equipment.Modelo && tipoEquipamento === 'celular' && (
                        <p className="text-sm text-muted-foreground">Modelo: {equipment.Modelo}</p>
                      )}
                      {equipment.IMEI && (
                        <p className="text-xs text-muted-foreground">IMEI: {equipment.IMEI}</p>
                      )}
                    </div>
                    {selectedEquipment?.['Row ID'] === equipment['Row ID'] && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedEquipment}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selecionar
          </button>
        </div>
      </div>
    </div>
  )
}

