import { useState, useEffect } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import { Users, Plus, Search, Edit2, Eye, List, Grid } from 'lucide-react'
import { useColaboradores } from '@/hooks/useColaboradores'
import CreateColaboradorModal from '@/components/Colaboradores/CreateColaboradorModal'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ColaboradoresPage() {
  const { colaboradores, loading, refetch } = useColaboradores()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartamento, setFilterDepartamento] = useState('')
  const [departamentos, setDepartamentos] = useState([])
  const [viewMode, setViewMode] = useState('list') // 'grid' ou 'list'
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  useEffect(() => {
    loadDepartamentos()
  }, [])

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

  const filteredColaboradores = colaboradores.filter((colab) => {
    const matchesSearch = !searchTerm || 
      colab.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colab.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDept = !filterDepartamento || colab.departamento === filterDepartamento
    
    return matchesSearch && matchesDept
  })

  const handleEdit = (colaborador) => {
    setEditingColaborador(colaborador)
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingColaborador(null)
  }

  const handleSuccess = () => {
    refetch()
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Funcionários
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Gerencie todos os funcionários da empresa
            </p>
          </div>
          {!isMobile && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Criar Funcionário
            </button>
          )}
        </div>

        {/* Filtros e Busca */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterDepartamento}
                onChange={(e) => setFilterDepartamento(e.target.value)}
                className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              >
                <option value="">Todos os departamentos</option>
                {departamentos.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {/* Botões de visualização */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Visualização em Quadro"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Visualização em Lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Funcionários */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando funcionários...</p>
            </div>
          </div>
        ) : filteredColaboradores.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || filterDepartamento ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterDepartamento 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando seu primeiro funcionário'}
            </p>
            {!searchTerm && !filterDepartamento && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Criar Funcionário
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Visualização em Quadro */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredColaboradores.map((colab) => (
              <div
                key={colab.id}
                className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {colab.foto_url ? (
                    <img
                      src={colab.foto_url}
                      alt={colab.nome}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {colab.nome || 'Sem nome'}
                    </h3>
                    {colab.cargo && (
                      <p className="text-sm text-muted-foreground truncate">
                        {colab.cargo}
                      </p>
                    )}
                    {colab.departamento && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {colab.departamento}
                      </p>
                    )}
                    {colab.data_entrada && (
                      <p className="text-xs text-muted-foreground">
                        Entrada: {new Date(colab.data_entrada).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => navigate(`/funcionarios/${colab.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                    title="Ver Detalhes"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(colab)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Visualização em Lista */
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {filteredColaboradores.map((colab) => (
                <div
                  key={colab.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {colab.foto_url ? (
                      <img
                        src={colab.foto_url}
                        alt={colab.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {colab.nome || 'Sem nome'}
                        </h3>
                        {colab.cargo && (
                          <p className="text-sm text-muted-foreground truncate">
                            {colab.cargo}
                          </p>
                        )}
                      </div>
                      {colab.departamento && (
                        <div className="text-sm text-muted-foreground truncate">
                          <span className="font-medium">Departamento:</span> {colab.departamento}
                        </div>
                      )}
                      {colab.data_entrada && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Entrada:</span> {new Date(colab.data_entrada).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/funcionarios/${colab.id}`)}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleEdit(colab)}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estatísticas */}
        {!loading && colaboradores.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{filteredColaboradores.length}</span> funcionário(s)
              {filteredColaboradores.length !== colaboradores.length && (
                <span className="ml-2">
                  (de {colaboradores.length} total)
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Modal de criar/editar funcionário */}
      {showCreateModal && (
        <CreateColaboradorModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          editingColaborador={editingColaborador}
        />
      )}
    </MainLayout>
  )
}

