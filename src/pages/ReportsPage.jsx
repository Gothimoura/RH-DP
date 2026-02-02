import { useState, useEffect } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import { reportsService } from '@/services/reports.service'
import { supabase } from '@/lib/supabase'
import { Download, FileText, Users, Package, Calendar, Zap, TrendingUp, ExternalLink, Paperclip } from 'lucide-react'

const reportTypes = [
  { id: 'funcionarios', label: 'Funcionários', icon: Users, color: 'primary' },
  { id: 'equipamentos', label: 'Equipamentos', icon: Package, color: 'success' },
  { id: 'onboarding', label: 'Onboarding', icon: TrendingUp, color: 'warning' },
  { id: 'calendario', label: 'Calendário', icon: Calendar, color: 'info' },
  { id: 'acoes_rapidas', label: 'Ações Rápidas', icon: Zap, color: 'danger' },
  { id: 'documentos', label: 'Documentos', icon: FileText, color: 'neutral' },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [estatisticas, setEstatisticas] = useState(null)
  const [filters, setFilters] = useState({})
  const [departamentos, setDepartamentos] = useState([])

  useEffect(() => {
    loadEstatisticas()
    loadDepartamentos()
  }, [])

  useEffect(() => {
    if (selectedReport) {
      loadReport()
    }
  }, [selectedReport, filters])

  const loadEstatisticas = async () => {
    try {
      const stats = await reportsService.getEstatisticasGerais()
      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

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

  const loadReport = async () => {
    if (!selectedReport) return

    setLoading(true)
    try {
      let data = []
      
      switch (selectedReport) {
        case 'funcionarios':
          data = await reportsService.getFuncionariosReport(filters)
          break
        case 'equipamentos':
          const tipo = filters.tipo_equipamento || 'celulares'
          data = await reportsService.getEquipamentosReport(tipo, filters)
          break
        case 'onboarding':
          const tipoProcesso = filters.tipo_processo || 'entrada'
          data = await reportsService.getOnboardingReport(tipoProcesso, filters)
          break
        case 'calendario':
          data = await reportsService.getCalendarioReport(filters)
          break
        case 'acoes_rapidas':
          data = await reportsService.getAcoesRapidasReport(filters)
          break
        case 'documentos':
          data = await reportsService.getDocumentosReport(filters)
          break
        default:
          break
      }

      setReportData(data)
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      alert('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (reportData.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    const reportName = reportTypes.find(r => r.id === selectedReport)?.label || 'relatorio'
    reportsService.exportToCSV(reportData, reportName)
  }

  const handleSelectReport = (reportId) => {
    setSelectedReport(reportId)
    setFilters({})
    setReportData([])
  }

  const renderFilters = () => {
    if (!selectedReport) return null

    switch (selectedReport) {
      case 'funcionarios':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Departamento
              </label>
              <select
                value={filters.departamento || ''}
                onChange={(e) => setFilters({ ...filters, departamento: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Todos</option>
                {departamentos.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 'equipamentos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo
              </label>
              <select
                value={filters.tipo_equipamento || 'celulares'}
                onChange={(e) => setFilters({ ...filters, tipo_equipamento: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="celulares">Celulares</option>
                <option value="notebooks">Notebooks</option>
                <option value="linhas">Linhas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Todos</option>
                <option value="Em uso">Em uso</option>
                <option value="Disponível">Disponível</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Departamento
              </label>
              <select
                value={filters.departamento || ''}
                onChange={(e) => setFilters({ ...filters, departamento: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Todos</option>
                {departamentos.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 'onboarding':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de Processo
              </label>
              <select
                value={filters.tipo_processo || 'entrada'}
                onChange={(e) => setFilters({ ...filters, tipo_processo: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="entrada">Entrada (Onboarding)</option>
                <option value="saida">Saída (Offboarding)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Coluna
              </label>
              <select
                value={filters.coluna || ''}
                onChange={(e) => setFilters({ ...filters, coluna: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Todas</option>
                {filters.tipo_processo === 'entrada' ? (
                  <>
                    <option value="novo">Novo</option>
                    <option value="documentacao">Documentação</option>
                    <option value="config_ti">Config TI</option>
                    <option value="pronto">Pronto</option>
                  </>
                ) : (
                  <>
                    <option value="solicitado">Solicitado</option>
                    <option value="devolucao_equipamentos">Devolução Equip.</option>
                    <option value="bloqueio_acessos">Bloqueio Acessos</option>
                    <option value="finalizado">Finalizado</option>
                  </>
                )}
              </select>
            </div>
          </div>
        )

      case 'calendario':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => setFilters({ ...filters, data_fim: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Departamento
              </label>
              <select
                value={filters.departamento || ''}
                onChange={(e) => setFilters({ ...filters, departamento: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Todos</option>
                {departamentos.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 'acoes_rapidas':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => setFilters({ ...filters, data_fim: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>
        )

      case 'documentos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => setFilters({ ...filters, data_fim: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Relatórios
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Gere relatórios com base nos dados do sistema</p>
        </div>

        {/* Estatísticas Gerais */}
        {estatisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Total Funcionários</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{estatisticas.totalFuncionarios}</p>
            </div>
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Onboarding Pendente</p>
              <p className="text-xl md:text-2xl font-bold text-warning">{estatisticas.onboardingPendente}</p>
            </div>
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Offboarding Pendente</p>
              <p className="text-xl md:text-2xl font-bold text-danger">{estatisticas.offboardingPendente}</p>
            </div>
            <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Eventos do Mês</p>
              <p className="text-xl md:text-2xl font-bold text-primary">{estatisticas.eventosMes}</p>
            </div>
          </div>
        )}

        {/* Seleção de Relatórios */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Selecione o Tipo de Relatório</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              const isSelected = selectedReport === report.id
              return (
                <button
                  key={report.id}
                  onClick={() => handleSelectReport(report.id)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`font-medium text-xs md:text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {report.label}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filtros e Resultados */}
        {selectedReport && (
          <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-foreground">
                {reportTypes.find(r => r.id === selectedReport)?.label}
              </h2>
              {reportData.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Exportar CSV
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-muted/50 rounded-lg">
              {renderFilters()}
            </div>

            {/* Resultados */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando dados...</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum dado encontrado com os filtros selecionados</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        {Object.keys(reportData[0] || {})
                          .filter(key => {
                            // Filtrar objetos aninhados que serão exibidos de forma especial
                            const value = reportData[0][key]
                            if (key === 'Colaboradores' || key === 'rh_colaboradores' || key === 'documentos_templates') {
                              return false // Não mostrar como coluna separada
                            }
                            return true
                          })
                          .map((key) => (
                            <th
                              key={key}
                              className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                            {key === 'dados' ? 'Anexos' : key.replace(/_/g, ' ')
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/\b\w/g, l => l.toUpperCase())
                              .trim()}
                          </th>
                        ))}
                      {/* Adicionar colunas especiais para objetos aninhados */}
                      {(reportData[0]?.Colaboradores || reportData[0]?.rh_colaboradores) && (
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Colaborador
                        </th>
                      )}
                      {reportData[0]?.documentos_templates && (
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Template
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {reportData.slice(0, 100).map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        {Object.entries(row)
                          .filter(([key]) => {
                            // Filtrar objetos aninhados que serão exibidos separadamente
                            return key !== 'Colaboradores' && key !== 'rh_colaboradores' && key !== 'documentos_templates'
                          })
                          .map(([key, value], cellIndex) => {
                            // Formatar valores especiais
                            let displayValue = '-'
                            
                            if (value === null || value === undefined) {
                              displayValue = '-'
                            } else if (key === 'dados' && typeof value === 'object' && value !== null) {
                              // Tratamento especial para campo 'dados' que contém anexos
                              const anexos = value.anexos
                              if (anexos && Array.isArray(anexos) && anexos.length > 0) {
                                displayValue = (
                                  <div className="flex flex-col gap-1">
                                    {anexos.map((anexo, idx) => (
                                      <a
                                        key={idx}
                                        href={anexo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline text-xs"
                                      >
                                        <Paperclip className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{anexo.nome}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ))}
                                  </div>
                                )
                              } else {
                                displayValue = '-'
                              }
                            } else if (key.includes('data') || key.includes('Data') || key.includes('criado_em') || key.includes('atualizado_em')) {
                              // Formatar datas
                              try {
                                displayValue = new Date(value).toLocaleDateString('pt-BR')
                              } catch {
                                displayValue = String(value)
                              }
                            } else if (typeof value === 'object') {
                              // Outros objetos - tentar mostrar propriedades úteis
                              if (Array.isArray(value)) {
                                displayValue = value.length > 0 ? `${value.length} itens` : '-'
                              } else {
                                displayValue = JSON.stringify(value).substring(0, 50) + '...'
                              }
                            } else {
                              displayValue = String(value)
                            }
                            
                            return (
                              <td key={cellIndex} className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-foreground">
                                {typeof displayValue === 'string' ? (
                                  <span className="whitespace-nowrap">{displayValue}</span>
                                ) : (
                                  displayValue
                                )}
                              </td>
                            )
                          })}
                        {/* Colunas especiais para objetos aninhados */}
                        {(row.Colaboradores || row.rh_colaboradores) && (
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">
                            {row.Colaboradores?.Nome || row.rh_colaboradores?.nome || '-'}
                          </td>
                        )}
                        {row.documentos_templates && (
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">
                            {row.documentos_templates?.nome || '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length > 100 && (
                  <p className="mt-4 text-xs md:text-sm text-muted-foreground text-center px-3 md:px-6">
                    Mostrando 100 de {reportData.length} registros. Exporte para CSV para ver todos.
                  </p>
                )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
