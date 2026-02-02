import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Filter, Search, Smartphone, Laptop, Phone, TrendingUp, Plus, Building2, User, CheckCircle, ChevronDown, ChevronUp, Package } from 'lucide-react'
import MainLayout from '@/components/shared/MainLayout'
import EquipmentCard from '@/components/Equipamentos/EquipmentCard'
import AssignEquipmentModal from '@/components/Equipamentos/AssignEquipmentModal'
import ReleaseEquipmentModal from '@/components/Equipamentos/ReleaseEquipmentModal'
import CreateEquipmentModal from '@/components/Equipamentos/CreateEquipmentModal'
import { equipamentosService } from '@/services/equipamentos.service'
import { useAuth } from '@/hooks/useAuth'
import { colaboradoresService } from '@/services/colaboradores.service'
import { supabase } from '@/lib/supabase'

export default function EquipamentosPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  
  // Ler estado inicial da URL
  const initialTab = searchParams.get('tab') || 'celulares'
  const initialSearch = searchParams.get('search') || ''
  const initialStatus = searchParams.get('status') || 'todos'
  const initialDepartamento = searchParams.get('departamento') || 'todos'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [equipamentos, setEquipamentos] = useState([])
  const [allEquipamentos, setAllEquipamentos] = useState([]) // Todos os equipamentos para contar por departamento
  const [estatisticas, setEstatisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [departamentoFilter, setDepartamentoFilter] = useState(initialDepartamento)
  const [departamentos, setDepartamentos] = useState([])
  const [expandedDepartamentos, setExpandedDepartamentos] = useState([]) // Departamentos expandidos
  
  // Atualizar URL quando os filtros mudarem
  const updateURLParams = useCallback((newTab, newSearch, newStatus, newDepartamento) => {
    const params = new URLSearchParams()
    if (newTab && newTab !== 'celulares') params.set('tab', newTab)
    if (newSearch) params.set('search', newSearch)
    if (newStatus && newStatus !== 'todos') params.set('status', newStatus)
    if (newDepartamento && newDepartamento !== 'todos') params.set('departamento', newDepartamento)
    setSearchParams(params, { replace: true })
  }, [setSearchParams])
  
  // Modals
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadEquipamentos = useCallback(async () => {
    setLoading(true)
    try {
      const filters = {}
      if (statusFilter !== 'todos') {
        filters.status = statusFilter
      }
      if (departamentoFilter !== 'todos') {
        filters[activeTab === 'celulares' ? 'departamento' : activeTab === 'notebooks' ? 'departamento' : 'centro_custo'] = departamentoFilter
      }

      let data = []
      if (activeTab === 'celulares') {
        data = await equipamentosService.getCelulares(filters)
      } else if (activeTab === 'notebooks') {
        data = await equipamentosService.getNotebooks(filters)
      } else if (activeTab === 'linhas') {
        data = await equipamentosService.getLinhas(filters)
      }

      setEquipamentos(data)
      
      // Carregar todos os equipamentos para contar por departamento
      let allData = []
      if (activeTab === 'celulares') {
        allData = await equipamentosService.getCelulares({})
      } else if (activeTab === 'notebooks') {
        allData = await equipamentosService.getNotebooks({})
      } else if (activeTab === 'linhas') {
        allData = await equipamentosService.getLinhas({})
      }
      setAllEquipamentos(allData)
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, statusFilter, departamentoFilter])

  // Contar equipamentos por departamento
  const getEquipamentosPorDepartamento = useCallback((departamentoNome) => {
    let equipamentosFiltrados = allEquipamentos.filter(eq => {
      let dept = null
      if (activeTab === 'celulares') {
        dept = eq.DPTO
      } else if (activeTab === 'notebooks') {
        dept = eq.Departamento
      } else if (activeTab === 'linhas') {
        dept = eq['Centro de custo']
      }
      return dept === departamentoNome
    })

    // Aplicar filtro de status se houver
    if (statusFilter !== 'todos') {
      equipamentosFiltrados = equipamentosFiltrados.filter(eq => {
        const status = eq.Status?.toLowerCase().trim() || ''
        
        if (statusFilter === 'em_uso') {
          return status === 'em_uso' || status === 'em uso'
        } else if (statusFilter === 'disponivel') {
          return !status || status === 'disponivel' || status === 'disponível'
        } else if (statusFilter === 'manutencao') {
          return status === 'manutencao' || status === 'manutenção'
        } else if (statusFilter === 'indisponivel') {
          return status === 'indisponivel' || status === 'indisponível'
        } else if (statusFilter === 'descarte') {
          return status === 'descarte'
        }
        
        return true
      })
    }

    // Aplicar filtro de busca se houver
    if (search) {
      const searchLower = search.toLowerCase()
      equipamentosFiltrados = equipamentosFiltrados.filter(eq => {
        // Nome do equipamento baseado no tipo
        const nomeEquipamento = activeTab === 'celulares' 
          ? eq.CELULAR 
          : activeTab === 'notebooks' 
          ? `${eq.Marca || ''} ${eq.Modelo || ''}`.trim()
          : eq.NTC

        return (
          (nomeEquipamento?.toLowerCase().includes(searchLower)) ||
          (eq.CELULAR?.toLowerCase().includes(searchLower)) ||
          (eq.Modelo?.toLowerCase().includes(searchLower)) ||
          (eq.Marca?.toLowerCase().includes(searchLower)) ||
          (eq.NTC?.toLowerCase().includes(searchLower)) ||
          (eq['Usuário atual']?.toLowerCase().includes(searchLower)) ||
          (eq['Nº Matricula']?.toLowerCase().includes(searchLower)) ||
          (eq.IMEI?.toLowerCase().includes(searchLower)) ||
          (eq['NºCHIP']?.toLowerCase().includes(searchLower)) ||
          (eq.Empresa?.toLowerCase().includes(searchLower))
        )
      })
    }

    return equipamentosFiltrados
  }, [allEquipamentos, activeTab, statusFilter, search])

  useEffect(() => {
    loadEquipamentos()
    loadEstatisticas()
    loadDepartamentos()
  }, [loadEquipamentos])

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    updateURLParams(activeTab, search, statusFilter, departamentoFilter)
  }, [activeTab, search, statusFilter, departamentoFilter, updateURLParams])

  // Expandir automaticamente departamentos quando houver busca ou filtro de status
  useEffect(() => {
    const temFiltro = (search && search.trim() !== '') || (statusFilter !== 'todos')
    
    if (temFiltro && allEquipamentos.length > 0 && departamentos.length > 0) {
      // Encontrar departamentos que têm equipamentos correspondentes aos filtros
      const departamentosComResultados = departamentos.filter(dept => {
        const equipamentosDept = getEquipamentosPorDepartamento(dept)
        return equipamentosDept.length > 0
      })
      
      // Expandir apenas os departamentos com resultados
      if (departamentosComResultados.length > 0) {
        setExpandedDepartamentos(departamentosComResultados)
      } else {
        // Se não há resultados, colapsar todos
        setExpandedDepartamentos([])
      }
    } else if (!temFiltro) {
      // Quando não há filtros, colapsar todos os departamentos
      setExpandedDepartamentos([])
    }
  }, [search, statusFilter, departamentos, activeTab, allEquipamentos, getEquipamentosPorDepartamento])

  const loadEstatisticas = async () => {
    try {
      const stats = await equipamentosService.getEstatisticas()
      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // Extrair departamentos dos equipamentos carregados
  const getDepartamentosFromEquipamentos = useCallback((equipamentos, tab) => {
    const deptSet = new Set()
    equipamentos.forEach(eq => {
      let dept = null
      if (tab === 'celulares') {
        dept = eq.DPTO
      } else if (tab === 'notebooks') {
        dept = eq.Departamento
      } else if (tab === 'linhas') {
        dept = eq['Centro de custo']
      }
      if (dept && dept.toString().trim() !== '') {
        deptSet.add(dept.toString().trim())
      }
    })
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [])

  // Atualizar departamentos quando equipamentos mudarem
  useEffect(() => {
    if (allEquipamentos.length > 0) {
      const depts = getDepartamentosFromEquipamentos(allEquipamentos, activeTab)
      setDepartamentos(depts)
    }
  }, [allEquipamentos, activeTab, getDepartamentosFromEquipamentos])

  const loadDepartamentos = async () => {
    // Departamentos agora são extraídos dos equipamentos
    // Esta função é mantida para compatibilidade, mas não faz mais nada
  }

  const handleAssign = async (equipment, colaboradorId) => {
    try {
      if (activeTab === 'celulares') {
        await equipamentosService.assignCelular(equipment['Row ID'], colaboradorId, user?.id)
      } else if (activeTab === 'notebooks') {
        await equipamentosService.assignNotebook(equipment['Row ID'], colaboradorId, user?.id)
      } else if (activeTab === 'linhas') {
        await equipamentosService.assignLinha(equipment['Row ID'], colaboradorId, user?.id)
      }
      
      await loadEquipamentos()
      await loadEstatisticas()
      
      // Atualizar lista completa
      let allData = []
      if (activeTab === 'celulares') {
        allData = await equipamentosService.getCelulares({})
      } else if (activeTab === 'notebooks') {
        allData = await equipamentosService.getNotebooks({})
      } else if (activeTab === 'linhas') {
        allData = await equipamentosService.getLinhas({})
      }
      setAllEquipamentos(allData)
      
      alert('Equipamento atribuído com sucesso!')
    } catch (error) {
      console.error('Erro ao atribuir equipamento:', error)
      alert('Erro ao atribuir equipamento')
    }
  }

  const handleRelease = async (equipment, motivo) => {
    try {
      if (activeTab === 'celulares') {
        await equipamentosService.releaseCelular(equipment['Row ID'], motivo, user?.id)
      } else if (activeTab === 'notebooks') {
        await equipamentosService.releaseNotebook(equipment['Row ID'], motivo, user?.id)
      } else if (activeTab === 'linhas') {
        await equipamentosService.releaseLinha(equipment['Row ID'], motivo, user?.id)
      }
      
      await loadEquipamentos()
      await loadEstatisticas()
      
      // Atualizar lista completa
      let allData = []
      if (activeTab === 'celulares') {
        allData = await equipamentosService.getCelulares({})
      } else if (activeTab === 'notebooks') {
        allData = await equipamentosService.getNotebooks({})
      } else if (activeTab === 'linhas') {
        allData = await equipamentosService.getLinhas({})
      }
      setAllEquipamentos(allData)
      
      alert('Equipamento devolvido com sucesso!')
    } catch (error) {
      console.error('Erro ao devolver equipamento:', error)
      alert('Erro ao devolver equipamento')
    }
  }

  const toggleDepartamento = (departamentoNome) => {
    setExpandedDepartamentos(prev => {
      if (prev.includes(departamentoNome)) {
        return prev.filter(d => d !== departamentoNome)
      } else {
        return [...prev, departamentoNome]
      }
    })
  }

  const filteredEquipamentos = equipamentos.filter(eq => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      (eq.CELULAR?.toLowerCase().includes(searchLower)) ||
      (eq.Modelo?.toLowerCase().includes(searchLower)) ||
      (eq.Marca?.toLowerCase().includes(searchLower)) ||
      (eq.NTC?.toLowerCase().includes(searchLower)) ||
      (eq['Usuário atual']?.toLowerCase().includes(searchLower)) ||
      (eq['Nº Matricula']?.toLowerCase().includes(searchLower))
    )
  })

  const tabs = [
    { id: 'celulares', label: 'Celulares', icon: Smartphone },
    { id: 'notebooks', label: 'Notebooks', icon: Laptop },
    { id: 'linhas', label: 'Linhas/Chips', icon: Phone },
  ]

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-gray-800 p-6 rounded-xl border-2 border-primary/20">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Gestão de Equipamentos
            </h1>
            <p className="text-muted-foreground text-base md:text-lg font-medium">
              Gerencie celulares, notebooks e linhas telefônicas de forma eficiente
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-base font-bold shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Criar Equipamento
          </button>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 p-5 hover:border-primary/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Celulares</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{estatisticas.total.celulares}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-semibold">
                      {estatisticas.disponiveis.celulares} disponíveis
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-semibold">
                      {estatisticas.emUso.celulares} em uso
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 p-5 hover:border-green-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Notebooks</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{estatisticas.total.notebooks}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-semibold">
                      {estatisticas.disponiveis.notebooks} disponíveis
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-semibold">
                      {estatisticas.emUso.notebooks} em uso
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Laptop className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 p-5 hover:border-orange-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Linhas</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{estatisticas.total.linhas}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-semibold">
                      {estatisticas.disponiveis.linhas} disponíveis
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-semibold">
                      {estatisticas.emUso.linhas} em uso
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Phone className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSearch('')
                      setStatusFilter('todos')
                      setDepartamentoFilter('todos')
                      setExpandedDepartamentos([])
                    }}
                    className={`flex items-center gap-2 px-6 py-4 border-b-3 font-bold transition-all duration-200 whitespace-nowrap relative ${
                      isActive
                        ? 'border-primary text-primary bg-white dark:bg-gray-800'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                    <span className="text-base">{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-blue-600"></div>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Filters */}
          <div className="p-4 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar equipamentos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground placeholder:text-gray-400 font-medium shadow-sm hover:shadow-md"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 text-base bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground font-medium shadow-sm hover:shadow-md"
                >
                  <option value="todos">Todos os status</option>
                  <option value="em_uso">Em uso</option>
                  <option value="disponivel">Disponível</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="indisponivel">Indisponível</option>
                  <option value="descarte">Descarte</option>
                </select>

                <select
                  value={departamentoFilter}
                  onChange={(e) => setDepartamentoFilter(e.target.value)}
                  className="px-4 py-3 text-base bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground font-medium shadow-sm hover:shadow-md"
                >
                  <option value="todos">Todos os departamentos</option>
                  {departamentos.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Visualização por Departamentos com Accordion */}
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-primary mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                </div>
                <p className="mt-6 text-lg font-semibold text-foreground">Carregando equipamentos...</p>
                <p className="mt-2 text-sm text-muted-foreground">Aguarde um momento</p>
              </div>
            ) : departamentos.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Nenhum departamento encontrado</h3>
                <p className="text-muted-foreground">Não há departamentos cadastrados no momento</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Departamentos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique em um departamento para expandir e visualizar os equipamentos
                  </p>
                </div>
                <div className="space-y-3">
                  {departamentos
                    .filter(dept => {
                      // Se houver busca, mostrar apenas departamentos com equipamentos que correspondem
                      if (search) {
                        const equipamentosDept = getEquipamentosPorDepartamento(dept)
                        return equipamentosDept.length > 0
                      }
                      return true
                    })
                    .map((dept) => {
                    const equipamentosDept = getEquipamentosPorDepartamento(dept)
                    // Contagem total do departamento (sem filtro de busca)
                    const equipamentosTotais = allEquipamentos.filter(eq => {
                      let deptEq = null
                      if (activeTab === 'celulares') {
                        deptEq = eq.DPTO
                      } else if (activeTab === 'notebooks') {
                        deptEq = eq.Departamento
                      } else if (activeTab === 'linhas') {
                        deptEq = eq['Centro de custo']
                      }
                      return deptEq === dept
                    })
                    
                    const disponiveis = equipamentosTotais.filter(eq => {
                      // Disponível baseado apenas no campo Status
                      const status = eq.Status?.toLowerCase().trim() || ''
                      return !status || status === 'disponivel' || status === 'disponível'
                    }).length
                    const emUso = equipamentosTotais.filter(eq => {
                      // Em uso baseado apenas no campo Status
                      const status = eq.Status?.toLowerCase().trim() || ''
                      return status === 'em_uso' || status === 'em uso'
                    }).length
                    const isExpanded = expandedDepartamentos.includes(dept)
                    
                    return (
                      <div
                        key={dept}
                        className={`bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                          isExpanded 
                            ? 'border-primary shadow-lg shadow-primary/10' 
                            : 'border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {/* Header do Departamento - Clicável */}
                        <div
                          onClick={() => toggleDepartamento(dept)}
                          className={`p-5 cursor-pointer transition-all duration-200 relative ${
                            isExpanded 
                              ? 'bg-gradient-to-r from-primary/5 to-primary/10' 
                              : 'hover:bg-primary/5 dark:hover:bg-primary/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-3.5 rounded-xl transition-all duration-200 ${
                                isExpanded 
                                  ? 'bg-primary text-white shadow-md' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                <Building2 className={`w-6 h-6 ${isExpanded ? 'text-white' : 'text-primary'}`} />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-bold text-xl mb-2 transition-colors ${
                                  isExpanded ? 'text-primary' : 'text-foreground'
                                }`}>
                                  {dept}
                                </h3>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Total:</span>
                                    <span className="font-bold text-lg text-foreground bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-md">
                                      {equipamentosDept.length}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Disponíveis:</span>
                                    <span className="font-bold text-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 rounded-md">
                                      {disponiveis}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Em uso:</span>
                                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-md">
                                      {emUso}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}>
                              <ChevronDown className={`w-6 h-6 transition-colors ${
                                isExpanded ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Lista de Equipamentos - Expansível */}
                        {isExpanded && (
                          <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 animate-in slide-in-from-top-2 duration-300">
                            {equipamentosDept.length === 0 ? (
                              <div className="p-8 text-center">
                                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-muted-foreground font-medium">Nenhum equipamento neste departamento</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {equipamentosDept.map((equipment) => {
                                  const typeMap = {
                                    'celulares': 'celular',
                                    'notebooks': 'notebook',
                                    'linhas': 'linha'
                                  }
                                  const equipmentType = typeMap[activeTab] || activeTab
                                  const Icon = typeMap[activeTab] === 'celular' ? Smartphone : typeMap[activeTab] === 'notebook' ? Laptop : Phone
                                  
                                  // Verifica se tem usuário atual (não vazio)
                                  const temUsuario = equipment['Usuário atual'] && equipment['Usuário atual'].toString().trim() !== ''
                                  
                                  const getStatus = () => {
                                    // Sempre seguir o campo Status
                                    if (equipment.Status) {
                                      const statusLower = equipment.Status.toLowerCase().trim()
                                      if (statusLower === 'em_uso' || statusLower === 'em uso') return 'Em uso'
                                      if (statusLower === 'disponivel' || statusLower === 'disponível') return 'Disponível'
                                      if (statusLower === 'manutencao' || statusLower === 'manutenção') return 'Manutenção'
                                      if (statusLower === 'descarte') return 'Descarte'
                                      if (statusLower === 'indisponivel' || statusLower === 'indisponível') return 'Indisponível'
                                      return equipment.Status
                                    }
                                    
                                    // Se não tem campo Status, usar 'Disponível' como padrão
                                    return 'Disponível'
                                  }
                                  
                                  const status = getStatus()
                                  const nomeEquipamento = typeMap[activeTab] === 'celular' 
                                    ? equipment.CELULAR 
                                    : typeMap[activeTab] === 'notebook' 
                                    ? `${equipment.Marca || ''} ${equipment.Modelo || ''}`.trim()
                                    : equipment.NTC
                                  
                                  return (
                                    <div
                                      key={equipment['Row ID']}
                                      className={`p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ${
                                        temUsuario 
                                          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' 
                                          : 'bg-white dark:bg-gray-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-5">
                                        {/* Ícone do tipo */}
                                        <div className={`p-3 rounded-xl shrink-0 transition-all duration-200 ${
                                          temUsuario 
                                            ? 'bg-blue-100 dark:bg-blue-900/30 shadow-md' 
                                            : 'bg-gray-100 dark:bg-gray-700'
                                        }`}>
                                          <Icon className={`w-6 h-6 ${
                                            temUsuario 
                                              ? 'text-blue-600 dark:text-blue-400' 
                                              : 'text-gray-500 dark:text-gray-400'
                                          }`} />
                                        </div>
                                        
                                        {/* Informações principais */}
                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                          {/* Nome da pessoa (destacado se tiver) */}
                                          <div className="min-w-0">
                                            {temUsuario ? (
                                              <>
                                                <div className="flex items-center gap-2.5 mb-2">
                                                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                  </div>
                                                  <span className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                                                    {equipment['Usuário atual']}
                                                  </span>
                                                </div>
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate ml-8">
                                                  {nomeEquipamento || 'Sem nome'}
                                                </div>
                                              </>
                                            ) : (
                                              <div className="text-base font-bold text-gray-700 dark:text-gray-300 truncate">
                                                {nomeEquipamento || 'Sem nome'}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Informações adicionais */}
                                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            {typeMap[activeTab] === 'celular' && equipment.Modelo && (
                                              <div className="truncate">
                                                <span className="font-medium">Modelo:</span> {equipment.Modelo}
                                              </div>
                                            )}
                                            {typeMap[activeTab] === 'notebook' && equipment['Nº Matricula'] && (
                                              <div className="truncate">
                                                <span className="font-medium">Patrimônio:</span> {equipment['Nº Matricula']}
                                              </div>
                                            )}
                                            {typeMap[activeTab] === 'linha' && equipment.Empresa && (
                                              <div className="truncate font-medium">{equipment.Empresa}</div>
                                            )}
                                            {typeMap[activeTab] === 'celular' && equipment.IMEI && (
                                              <div className="text-xs truncate text-gray-500 dark:text-gray-500">
                                                IMEI: {equipment.IMEI}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Status e ações */}
                                          <div className="flex items-center gap-3 justify-end flex-wrap">
                                            {status === 'Em uso' ? (
                                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md shrink-0">
                                                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                                                <span className="text-sm font-bold">EM USO</span>
                                              </div>
                                            ) : status === 'Disponível' ? (
                                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md shrink-0">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-sm font-bold">DISPONÍVEL</span>
                                              </div>
                                            ) : (
                                              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shrink-0 ${
                                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                              }`}>
                                                {status}
                                              </span>
                                            )}
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => {
                                                  const equipId = encodeURIComponent(equipment['Row ID'])
                                                  // Passar parâmetros de retorno na URL
                                                  const returnParams = new URLSearchParams()
                                                  returnParams.set('tab', activeTab)
                                                  if (search) returnParams.set('search', search)
                                                  if (statusFilter !== 'todos') returnParams.set('status', statusFilter)
                                                  if (departamentoFilter !== 'todos') returnParams.set('departamento', departamentoFilter)
                                                  navigate(`/equipamentos/${equipmentType}/${equipId}?returnTo=${encodeURIComponent(returnParams.toString())}`)
                                                }}
                                                className="px-4 py-2 text-sm font-bold text-primary border-2 border-primary rounded-lg hover:bg-primary/10 hover:shadow-md transition-all duration-200"
                                              >
                                                Ver
                                              </button>
                                              {temUsuario ? (
                                                <button
                                                  onClick={() => {
                                                    setSelectedEquipment(equipment)
                                                    setShowReleaseModal(true)
                                                  }}
                                                  className="px-4 py-2 text-sm font-bold text-orange-600 dark:text-orange-400 border-2 border-orange-500 dark:border-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:shadow-md transition-all duration-200"
                                                >
                                                  Devolver
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    setSelectedEquipment(equipment)
                                                    setShowAssignModal(true)
                                                  }}
                                                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                                                >
                                                  Atribuir
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {selectedEquipment && (
          <>
            <AssignEquipmentModal
              equipment={selectedEquipment}
              type={activeTab === 'celulares' ? 'celular' : activeTab === 'notebooks' ? 'notebook' : 'linha'}
              isOpen={showAssignModal}
              onClose={() => {
                setShowAssignModal(false)
                setSelectedEquipment(null)
              }}
              onAssign={handleAssign}
            />
            <ReleaseEquipmentModal
              equipment={selectedEquipment}
              type={activeTab === 'celulares' ? 'celular' : activeTab === 'notebooks' ? 'notebook' : 'linha'}
              isOpen={showReleaseModal}
              onClose={() => {
                setShowReleaseModal(false)
                setSelectedEquipment(null)
              }}
              onRelease={handleRelease}
            />
          </>
        )}

        <CreateEquipmentModal
          tipoEquipamento={activeTab === 'celulares' ? 'celular' : activeTab === 'notebooks' ? 'notebook' : 'linha'}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false)
            await loadEquipamentos()
            await loadEstatisticas()
            
            // Atualizar lista completa
            let allData = []
            if (activeTab === 'celulares') {
              allData = await equipamentosService.getCelulares({})
            } else if (activeTab === 'notebooks') {
              allData = await equipamentosService.getNotebooks({})
            } else if (activeTab === 'linhas') {
              allData = await equipamentosService.getLinhas({})
            }
            setAllEquipamentos(allData)
          }}
        />
      </div>
    </MainLayout>
  )
}

