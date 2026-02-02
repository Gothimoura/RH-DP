import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function EditEquipmentModal({ 
  equipment, 
  type, 
  isOpen, 
  onClose, 
  onSave 
}) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [departamentos, setDepartamentos] = useState([])

  useEffect(() => {
    if (isOpen) {
      loadDepartamentos()
      if (equipment) {
        // Separar IMEI se estiver no formato "IMEI1 / IMEI2"
        let imei1 = ''
        let imei2 = ''
        if (equipment.IMEI) {
          const imeiParts = equipment.IMEI.split('/').map(p => p.trim())
          imei1 = imeiParts[0] || ''
          imei2 = imeiParts[1] || ''
        }
        
        setFormData({
          ...equipment,
          IMEI1: imei1,
          IMEI2: imei2
        })
      }
    }
  }, [isOpen, equipment])

  const loadDepartamentos = async () => {
    try {
      const { data } = await supabase
        .from('rh_departamentos')
        .select('nome')
        .order('nome')
      
      if (data) {
        setDepartamentos(data.map(d => d.nome).filter(Boolean))
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const dataToSave = { ...formData }
      
      // Se for celular, concatenar IMEI1 e IMEI2
      if (type === 'celular') {
        let imeiValue = ''
        if (dataToSave.IMEI1 && dataToSave.IMEI2) {
          imeiValue = `${dataToSave.IMEI1} / ${dataToSave.IMEI2}`
        } else if (dataToSave.IMEI1) {
          imeiValue = dataToSave.IMEI1
        } else if (dataToSave.IMEI2) {
          imeiValue = dataToSave.IMEI2
        }
        dataToSave.IMEI = imeiValue
        // Remover IMEI1 e IMEI2 do objeto antes de salvar
        delete dataToSave.IMEI1
        delete dataToSave.IMEI2
      }
      
      await onSave(dataToSave)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen || !equipment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            Editar Equipamento
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
          <div className="space-y-4">
            {type === 'celular' && (
              <>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                    Celular
                  </label>
                  <input
                    type="text"
                    value={formData.CELULAR || ''}
                    onChange={(e) => handleChange('CELULAR', e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.Modelo || ''}
                      onChange={(e) => handleChange('Modelo', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      IMEI 1
                    </label>
                    <input
                      type="text"
                      value={formData.IMEI1 || ''}
                      onChange={(e) => handleChange('IMEI1', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                      placeholder="IMEI principal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      IMEI 2
                    </label>
                    <input
                      type="text"
                      value={formData.IMEI2 || ''}
                      onChange={(e) => handleChange('IMEI2', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                      placeholder="IMEI secundário (opcional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Departamento
                    </label>
                    <select
                      value={formData.DPTO || ''}
                      onChange={(e) => handleChange('DPTO', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione um departamento</option>
                      {departamentos.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nº Chip
                    </label>
                    <input
                      type="text"
                      value={formData['NºCHIP'] || ''}
                      onChange={(e) => handleChange('NºCHIP', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nº Matrícula
                    </label>
                    <input
                      type="text"
                      value={formData['Nº Matricula'] || ''}
                      onChange={(e) => handleChange('Nº Matricula', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Acessórios
                  </label>
                  <textarea
                    value={formData.ACESSORIOS || ''}
                    onChange={(e) => handleChange('ACESSORIOS', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                    placeholder="Ex: Carregador, Cabo, Case"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={formData.Status || 'Disponível'}
                    onChange={(e) => handleChange('Status', e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Em uso">Em uso</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Indisponível">Indisponível</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.OBS || ''}
                    onChange={(e) => handleChange('OBS', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}

            {type === 'notebook' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.Marca || ''}
                      onChange={(e) => handleChange('Marca', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.Modelo || ''}
                      onChange={(e) => handleChange('Modelo', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nº Matrícula (Patrimônio)
                    </label>
                    <input
                      type="text"
                      value={formData['Nº Matricula'] || ''}
                      onChange={(e) => handleChange('Nº Matricula', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Departamento
                    </label>
                    <select
                      value={formData.Departamento || ''}
                      onChange={(e) => handleChange('Departamento', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione um departamento</option>
                      {departamentos.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={formData.Status || 'Disponível'}
                    onChange={(e) => handleChange('Status', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Em uso">Em uso</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Indisponível">Indisponível</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={formData.Motivo || ''}
                    onChange={(e) => handleChange('Motivo', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.OBS || ''}
                    onChange={(e) => handleChange('OBS', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}

            {type === 'linha' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    NTC
                  </label>
                  <input
                    type="text"
                    value={formData.NTC || ''}
                    onChange={(e) => handleChange('NTC', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.Empresa || ''}
                      onChange={(e) => handleChange('Empresa', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Código Empresa
                    </label>
                    <input
                      type="text"
                      value={formData['Cód Emp'] || ''}
                      onChange={(e) => handleChange('Cód Emp', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Local
                  </label>
                  <input
                    type="text"
                    value={formData.Local || ''}
                    onChange={(e) => handleChange('Local', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={formData.Status || 'Disponível'}
                    onChange={(e) => handleChange('Status', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Em uso">Em uso</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Indisponível">Indisponível</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.OBS || ''}
                    onChange={(e) => handleChange('OBS', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}
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
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}


