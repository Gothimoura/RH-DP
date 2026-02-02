import { useState, useEffect } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import { supabase } from '@/lib/supabase'
import { FileText, Plus, Search, ChevronDown, History, Download, RefreshCw, User, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useColaboradores } from '@/hooks/useColaboradores'
import CreateTemplateModal from '@/components/Documents/CreateTemplateModal'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function DocumentsPage() {
  const [templates, setTemplates] = useState([])
  const { colaboradores, loading: employeesLoading } = useColaboradores()
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [customVariables, setCustomVariables] = useState({})
  const [customVariablesOrder, setCustomVariablesOrder] = useState([]) // Ordem das variáveis conforme aparecem no template
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [documentosGerados, setDocumentosGerados] = useState([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const isMobile = useIsMobile()

  // Filtrar funcionários baseado na busca
  const filteredEmployees = colaboradores.filter((emp) => {
    if (!employeeSearch) return true
    const searchLower = employeeSearch.toLowerCase()
    return (
      emp.nome?.toLowerCase().includes(searchLower) ||
      emp.cargo?.toLowerCase().includes(searchLower) ||
      emp.departamento?.toLowerCase().includes(searchLower)
    )
  })

  // Variáveis padrão que são preenchidas automaticamente
  const defaultVariables = ['nome', 'cargo', 'departamento', 'data_entrada', 'data']

  // Função para extrair variáveis do template mantendo a ordem de aparição
  const extractVariables = (templateContent) => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = []
    const seen = new Set()
    let match
    
    while ((match = regex.exec(templateContent)) !== null) {
      const varName = match[1]
      // Manter apenas a primeira ocorrência de cada variável para preservar ordem
      if (!seen.has(varName) && !defaultVariables.includes(varName)) {
        matches.push(varName)
        seen.add(varName)
      }
    }
    
    return matches
  }

  // Quando o template mudar, extrair variáveis customizadas
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate)
      if (template) {
        const customVars = extractVariables(template.conteudo)
        const initialValues = {}
        
        // Criar campos para todas as variáveis encontradas no template
        customVars.forEach(v => {
          // Manter o valor existente se já foi preenchido, senão usar vazio
          initialValues[v] = customVariables[v] || ''
        })
        
        // Salvar a ordem das variáveis conforme aparecem no template
        setCustomVariablesOrder(customVars)
        setCustomVariables(initialValues)
      }
    } else {
      setCustomVariables({})
      setCustomVariablesOrder([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, templates])

  useEffect(() => {
    loadTemplates()
    loadDocumentosGerados()
  }, [refreshKey])

  // Carregar documentos gerados
  const loadDocumentosGerados = async () => {
    setLoadingDocumentos(true)
    try {
      const { data, error } = await supabase
        .from('rh_documentos_gerados')
        .select(`
          *,
          rh_documentos_templates (
            id,
            nome,
            codigo
          ),
          rh_colaboradores (
            id,
            nome,
            cargo
          )
        `)
        .order('criado_em', { ascending: false })
        .limit(50)

      if (error) throw error

      // Buscar nomes dos usuários que geraram
      const userIds = [...new Set((data || []).map(d => d.gerado_por).filter(Boolean))]
      const usuariosMap = {}

      if (userIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)

        if (usuarios) {
          usuarios.forEach(u => {
            usuariosMap[u.id] = u.name || 'Usuário desconhecido'
          })
        }
      }

      const documentosProcessados = (data || []).map(doc => ({
        ...doc,
        geradoPorNome: usuariosMap[doc.gerado_por] || 'Usuário desconhecido',
        templateNome: doc.rh_documentos_templates?.nome || 'Template não encontrado',
        funcionarioNome: doc.rh_colaboradores?.nome || 'Funcionário não encontrado',
        funcionarioCargo: doc.rh_colaboradores?.cargo || '',
      }))

      setDocumentosGerados(documentosProcessados)
    } catch (error) {
      console.error('Erro ao carregar documentos gerados:', error)
    } finally {
      setLoadingDocumentos(false)
    }
  }

  // Reutilizar documento gerado
  const reutilizarDocumento = async (documento) => {
    if (!documento.template_id || !documento.colaborador_id) {
      alert('Documento não pode ser reutilizado: informações incompletas')
      return
    }

    // Preencher formulário com os dados do documento
    setSelectedTemplate(documento.template_id)
    setSelectedEmployee(documento.colaborador_id)
    
    // Preencher variáveis customizadas se houver
    // Verificar tanto o formato antigo quanto o novo
    let variaveisSalvas = {}
    if (documento.dados_usados?.variaveis_customizadas) {
      // Formato novo
      variaveisSalvas = documento.dados_usados.variaveis_customizadas
    } else if (documento.dados_usados?.customVariables) {
      // Formato antigo (compatibilidade)
      variaveisSalvas = documento.dados_usados.customVariables
    }
    
    // Buscar o template para obter a ordem correta das variáveis
    const template = templates.find((t) => t.id === documento.template_id)
    if (template) {
      const customVars = extractVariables(template.conteudo)
      const variaveisOrdenadas = {}
      
      // Ordenar as variáveis conforme aparecem no template
      customVars.forEach(v => {
        variaveisOrdenadas[v] = variaveisSalvas[v] || ''
      })
      
      // Salvar a ordem e os valores ordenados
      setCustomVariablesOrder(customVars)
      setCustomVariables(variaveisOrdenadas)
    } else {
      // Se não encontrar o template, usar os dados salvos como estão
      setCustomVariables(variaveisSalvas)
      setCustomVariablesOrder(Object.keys(variaveisSalvas))
    }

    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    alert('Documento carregado! Você pode gerar novamente ou fazer alterações.')
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target
      const dropdown = document.querySelector('[data-employee-dropdown]')
      const input = document.querySelector('[data-employee-input]')
      
      if (dropdown && input && !dropdown.contains(target) && !input.contains(target)) {
        setShowEmployeeDropdown(false)
      }
    }
    if (showEmployeeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmployeeDropdown])

  // Atualizar busca quando funcionário selecionado mudar
  useEffect(() => {
    if (selectedEmployee) {
      const emp = colaboradores.find(e => e.id === selectedEmployee)
      if (emp) {
        setEmployeeSearch(`${emp.nome}${emp.cargo ? ` - ${emp.cargo}` : ''}`)
      }
    } else {
      setEmployeeSearch('')
    }
  }, [selectedEmployee, colaboradores])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('rh_documentos_templates')
        .select('*')
        .eq('ativo', true)

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!selectedTemplate || !selectedEmployee) {
      alert('Selecione um template e um funcionário')
      return
    }

    setGenerating(true)

    try {
      const template = templates.find((t) => t.id === selectedTemplate)
      const employee = colaboradores.find((e) => e.id === selectedEmployee)

      if (!template || !employee) {
        throw new Error('Template ou funcionário não encontrado')
      }

      // Função para formatar data apenas como DD/MM/YYYY
      const formatDateOnly = (date) => {
        if (!date) return ''
        const d = new Date(date)
        if (isNaN(d.getTime())) return ''
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      }

      // Substituir variáveis no conteúdo HTML
      let htmlContent = template.conteudo
      
      // Substituições padrão
      htmlContent = htmlContent.replace(/\{\{nome\}\}/g, employee.nome || '')
      htmlContent = htmlContent.replace(/\{\{cargo\}\}/g, employee.cargo || '')
      htmlContent = htmlContent.replace(/\{\{departamento\}\}/g, employee.departamento || '')
      htmlContent = htmlContent.replace(/\{\{data_entrada\}\}/g, formatDateOnly(employee.data_entrada))
      htmlContent = htmlContent.replace(/\{\{data\}\}/g, formatDateOnly(new Date()))
      
      // Substituir variáveis customizadas
      Object.keys(customVariables).forEach(variable => {
        const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
        htmlContent = htmlContent.replace(regex, customVariables[variable] || '')
      })

      // Criar elemento temporário para renderizar HTML
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm' // A4 width
      tempDiv.style.padding = '20mm'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '12pt'
      tempDiv.style.lineHeight = '1.6'
      tempDiv.style.color = '#000'
      tempDiv.style.backgroundColor = '#fff'
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)

      // Converter HTML para canvas e depois para PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Remover elemento temporário
      document.body.removeChild(tempDiv)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download direto
      pdf.save(`${template.nome}-${employee.nome}.pdf`)

      // Registrar no banco
      const { data: { user } } = await supabase.auth.getUser()
      const fileName = `DOC-${Date.now()}.pdf`
      
      // Preparar dados completos usados na geração
      const dadosCompletos = {
        // Dados do funcionário
        funcionario: {
          nome: employee.nome,
          cargo: employee.cargo,
          departamento: employee.departamento || employee.Departamento,
          data_entrada: employee.data_entrada,
        },
        // Variáveis customizadas preenchidas pelo usuário (sempre salvar, mesmo que vazio)
        variaveis_customizadas: customVariables || {},
        // Template usado
        template_id: selectedTemplate,
        template_nome: template.nome,
        // Data de geração
        data_geracao: new Date().toISOString(),
        // Conteúdo HTML final gerado (para referência)
        html_gerado: htmlContent.substring(0, 500), // Primeiros 500 caracteres para referência
      }
      
      await supabase.from('rh_documentos_gerados').insert({
        template_id: selectedTemplate,
        colaborador_id: selectedEmployee,
        numero: `DOC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        url_pdf: fileName,
        dados_usados: dadosCompletos,
        gerado_por: user?.id,
      })

      alert('Documento gerado com sucesso!')
      
      // Recarregar histórico
      await loadDocumentosGerados()
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar documento: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading || employeesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Gerador de Documentos
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Gere documentos personalizados para funcionários</p>
          </div>
          {!isMobile && (
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Criar Template
            </button>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">
                Funcionário
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    data-employee-input
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value)
                      setShowEmployeeDropdown(true)
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="Buscar funcionário por nome ou cargo..."
                    className="w-full pl-10 pr-10 py-2 text-sm md:text-base bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                
                {showEmployeeDropdown && (
                  <div 
                    data-employee-dropdown
                    className="absolute z-10 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto"
                  >
                    {filteredEmployees.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        Nenhum funcionário encontrado
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(emp.id)
                            setEmployeeSearch(`${emp.nome}${emp.cargo ? ` - ${emp.cargo}` : ''}`)
                            setShowEmployeeDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                            selectedEmployee === emp.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                          }`}
                        >
                          <div className="font-medium">{emp.nome}</div>
                          {emp.cargo && (
                            <div className="text-xs text-muted-foreground">{emp.cargo}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedEmployee && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Selecionado: {colaboradores.find(e => e.id === selectedEmployee)?.nome}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de Documento
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value)
                  setCustomVariables({})
                  setCustomVariablesOrder([])
                }}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              >
                <option value="">Selecione um template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos dinâmicos para variáveis customizadas */}
            {selectedTemplate && customVariablesOrder.length > 0 && (
              <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">
                  Campos Adicionais:
                </h3>
                <div className="space-y-3">
                  {customVariablesOrder.map((variable) => (
                    <div key={variable} className="bg-background rounded-lg p-3 border border-border">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={customVariables[variable] || ''}
                        onChange={(e) => {
                          setCustomVariables(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))
                        }}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                        placeholder={`Digite o valor para ${variable.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={generatePDF}
                disabled={generating || !selectedTemplate || !selectedEmployee}
                className="flex items-center justify-center gap-2 bg-primary text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                {generating ? 'Gerando...' : 'Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Histórico de Documentos Gerados */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Histórico de Documentos Gerados
            </h2>
          </div>
          <button
            onClick={() => {
              setShowHistory(!showHistory)
              if (showHistory) {
                setHistorySearch('')
                setCurrentPage(1)
              }
            }}
            className="text-sm text-primary hover:underline"
          >
            {showHistory ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showHistory && (
          <>
            {/* Campo de busca */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value)
                    setCurrentPage(1) // Resetar para primeira página ao buscar
                  }}
                  placeholder="Buscar por nome do funcionário..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {loadingDocumentos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : (() => {
              // Filtrar documentos por nome do funcionário
              const documentosFiltrados = documentosGerados.filter((doc) => {
                if (!historySearch) return true
                const searchLower = historySearch.toLowerCase()
                return (
                  doc.funcionarioNome?.toLowerCase().includes(searchLower) ||
                  doc.templateNome?.toLowerCase().includes(searchLower) ||
                  doc.funcionarioCargo?.toLowerCase().includes(searchLower)
                )
              })

              // Calcular paginação
              const totalPages = Math.ceil(documentosFiltrados.length / itemsPerPage)
              const startIndex = (currentPage - 1) * itemsPerPage
              const endIndex = startIndex + itemsPerPage
              const documentosPaginados = documentosFiltrados.slice(startIndex, endIndex)

              return documentosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    {historySearch ? 'Nenhum documento encontrado com essa busca' : 'Nenhum documento gerado ainda'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {documentosPaginados.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-foreground">
                                {doc.templateNome}
                              </span>
                              {doc.numero && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {doc.numero}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-foreground">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{doc.funcionarioNome}</span>
                                {doc.funcionarioCargo && (
                                  <span className="text-muted-foreground">- {doc.funcionarioCargo}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(doc.criado_em).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(doc.criado_em).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>Por: {doc.geradoPorNome}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => reutilizarDocumento(doc)}
                              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              title="Reutilizar este documento"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Reutilizar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Controles de paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, documentosFiltrados.length)} de {documentosFiltrados.length} documentos
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-background border border-input rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Mostrar apenas algumas páginas ao redor da página atual
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    currentPage === page
                                      ? 'bg-primary text-white'
                                      : 'bg-background border border-input hover:bg-muted text-foreground'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return <span key={page} className="text-muted-foreground">...</span>
                            }
                            return null
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-background border border-input rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}
      </div>

      {/* Modal de criar template */}
      {showCreateTemplateModal && (
        <CreateTemplateModal
          isOpen={showCreateTemplateModal}
          onClose={() => setShowCreateTemplateModal(false)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1)
            loadTemplates()
          }}
        />
      )}
    </MainLayout>
  )
}

