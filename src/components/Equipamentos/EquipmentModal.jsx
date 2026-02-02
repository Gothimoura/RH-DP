import { X, User, Building2, Calendar, FileText, History, Package, Smartphone, Laptop, Phone, Hash, Tag, MapPin, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { equipamentosService } from '@/services/equipamentos.service'

// Normalizar status do banco para formato de exibição
const normalizeStatus = (status) => {
  if (!status) return 'Disponível'
  const statusLower = status.toLowerCase().trim()
  const statusMap = {
    'disponivel': 'Disponível',
    'disponível': 'Disponível',
    'em_uso': 'Em uso',
    'em uso': 'Em uso',
    'manutencao': 'Manutenção',
    'manutenção': 'Manutenção',
    'indisponivel': 'Indisponível',
    'indisponível': 'Indisponível',
    'descarte': 'Descarte',
  }
  return statusMap[statusLower] || status
}

// Função para formatar observações em lista se seguirem padrão
const formatObservacoes = (obs) => {
  if (!obs) return null
  
  // Verificar se contém padrões como "Item:" ou quebras de linha
  const lines = obs.split(/[\n;]/).map(line => line.trim()).filter(Boolean)
  
  // Se tiver múltiplas linhas ou padrões, retornar como array
  if (lines.length > 1) {
    return lines
  }
  
  // Verificar se tem padrões como "Carregador, Cabo, Case" (lista separada por vírgula)
  const items = obs.split(',').map(item => item.trim()).filter(Boolean)
  if (items.length > 1 && items.every(item => item.length < 50)) {
    return items
  }
  
  return [obs]
}

// Ícones por tipo
const typeIcons = {
  celular: Smartphone,
  notebook: Laptop,
  linha: Phone,
}

export default function EquipmentModal({ equipment, type, isOpen, onClose }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(false)

  const TypeIcon = typeIcons[type] || Smartphone

  useEffect(() => {
    if (isOpen && equipment) {
      loadHistorico()
    }
  }, [isOpen, equipment])

  const loadHistorico = async () => {
    if (!equipment) return
    
    setLoading(true)
    try {
      let data = []
      if (type === 'celular') {
        data = await equipamentosService.getHistoricoCelular(equipment['Row ID'])
      } else if (type === 'notebook') {
        data = await equipamentosService.getHistoricoNotebook(equipment['Row ID'])
      } else if (type === 'linha') {
        data = await equipamentosService.getHistoricoLinha(equipment['Row ID'])
      }
      setHistorico(data)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !equipment) return null

  const observacoesFormatadas = formatObservacoes(equipment.OBS)
  const acessoriosFormatados = formatObservacoes(equipment.ACESSORIOS)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TypeIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {type === 'celular' && (equipment.CELULAR || 'Celular')}
                {type === 'notebook' && `${equipment.Marca || ''} ${equipment.Modelo || 'Notebook'}`.trim()}
                {type === 'linha' && (equipment.NTC || 'Linha')}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                {type === 'celular' && 'Celular'}
                {type === 'notebook' && 'Notebook'}
                {type === 'linha' && 'Linha/Chip'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              normalizeStatus(equipment.Status) === 'Em uso' ? 'bg-success/20 text-success border border-success/30' :
              normalizeStatus(equipment.Status) === 'Disponível' ? 'bg-primary/20 text-primary border border-primary/30' :
              normalizeStatus(equipment.Status) === 'Manutenção' ? 'bg-warning/20 text-warning border border-warning/30' :
              normalizeStatus(equipment.Status) === 'Descarte' ? 'bg-destructive/20 text-destructive border border-destructive/30' :
              'bg-muted text-foreground border border-border'
            }`}>
              {normalizeStatus(equipment.Status)}
            </span>
          </div>

          {/* Informações Técnicas */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Informações Técnicas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {type === 'celular' && (
                <>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
                    <p className="text-sm font-medium text-foreground">{equipment.Modelo || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">IMEI</label>
                    <p className="text-sm font-mono font-medium text-foreground">{equipment.IMEI || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Nº Chip</label>
                    <p className="text-sm font-medium text-foreground">{equipment['NºCHIP'] || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Matrícula</label>
                    <p className="text-sm font-medium text-foreground">{equipment['Nº Matricula'] || '-'}</p>
                  </div>
                </>
              )}

              {type === 'notebook' && (
                <>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Marca</label>
                    <p className="text-sm font-medium text-foreground">{equipment.Marca || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
                    <p className="text-sm font-medium text-foreground">{equipment.Modelo || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Patrimônio</label>
                    <p className="text-sm font-mono font-medium text-foreground">{equipment['Nº Matricula'] || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">NTC</label>
                    <p className="text-sm font-medium text-foreground">{equipment.NTC || '-'}</p>
                  </div>
                </>
              )}

              {type === 'linha' && (
                <>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Empresa</label>
                    <p className="text-sm font-medium text-foreground">{equipment.Empresa || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <label className="text-xs text-muted-foreground block mb-1">Código Empresa</label>
                    <p className="text-sm font-medium text-foreground">{equipment['Cód Emp'] || '-'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border col-span-2">
                    <label className="text-xs text-muted-foreground block mb-1">Local</label>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {equipment.Local || '-'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Usuário Atual */}
          {equipment['Usuário atual'] && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Usuário Atual</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {equipment['Usuário atual']?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">{equipment['Usuário atual']}</p>
                  {(equipment.Departamento || equipment.DPTO || equipment['Centro de custo']) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {equipment.Departamento || equipment.DPTO || equipment['Centro de custo']}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Último Usuário */}
          {(equipment['Último usuário'] || equipment['Útimo usuário']) && !equipment['Usuário atual'] && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Último Usuário</h3>
              </div>
              <p className="text-foreground">{equipment['Último usuário'] || equipment['Útimo usuário']}</p>
            </div>
          )}

          {/* Acessórios (para celulares) */}
          {type === 'celular' && acessoriosFormatados && acessoriosFormatados.length > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-foreground">Acessórios Inclusos</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {acessoriosFormatados.map((item, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-medium border border-success/30"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {observacoesFormatadas && observacoesFormatadas.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-foreground">Observações</h3>
              </div>
              {observacoesFormatadas.length === 1 ? (
                <p className="text-foreground text-sm">{observacoesFormatadas[0]}</p>
              ) : (
                <ul className="space-y-2">
                  {observacoesFormatadas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                      <Tag className="w-3 h-3 mt-1 shrink-0 text-warning" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Histórico */}
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <History className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm md:text-base">Histórico</h3>
            </div>
            
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando histórico...</p>
            ) : historico.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum registro no histórico</p>
            ) : (
              <div className="space-y-2">
                {historico.map((item, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 border border-border rounded-lg p-2 md:p-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-1">
                      <span className="text-xs md:text-sm font-medium text-foreground">
                        {item.USUÁRIO || 'Sistema'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item['DATA E HORA'] 
                          ? new Date(item['DATA E HORA']).toLocaleString('pt-BR')
                          : '-'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-foreground">{item.COMENTÁRIO || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

