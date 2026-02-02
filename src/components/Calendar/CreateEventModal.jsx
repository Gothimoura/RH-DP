import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { calendarioService } from '@/services/calendario.service'
import { colaboradoresService } from '@/services/colaboradores.service'
import { useAuth } from '@/hooks/useAuth'

const tiposEvento = [
  { value: 'entrada', label: 'Entrada', color: '#00FF00' },
  { value: 'documentos', label: 'Documentos', color: '#0080FF' },
  { value: 'saida', label: 'Saída', color: '#FF0000' },
  { value: 'aniversario', label: 'Aniversário', color: '#FF00FF' },
  { value: 'ferias', label: 'Férias', color: '#FFA500' },
]

export default function CreateEventModal({ isOpen, onClose, onSuccess, selectedDate = null }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [colaboradores, setColaboradores] = useState([])
  const [formData, setFormData] = useState({
    titulo: '',
    tipo_evento: 'entrada',
    descricao: '',
    data_evento: selectedDate || new Date().toISOString().split('T')[0],
    hora_evento: '',
    colaborador_id: '',
    departamento_id: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadColaboradores()
      if (selectedDate) {
        setFormData(prev => ({ ...prev, data_evento: selectedDate }))
      }
    }
  }, [isOpen, selectedDate])

  const loadColaboradores = async () => {
    try {
      const data = await colaboradoresService.getAll()
      setColaboradores(data)
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo.trim()) {
      alert('Preencha o título do evento')
      return
    }

    try {
      setLoading(true)
      
      const eventData = {
        titulo: formData.titulo.trim(),
        tipo_evento: formData.tipo_evento,
        descricao: formData.descricao || null,
        data_evento: formData.data_evento,
        hora_evento: formData.hora_evento || null,
        colaborador_id: formData.colaborador_id || null,
        departamento_id: formData.departamento_id || null,
        status: 'pendente',
      }

      await calendarioService.createEvent(eventData)

      if (onSuccess) {
        onSuccess()
      }
      onClose()
      // Reset form
      setFormData({
        titulo: '',
        tipo_evento: 'entrada',
        descricao: '',
        data_evento: new Date().toISOString().split('T')[0],
        hora_evento: '',
        colaborador_id: '',
        departamento_id: '',
      })
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      alert('Erro ao criar evento: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Criar Novo Evento</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Título <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="Ex: Reunião de equipe, Aniversário João Silva..."
              required
            />
          </div>

          {/* Tipo de Evento */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de Evento <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tiposEvento.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_evento: tipo.value })}
                  className={`p-3 border-2 rounded-lg transition-colors text-sm font-medium ${
                    formData.tipo_evento === tipo.value
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: tipo.color }}
                    ></div>
                    <span className="text-foreground">{tipo.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={formData.data_evento}
                onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Hora</label>
              <input
                type="time"
                value={formData.hora_evento}
                onChange={(e) => setFormData({ ...formData, hora_evento: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              />
            </div>
          </div>

          {/* Colaborador */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Colaborador</label>
            <select
              value={formData.colaborador_id}
              onChange={(e) => setFormData({ ...formData, colaborador_id: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
            >
              <option value="">Selecione um colaborador (opcional)</option>
              {colaboradores.map((colab) => (
                <option key={colab.id} value={colab.id}>
                  {colab.nome} {colab.cargo ? `- ${colab.cargo}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="Adicione uma descrição ou observações sobre o evento..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

