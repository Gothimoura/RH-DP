import { useState, useEffect } from 'react'
import { X, User, Briefcase, Building2, Calendar, Image, Save, Loader2, Upload, Trash2, Smartphone, Laptop, Phone, Package, Check, Hash } from 'lucide-react'
import { colaboradoresService } from '@/services/colaboradores.service'
import { equipamentosService } from '@/services/equipamentos.service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRef } from 'react'

export default function CreateColaboradorModal({ isOpen, onClose, onSuccess, editingColaborador = null }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [cargo, setCargo] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0])
  const [etapaId, setEtapaId] = useState('')
  const [foto, setFoto] = useState('')
  const [fotoPreview, setFotoPreview] = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [validandoMatricula, setValidandoMatricula] = useState(false)
  const [matriculaExiste, setMatriculaExiste] = useState(false)
  const [departamentos, setDepartamentos] = useState([])
  const [etapas, setEtapas] = useState([])
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState({
    celulares: [],
    notebooks: [],
    linhas: []
  })
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState({
    celulares: [],
    notebooks: [],
    linhas: []
  })
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadDepartamentos()
      loadEtapas()
      
      if (editingColaborador) {
        setNome(editingColaborador.Nome || '')
        setMatricula(editingColaborador.matricula || editingColaborador.Matricula || '')
        setCargo(editingColaborador.Cargo || '')
        setDepartamento(editingColaborador.Departamento || '')
        setDataEntrada(editingColaborador['Data Entrada'] || new Date().toISOString().split('T')[0])
        setEtapaId(editingColaborador['Etapa id'] || '')
        setFoto(editingColaborador.Foto || '')
        setFotoPreview(editingColaborador.Foto || '')
        setFotoFile(null)
        setMatriculaExiste(false)
      } else {
        resetForm()
      }
      setError('')
    }
  }, [isOpen, editingColaborador])

  // Carregar equipamentos quando o departamento mudar (apenas se houver departamento selecionado)
  useEffect(() => {
    if (isOpen && departamento) {
      loadEquipamentosDisponiveis(departamento)
      // Limpar seleções quando mudar departamento
      setEquipamentosSelecionados({
        celulares: [],
        notebooks: [],
        linhas: []
      })
    } else if (isOpen && !departamento) {
      // Limpar equipamentos quando não houver departamento
      setEquipamentosDisponiveis({
        celulares: [],
        notebooks: [],
        linhas: []
      })
      setEquipamentosSelecionados({
        celulares: [],
        notebooks: [],
        linhas: []
      })
    }
  }, [departamento, isOpen])

  const resetForm = () => {
    setNome('')
    setMatricula('')
    setCargo('')
    setDepartamento('')
    setDataEntrada(new Date().toISOString().split('T')[0])
    setEtapaId('')
    setFoto('')
    setFotoPreview('')
    setFotoFile(null)
    setMatriculaExiste(false)
    setEquipamentosSelecionados({
      celulares: [],
      notebooks: [],
      linhas: []
    })
  }

  const validarMatricula = async (matriculaValue) => {
    if (!matriculaValue || !matriculaValue.trim()) {
      setMatriculaExiste(false)
      return true
    }

    // Se estiver editando, não validar contra o próprio registro
    if (editingColaborador) {
      return true
    }

    setValidandoMatricula(true)
    try {
      const { data, error } = await supabase
        .from('rh_colaboradores')
        .select('id, matricula')
        .eq('matricula', matriculaValue.trim())
        .maybeSingle()

      if (error) {
        console.error('Erro ao validar matrícula:', error)
        setValidandoMatricula(false)
        return true // Em caso de erro, permitir continuar
      }

      const existe = data !== null && data !== undefined
      setMatriculaExiste(existe)
      setValidandoMatricula(false)
      return !existe
    } catch (err) {
      console.error('Erro ao validar matrícula:', err)
      setValidandoMatricula(false)
      return true // Em caso de erro, permitir continuar
    }
  }

  const handleMatriculaChange = async (e) => {
    const valor = e.target.value
    setMatricula(valor)
    
    if (valor.trim()) {
      await validarMatricula(valor)
    } else {
      setMatriculaExiste(false)
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

  const loadEtapas = async () => {
    try {
      // Buscar todas as etapas, ordenadas por tipo e depois por nome
      // Isso garante que as etapas apareçam na mesma ordem que no kanban
      const { data } = await supabase
        .from('rh_etapas')
        .select('id, tipo, nome')
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true })
      
      if (data) {
        setEtapas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error)
    }
  }

  const loadEquipamentosDisponiveis = async (departamentoSelecionado = '') => {
    setLoadingEquipamentos(true)
    try {
      // Preparar filtros baseados no departamento selecionado
      const filtersCelulares = {}
      const filtersNotebooks = {}
      const filtersLinhas = {}
      
      if (departamentoSelecionado) {
        filtersCelulares.departamento = departamentoSelecionado
        filtersNotebooks.departamento = departamentoSelecionado
        filtersLinhas.centro_custo = departamentoSelecionado
      }

      // Buscar equipamentos com filtro de departamento
      const [celulares, notebooks, linhas] = await Promise.all([
        equipamentosService.getCelulares(filtersCelulares),
        equipamentosService.getNotebooks(filtersNotebooks),
        equipamentosService.getLinhas(filtersLinhas)
      ])

      // Filtrar equipamentos disponíveis (status vazio, "disponivel" ou "disponível")
      const estaDisponivel = (eq) => {
        const status = eq.Status?.toLowerCase().trim() || ''
        return !status || status === 'disponivel' || status === 'disponível'
      }

      setEquipamentosDisponiveis({
        celulares: celulares.filter(estaDisponivel).slice(0, 10),
        notebooks: notebooks.filter(estaDisponivel).slice(0, 10),
        linhas: linhas.filter(estaDisponivel).slice(0, 10)
      })
    } catch (error) {
      console.error('Erro ao carregar equipamentos disponíveis:', error)
    } finally {
      setLoadingEquipamentos(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    setFotoFile(file)
    setError('')

    const reader = new FileReader()
    reader.onloadend = () => {
      setFotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setFotoFile(null)
    setFotoPreview('')
    setFoto('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadPhoto = async (file) => {
    if (!file) return null

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `colaborador-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Bucket de armazenamento não configurado.')
        }
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload da foto:', err)
      throw new Error('Erro ao fazer upload da foto: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const toggleEquipamento = (tipo, equipamento) => {
    setEquipamentosSelecionados(prev => {
      const listaAtual = prev[tipo] || []
      const existe = listaAtual.some(eq => eq['Row ID'] === equipamento['Row ID'])
      
      if (existe) {
        // Remover da seleção
        return {
          ...prev,
          [tipo]: listaAtual.filter(eq => eq['Row ID'] !== equipamento['Row ID'])
        }
      } else {
        // Adicionar à seleção
        return {
          ...prev,
          [tipo]: [...listaAtual, equipamento]
        }
      }
    })
  }

  const isEquipamentoSelecionado = (tipo, equipamento) => {
    return equipamentosSelecionados[tipo]?.some(eq => eq['Row ID'] === equipamento['Row ID']) || false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    // Validar matrícula antes de salvar
    if (matricula.trim()) {
      const matriculaValida = await validarMatricula(matricula)
      if (!matriculaValida) {
        setError('Esta matrícula já está cadastrada. Por favor, verifique e tente novamente.')
        return
      }
    }

    setSaving(true)
    try {
      const colaboradorData = {
        Nome: nome.trim(),
        matricula: matricula.trim() || null,
        Cargo: cargo.trim() || null,
        Departamento: departamento || null,
        'Data Entrada': dataEntrada || null,
        'Etapa id': etapaId || null,
      }

      // Upload da foto se houver arquivo selecionado
      if (fotoFile) {
        const photoUrl = await uploadPhoto(fotoFile)
        if (photoUrl) {
          colaboradorData.Foto = photoUrl
        }
      } else if (foto.trim()) {
        colaboradorData.Foto = foto.trim()
      }

      let colaboradorId = null
      let colaboradorCriado = null

      if (editingColaborador) {
        // Atualizar colaborador existente
        colaboradorCriado = await colaboradoresService.update(editingColaborador.ID, colaboradorData)
        colaboradorId = colaboradorCriado.id || editingColaborador.ID
      } else {
        // Gerar ID único para novo colaborador
        const newId = `COL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        colaboradorData.ID = newId
        
        colaboradorCriado = await colaboradoresService.create(colaboradorData)
        colaboradorId = colaboradorCriado.id || newId
      }

      // Atribuir equipamentos selecionados ao colaborador
      if (colaboradorId && user?.id) {
        try {
          // Atribuir celulares selecionados
          for (const celular of equipamentosSelecionados.celulares) {
            try {
              await equipamentosService.assignCelular(celular['Row ID'], colaboradorId, user.id)
            } catch (err) {
              console.error('Erro ao atribuir celular:', err)
            }
          }

          // Atribuir notebooks selecionados
          for (const notebook of equipamentosSelecionados.notebooks) {
            try {
              await equipamentosService.assignNotebook(notebook['Row ID'], colaboradorId, user.id)
            } catch (err) {
              console.error('Erro ao atribuir notebook:', err)
            }
          }

          // Atribuir linhas selecionadas
          for (const linha of equipamentosSelecionados.linhas) {
            try {
              await equipamentosService.assignLinha(linha['Row ID'], colaboradorId, user.id)
            } catch (err) {
              console.error('Erro ao atribuir linha:', err)
            }
          }
        } catch (err) {
          console.error('Erro ao atribuir equipamentos:', err)
          // Não bloquear o salvamento se houver erro na atribuição
        }
      }

      resetForm()
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err)
      setError(err.message || 'Erro ao salvar colaborador. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {editingColaborador ? 'Editar Funcionário' : 'Criar Funcionário'}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                {editingColaborador ? 'Edite as informações do funcionário' : 'Adicione um novo funcionário ao sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={saving || uploadingPhoto}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 bg-background dark:bg-gray-800 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Nome completo do funcionário"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                Matrícula
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={matricula}
                  onChange={handleMatriculaChange}
                  className={`w-full px-3 py-2 bg-background dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground ${
                    matriculaExiste 
                      ? 'border-destructive dark:border-destructive' 
                      : 'border-border'
                  }`}
                  placeholder="Número da matrícula"
                />
                {validandoMatricula && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {matriculaExiste && !validandoMatricula && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                )}
              </div>
              {matriculaExiste && !validandoMatricula && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Esta matrícula já está cadastrada
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Cargo
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-2 bg-background dark:bg-gray-800 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Ex: Desenvolvedor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Departamento
              </label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full px-3 py-2 bg-background dark:bg-gray-800 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
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
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data de Entrada
              </label>
              <input
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                className="w-full px-3 py-2 bg-background dark:bg-gray-800 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Etapa
              </label>
              <select
                value={etapaId}
                onChange={(e) => setEtapaId(e.target.value)}
                className="w-full px-3 py-2 bg-background dark:bg-gray-800 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              >
                <option value="">Selecione uma etapa</option>
                {etapas.map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.nome} {etapa.tipo ? `(${etapa.tipo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                Foto
              </label>
              
              {(fotoPreview || foto) && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={fotoPreview || foto}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                  {fotoFile && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={uploadingPhoto || saving}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {fotoFile ? fotoFile.name : 'Selecionar foto'}
                    </span>
                  </div>
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>
            </div>
          </div>

          {/* Equipamentos Disponíveis */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Package className="w-4 h-4 inline mr-1" />
              Equipamentos Disponíveis
            </label>
            {!departamento ? (
              <div className="bg-muted/50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-border p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Selecione um departamento
                </p>
                <p className="text-xs text-muted-foreground">
                  Escolha um departamento para visualizar os equipamentos disponíveis
                </p>
              </div>
            ) : loadingEquipamentos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando equipamentos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Celulares */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-foreground">Celulares</h3>
                    <span className="ml-auto px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      {equipamentosDisponiveis.celulares.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {equipamentosDisponiveis.celulares.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum celular disponível</p>
                    ) : (
                      equipamentosDisponiveis.celulares.map((celular) => {
                        const selecionado = isEquipamentoSelecionado('celulares', celular)
                        return (
                          <div
                            key={celular['Row ID']}
                            onClick={() => toggleEquipamento('celulares', celular)}
                            className={`bg-white dark:bg-gray-800 rounded p-2 text-xs border-2 cursor-pointer transition-all duration-200 ${
                              selecionado
                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                                : 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`flex-1 ${selecionado ? 'font-bold' : 'font-semibold'} text-foreground truncate`}>
                                {celular.CELULAR || 'Sem nome'}
                              </div>
                              {selecionado && (
                                <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                              )}
                            </div>
                            {celular.Modelo && (
                              <div className="text-muted-foreground truncate mt-1">{celular.Modelo}</div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Notebooks */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Laptop className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-foreground">Notebooks</h3>
                    <span className="ml-auto px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      {equipamentosDisponiveis.notebooks.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {equipamentosDisponiveis.notebooks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum notebook disponível</p>
                    ) : (
                      equipamentosDisponiveis.notebooks.map((notebook) => {
                        const selecionado = isEquipamentoSelecionado('notebooks', notebook)
                        return (
                          <div
                            key={notebook['Row ID']}
                            onClick={() => toggleEquipamento('notebooks', notebook)}
                            className={`bg-white dark:bg-gray-800 rounded p-2 text-xs border-2 cursor-pointer transition-all duration-200 ${
                              selecionado
                                ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 shadow-md'
                                : 'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`flex-1 ${selecionado ? 'font-bold' : 'font-semibold'} text-foreground truncate`}>
                                {notebook.Marca && notebook.Modelo 
                                  ? `${notebook.Marca} ${notebook.Modelo}`.trim()
                                  : notebook.Modelo || 'Sem nome'}
                              </div>
                              {selecionado && (
                                <Check className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />
                              )}
                            </div>
                            {notebook['Nº Matricula'] && (
                              <div className="text-muted-foreground truncate mt-1">Patrimônio: {notebook['Nº Matricula']}</div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Linhas */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border-2 border-orange-200 dark:border-orange-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-foreground">Linhas</h3>
                    <span className="ml-auto px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {equipamentosDisponiveis.linhas.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {equipamentosDisponiveis.linhas.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma linha disponível</p>
                    ) : (
                      equipamentosDisponiveis.linhas.map((linha) => {
                        const selecionado = isEquipamentoSelecionado('linhas', linha)
                        return (
                          <div
                            key={linha['Row ID']}
                            onClick={() => toggleEquipamento('linhas', linha)}
                            className={`bg-white dark:bg-gray-800 rounded p-2 text-xs border-2 cursor-pointer transition-all duration-200 ${
                              selecionado
                                ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-md'
                                : 'border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`flex-1 ${selecionado ? 'font-bold' : 'font-semibold'} text-foreground truncate`}>
                                {linha.NTC || 'Sem nome'}
                              </div>
                              {selecionado && (
                                <Check className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0" />
                              )}
                            </div>
                            {linha.Empresa && (
                              <div className="text-muted-foreground truncate mt-1">{linha.Empresa}</div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
            {departamento && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Mostrando até 10 equipamentos disponíveis do departamento "{departamento}". Clique nos equipamentos para selecioná-los.
                </p>
                {(equipamentosSelecionados.celulares.length > 0 || 
                  equipamentosSelecionados.notebooks.length > 0 || 
                  equipamentosSelecionados.linhas.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {equipamentosSelecionados.celulares.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                        {equipamentosSelecionados.celulares.length} celular{equipamentosSelecionados.celulares.length > 1 ? 'es' : ''} selecionado{equipamentosSelecionados.celulares.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {equipamentosSelecionados.notebooks.length > 0 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                        {equipamentosSelecionados.notebooks.length} notebook{equipamentosSelecionados.notebooks.length > 1 ? 's' : ''} selecionado{equipamentosSelecionados.notebooks.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {equipamentosSelecionados.linhas.length > 0 && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full">
                        {equipamentosSelecionados.linhas.length} linha{equipamentosSelecionados.linhas.length > 1 ? 's' : ''} selecionada{equipamentosSelecionados.linhas.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={saving || uploadingPhoto}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={saving || uploadingPhoto}
            >
              {(saving || uploadingPhoto) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingPhoto ? 'Enviando foto...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingColaborador ? 'Salvar Alterações' : 'Criar Funcionário'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

