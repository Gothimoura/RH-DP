import { useState, useEffect } from 'react'
import { X, Search, ChevronDown, User } from 'lucide-react'
import { equipamentosService } from '@/services/equipamentos.service'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useColaboradores } from '@/hooks/useColaboradores'

export default function CreateEquipmentModal({ tipoEquipamento, isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const { colaboradores, loading: colaboradoresLoading } = useColaboradores()
  const [loading, setLoading] = useState(false)
  const [departamentos, setDepartamentos] = useState([])
  const [equipamento, setEquipamento] = useState({})
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState('')
  const [colaboradorSearch, setColaboradorSearch] = useState('')
  const [showColaboradorDropdown, setShowColaboradorDropdown] = useState(false)

  // Função para criar um novo equipamento vazio
  const criarEquipamentoVazio = () => {
    if (tipoEquipamento === 'celular') {
      return {
        CELULAR: '',
        Modelo: '',
        IMEI1: '',
        IMEI2: '',
        'NºCHIP': '',
        'Nº Matricula': '',
        ACESSORIOS: '',
        DPTO: '',
        Status: 'Disponível',
        OBS: '',
      }
    } else if (tipoEquipamento === 'notebook') {
      return {
        Marca: '',
        Modelo: '',
        'Nº Matricula': '',
        NTC: '',
        Departamento: '',
        Status: 'Disponível',
        OBS: '',
      }
    } else if (tipoEquipamento === 'linha') {
      return {
        NTC: '',
        Empresa: '',
        'Cód Emp': '',
        Local: '',
        'Centro de custo': '',
        Status: 'Disponível',
        OBS: '',
      }
    }
    return {}
  }

  useEffect(() => {
    if (isOpen) {
      loadDepartamentos()
      // Inicializar com um equipamento vazio
      setEquipamento(criarEquipamentoVazio())
    } else {
      // Limpar ao fechar
      setEquipamento({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tipoEquipamento])

  const atualizarCampo = (campo, valor) => {
    setEquipamento({
      ...equipamento,
      [campo]: valor
    })
  }

  // Filtrar colaboradores baseado na busca
  const filteredColaboradores = colaboradores.filter((colab) => {
    if (!colaboradorSearch) return true
    const searchLower = colaboradorSearch.toLowerCase()
    return (
      colab.nome?.toLowerCase().includes(searchLower) ||
      colab.cargo?.toLowerCase().includes(searchLower) ||
      colab.departamento?.toLowerCase().includes(searchLower)
    )
  })

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
    
    try {
      setLoading(true)
      
      // Validar campos obrigatórios
      if (tipoEquipamento === 'celular') {
        if (!equipamento.CELULAR || equipamento.CELULAR.trim() === '') {
          alert('O campo Celular é obrigatório')
          return
        }
      } else if (tipoEquipamento === 'notebook') {
        if (!equipamento.Marca || equipamento.Marca.trim() === '' || !equipamento.Modelo || equipamento.Modelo.trim() === '') {
          alert('Os campos Marca e Modelo são obrigatórios')
          return
        }
      } else if (tipoEquipamento === 'linha') {
        if (!equipamento.NTC || equipamento.NTC.trim() === '') {
          alert('O campo NTC é obrigatório')
          return
        }
      }

      const dataToInsert = {}
      
      if (tipoEquipamento === 'celular') {
        // Concatenar IMEI 1 e IMEI 2
        let imeiValue = ''
        if (equipamento.IMEI1 && equipamento.IMEI2) {
          imeiValue = `${equipamento.IMEI1} / ${equipamento.IMEI2}`
        } else if (equipamento.IMEI1) {
          imeiValue = equipamento.IMEI1
        } else if (equipamento.IMEI2) {
          imeiValue = equipamento.IMEI2
        }

        dataToInsert.CELULAR = equipamento.CELULAR || null
        dataToInsert.Modelo = equipamento.Modelo || null
        dataToInsert.IMEI = imeiValue || null
        dataToInsert['NºCHIP'] = equipamento['NºCHIP'] || null
        dataToInsert['Nº Matricula'] = equipamento['Nº Matricula'] || null
        dataToInsert.ACESSORIOS = equipamento.ACESSORIOS || null
        dataToInsert.DPTO = equipamento.DPTO || null
        dataToInsert.Status = equipamento.Status || 'Disponível'
        dataToInsert.OBS = equipamento.OBS || null
        
        await equipamentosService.createCelular(dataToInsert)
      } else if (tipoEquipamento === 'notebook') {
        dataToInsert.Marca = equipamento.Marca || null
        dataToInsert.Modelo = equipamento.Modelo || null
        dataToInsert['Nº Matricula'] = equipamento['Nº Matricula'] || null
        dataToInsert.NTC = equipamento.NTC || null
        dataToInsert.Departamento = equipamento.Departamento || null
        dataToInsert.Status = equipamento.Status || 'Disponível'
        dataToInsert.OBS = equipamento.OBS || null
        
        await equipamentosService.createNotebook(dataToInsert)
      } else if (tipoEquipamento === 'linha') {
        dataToInsert.NTC = equipamento.NTC || null
        dataToInsert.Empresa = equipamento.Empresa || null
        dataToInsert['Cód Emp'] = equipamento['Cód Emp'] || null
        dataToInsert.Local = equipamento.Local || null
        dataToInsert['Centro de custo'] = equipamento['Centro de custo'] || null
        dataToInsert.Status = equipamento.Status || 'Disponível'
        dataToInsert.OBS = equipamento.OBS || null
        
        await equipamentosService.createLinha(dataToInsert)
      }

      alert('Equipamento criado com sucesso!')

      if (onSuccess) {
        onSuccess()
      }
      onClose()
      // Reset form
      setEquipamento(criarEquipamentoVazio())
    } catch (error) {
      console.error('Erro ao criar equipamento:', error)
      alert('Erro ao criar equipamento: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Criar {tipoEquipamento === 'celular' ? 'Celular' : tipoEquipamento === 'notebook' ? 'Notebook' : 'Linha'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Formulário do Equipamento */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">

                {/* Campos específicos por tipo */}
                {tipoEquipamento === 'celular' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Celular <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={equipamento.CELULAR || ''}
                          onChange={(e) => atualizarCampo('CELULAR', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Modelo</label>
                        <input
                          type="text"
                          value={equipamento.Modelo || ''}
                          onChange={(e) => atualizarCampo( 'Modelo', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">IMEI 1</label>
                        <input
                          type="text"
                          value={equipamento.IMEI1 || ''}
                          onChange={(e) => atualizarCampo( 'IMEI1', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                          placeholder="IMEI principal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">IMEI 2</label>
                        <input
                          type="text"
                          value={equipamento.IMEI2 || ''}
                          onChange={(e) => atualizarCampo( 'IMEI2', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                          placeholder="IMEI secundário (opcional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nº Chip</label>
                        <input
                          type="text"
                          value={equipamento['NºCHIP'] || ''}
                          onChange={(e) => atualizarCampo( 'NºCHIP', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nº Matrícula</label>
                        <input
                          type="text"
                          value={equipamento['Nº Matricula'] || ''}
                          onChange={(e) => atualizarCampo( 'Nº Matricula', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Departamento</label>
                        <select
                          value={equipamento.DPTO || ''}
                          onChange={(e) => atualizarCampo( 'DPTO', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Selecione um departamento</option>
                          {departamentos.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                        <select
                          value={equipamento.Status || 'Disponível'}
                          onChange={(e) => atualizarCampo( 'Status', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Em uso">Em uso</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Indisponível">Indisponível</option>
                          <option value="Descarte">Descarte</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Acessórios</label>
                      <input
                        type="text"
                        value={equipamento.ACESSORIOS || ''}
                        onChange={(e) => atualizarEquipamento(index, 'ACESSORIOS', e.target.value)}
                        placeholder="Ex: Carregador, Cabo, Case"
                        className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                      <textarea
                        value={equipamento.OBS || ''}
                        onChange={(e) => atualizarEquipamento(index, 'OBS', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                        placeholder="Adicione observações sobre o equipamento..."
                      />
                    </div>
                  </>
                )}

                {tipoEquipamento === 'notebook' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Marca <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={equipamento.Marca || ''}
                          onChange={(e) => atualizarCampo( 'Marca', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Modelo <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={equipamento.Modelo || ''}
                          onChange={(e) => atualizarCampo( 'Modelo', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Patrimônio</label>
                        <input
                          type="text"
                          value={equipamento['Nº Matricula'] || ''}
                          onChange={(e) => atualizarCampo( 'Nº Matricula', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">NTC</label>
                        <input
                          type="text"
                          value={equipamento.NTC || ''}
                          onChange={(e) => atualizarCampo( 'NTC', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Departamento</label>
                        <select
                          value={equipamento.Departamento || ''}
                          onChange={(e) => atualizarCampo( 'Departamento', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Selecione um departamento</option>
                          {departamentos.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                        <select
                          value={equipamento.Status || 'Disponível'}
                          onChange={(e) => atualizarCampo( 'Status', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Em uso">Em uso</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Indisponível">Indisponível</option>
                          <option value="Descarte">Descarte</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                      <textarea
                        value={equipamento.OBS || ''}
                        onChange={(e) => atualizarEquipamento(index, 'OBS', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                        placeholder="Adicione observações sobre o equipamento..."
                      />
                    </div>
                  </>
                )}

                {tipoEquipamento === 'linha' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          NTC <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={equipamento.NTC || ''}
                          onChange={(e) => atualizarCampo( 'NTC', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Empresa</label>
                        <input
                          type="text"
                          value={equipamento.Empresa || ''}
                          onChange={(e) => atualizarCampo( 'Empresa', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Código Empresa</label>
                        <input
                          type="text"
                          value={equipamento['Cód Emp'] || ''}
                          onChange={(e) => atualizarCampo( 'Cód Emp', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Local</label>
                        <input
                          type="text"
                          value={equipamento.Local || ''}
                          onChange={(e) => atualizarCampo( 'Local', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Centro de Custo</label>
                        <input
                          type="text"
                          value={equipamento['Centro de custo'] || ''}
                          onChange={(e) => atualizarCampo( 'Centro de custo', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                        <select
                          value={equipamento.Status || 'Disponível'}
                          onChange={(e) => atualizarCampo( 'Status', e.target.value)}
                          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Em uso">Em uso</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Indisponível">Indisponível</option>
                          <option value="Descarte">Descarte</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                      <textarea
                        value={equipamento.OBS || ''}
                        onChange={(e) => atualizarEquipamento(index, 'OBS', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                        placeholder="Adicione observações sobre o equipamento..."
                      />
                    </div>
                  </>
                )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Equipamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

