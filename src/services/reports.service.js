import { supabase } from '@/lib/supabase'

export class ReportsService {
  constructor() {
    this.supabase = supabase
  }

  // Relatório de Funcionários
  async getFuncionariosReport(filters = {}) {
    let query = this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('*')

    if (filters.departamento) {
      query = query.eq('departamento', filters.departamento)
    }

    if (filters.cargo) {
      query = query.eq('cargo', filters.cargo)
    }

    const { data, error } = await query.order('nome')

    if (error) throw error
    return data || []
  }

  // Relatório de Equipamentos
  async getEquipamentosReport(tipo, filters = {}) {
    let query
    if (tipo === 'celulares') {
      query = this.supabase.from('vw_rh_celulares').select('*')
      if (filters.status) query = query.eq('Status', filters.status)
      if (filters.departamento) query = query.eq('DPTO', filters.departamento)
      query = query.order('CELULAR', { ascending: true })
    } else if (tipo === 'notebooks') {
      query = this.supabase.from('vw_rh_notebooks').select('*')
      if (filters.status) query = query.eq('Status', filters.status)
      if (filters.departamento) query = query.eq('Departamento', filters.departamento)
      query = query.order('Modelo', { ascending: true })
    } else if (tipo === 'linhas') {
      query = this.supabase.from('vw_rh_linhas_telefonicas').select('*')
      if (filters.status) query = query.eq('Status', filters.status)
      if (filters.centro_custo) query = query.eq('Centro de custo', filters.centro_custo)
      query = query.order('NTC', { ascending: true })
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Relatório de Onboarding
  async getOnboardingReport(tipoProcesso = 'entrada', filters = {}) {
    let query = this.supabase
      .from('rh_kanban_cartoes')
      .select(`
        id, colaborador_id, coluna, posicao, data_inicio, data_prevista, tem_notebook, tem_celular, tem_acessos, prioridade, observacoes, responsavel_id, criado_em, atualizado_em,
        rh_colaboradores (
          nome,
          cargo,
          departamento_id
        )
      `)

    // Filtrar por tipo de processo
    const colunasEntrada = ['novo', 'documentacao', 'config_ti', 'pronto']
    const colunasSaida = ['solicitado', 'devolucao_equipamentos', 'bloqueio_acessos', 'finalizado']
    
    if (tipoProcesso === 'entrada') {
      query = query.in('coluna', colunasEntrada)
    } else {
      query = query.in('coluna', colunasSaida)
    }

    if (filters.coluna) {
      query = query.eq('coluna', filters.coluna)
    }

    if (filters.prioridade) {
      query = query.eq('prioridade', filters.prioridade)
    }

    const { data, error } = await query.order('data_inicio', { ascending: false })

    if (error) {
      console.error('Erro na query de onboarding:', error)
      // Se o join falhar, tentar buscar sem join
      if (error.message && (error.message.includes('foreign key') || error.message.includes('does not exist'))) {
        return this.getOnboardingReportWithoutJoin(tipoProcesso, filters)
      }
      throw error
    }
    return data || []
  }

  // Fallback: buscar onboarding sem join
  async getOnboardingReportWithoutJoin(tipoProcesso = 'entrada', filters = {}) {
    let query = this.supabase
      .from('rh_kanban_cartoes')
      .select('id, colaborador_id, coluna, posicao, data_inicio, data_prevista, tem_notebook, tem_celular, tem_acessos, prioridade, observacoes, responsavel_id, criado_em, atualizado_em')

    const colunasEntrada = ['novo', 'documentacao', 'config_ti', 'pronto']
    const colunasSaida = ['solicitado', 'devolucao_equipamentos', 'bloqueio_acessos', 'finalizado']
    
    if (tipoProcesso === 'entrada') {
      query = query.in('coluna', colunasEntrada)
    } else {
      query = query.in('coluna', colunasSaida)
    }

    if (filters.coluna) {
      query = query.eq('coluna', filters.coluna)
    }

    if (filters.prioridade) {
      query = query.eq('prioridade', filters.prioridade)
    }

    const { data: cartoes, error } = await query.order('data_inicio', { ascending: false })

    if (error) throw error

    if (!cartoes || cartoes.length === 0) return []

    // Buscar colaboradores separadamente
    const colaboradorIds = [...new Set(cartoes.map(c => c.colaborador_id).filter(Boolean))]
    
    if (colaboradorIds.length > 0) {
      const { data: colaboradores } = await this.supabase
        .from('rh_colaboradores')
        .select('id, nome, cargo, departamento_id')
        .in('id', colaboradorIds)

      // Mapear colaboradores aos cartões
      const colaboradoresMap = {}
      if (colaboradores) {
        colaboradores.forEach(c => {
          colaboradoresMap[c.id] = { nome: c.nome, cargo: c.cargo, departamento_id: c.departamento_id }
        })
      }

      return cartoes.map(cartao => ({
        ...cartao,
        rh_colaboradores: cartao.colaborador_id ? colaboradoresMap[cartao.colaborador_id] : null
      }))
    }

    return cartoes.map(cartao => ({
      ...cartao,
      rh_colaboradores: null
    }))
  }

  // Relatório de Calendário
  async getCalendarioReport(filters = {}) {
    let query = this.supabase
      .from('rh_calendario_eventos')
      .select(`
        *,
        rh_colaboradores (
          nome,
          cargo
        )
      `)

    if (filters.data_inicio && filters.data_fim) {
      query = query
        .gte('data_evento', filters.data_inicio)
        .lte('data_evento', filters.data_fim)
    }

    if (filters.tipo_evento) {
      query = query.eq('tipo_evento', filters.tipo_evento)
    }

    if (filters.departamento) {
      query = query.eq('departamento_id', filters.departamento)
    }

    const { data, error } = await query.order('data_evento', { ascending: true })

    if (error) {
      console.error('Erro na query de calendário:', error)
      // Se o join falhar, tentar buscar sem join
      if (error.message && error.message.includes('foreign key')) {
        return this.getCalendarioReportWithoutJoin(filters)
      }
      throw error
    }
    return data || []
  }

  // Fallback: buscar eventos sem join e adicionar dados do colaborador separadamente
  async getCalendarioReportWithoutJoin(filters = {}) {
    let query = this.supabase
      .from('rh_calendario_eventos')
      .select('*')

    if (filters.data_inicio && filters.data_fim) {
      query = query
        .gte('data_evento', filters.data_inicio)
        .lte('data_evento', filters.data_fim)
    }

    if (filters.tipo_evento) {
      query = query.eq('tipo_evento', filters.tipo_evento)
    }

    if (filters.departamento) {
      query = query.eq('departamento_id', filters.departamento)
    }

    const { data: eventos, error } = await query.order('data_evento', { ascending: true })

    if (error) throw error

    if (!eventos || eventos.length === 0) return []

    // Buscar colaboradores separadamente
    const colaboradorIds = [...new Set(eventos.map(e => e.colaborador_id).filter(Boolean))]
    
    if (colaboradorIds.length > 0) {
      const { data: colaboradores } = await this.supabase
        .from('rh_colaboradores')
        .select('id, nome, cargo')
        .in('id', colaboradorIds)

      // Mapear colaboradores aos eventos
      const colaboradoresMap = {}
      if (colaboradores) {
        colaboradores.forEach(c => {
          colaboradoresMap[c.id] = { nome: c.nome, cargo: c.cargo }
        })
      }

      return eventos.map(evento => ({
        ...evento,
        rh_colaboradores: evento.colaborador_id ? colaboradoresMap[evento.colaborador_id] : null
      }))
    }

    return eventos.map(evento => ({
      ...evento,
      rh_colaboradores: null
    }))
  }

  // Relatório de Ações Rápidas
  async getAcoesRapidasReport(filters = {}) {
    let query = this.supabase
      .from('rh_acoes_rapidas')
      .select(`
        *,
        rh_colaboradores (
          nome,
          cargo
        )
      `)

    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters.data_inicio && filters.data_fim) {
      query = query
        .gte('criado_em', filters.data_inicio)
        .lte('criado_em', filters.data_fim)
    }

    const { data, error } = await query.order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro na query de ações rápidas:', error)
      // Se o join falhar, tentar buscar sem join
      if (error.message && error.message.includes('foreign key')) {
        return this.getAcoesRapidasReportWithoutJoin(filters)
      }
      throw error
    }
    return data || []
  }

  // Fallback: buscar ações rápidas sem join e adicionar dados do colaborador separadamente
  async getAcoesRapidasReportWithoutJoin(filters = {}) {
    let query = this.supabase
      .from('rh_acoes_rapidas')
      .select('*')

    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters.data_inicio && filters.data_fim) {
      query = query
        .gte('criado_em', filters.data_inicio)
        .lte('criado_em', filters.data_fim)
    }

    const { data: acoes, error } = await query.order('criado_em', { ascending: false })

    if (error) throw error

    if (!acoes || acoes.length === 0) return []

    // Buscar colaboradores separadamente
    const colaboradorIds = [...new Set(acoes.map(a => a.colaborador_id).filter(Boolean))]
    
    if (colaboradorIds.length > 0) {
      const { data: colaboradores } = await this.supabase
        .from('rh_colaboradores')
        .select('id, nome, cargo')
        .in('id', colaboradorIds)

      // Mapear colaboradores às ações
      const colaboradoresMap = {}
      if (colaboradores) {
        colaboradores.forEach(c => {
          colaboradoresMap[c.id] = { nome: c.nome, cargo: c.cargo }
        })
      }

      return acoes.map(acao => ({
        ...acao,
        rh_colaboradores: acao.colaborador_id ? colaboradoresMap[acao.colaborador_id] : null
      }))
    }

    return acoes.map(acao => ({
      ...acao,
      rh_colaboradores: null
    }))
  }

  // Relatório de Documentos Gerados
  async getDocumentosReport(filters = {}) {
    let query = this.supabase
      .from('rh_documentos_gerados')
      .select(`
        *,
        rh_documentos_templates (
          nome,
          codigo
        ),
        rh_colaboradores (
          nome,
          cargo
        )
      `)

    if (filters.template_id) {
      query = query.eq('template_id', filters.template_id)
    }

    if (filters.data_inicio && filters.data_fim) {
      query = query
        .gte('criado_em', filters.data_inicio)
        .lte('criado_em', filters.data_fim)
    }

    const { data, error } = await query.order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro na query de documentos:', error)
      // Se o join falhar, tentar buscar sem join
      if (error.message && (error.message.includes('foreign key') || error.message.includes('does not exist'))) {
        return this.getDocumentosReportWithoutJoin(filters)
      }
      throw error
    }
    return data || []
  }

  // Fallback: buscar documentos sem join
  async getDocumentosReportWithoutJoin(filters = {}) {
    let query = this.supabase
      .from('rh_documentos_gerados')
      .select('*')

    if (filters.template_id) {
      query = query.eq('template_id', filters.template_id)
    }

    if (filters.data_inicio && filters.data_fim) {
      query = query
        .gte('criado_em', filters.data_inicio)
        .lte('criado_em', filters.data_fim)
    }

    const { data: documentos, error } = await query.order('criado_em', { ascending: false })

    if (error) throw error

    if (!documentos || documentos.length === 0) return []

    // Buscar templates e colaboradores separadamente
    const templateIds = [...new Set(documentos.map(d => d.template_id).filter(Boolean))]
    const colaboradorIds = [...new Set(documentos.map(d => d.colaborador_id).filter(Boolean))]
    
    const promises = []
    
    if (templateIds.length > 0) {
      promises.push(
        this.supabase
          .from('rh_documentos_templates')
          .select('id, nome, codigo')
          .in('id', templateIds)
      )
    }
    
    if (colaboradorIds.length > 0) {
      promises.push(
        this.supabase
          .from('rh_colaboradores')
          .select('id, nome, cargo')
          .in('id', colaboradorIds)
      )
    }

    const results = await Promise.all(promises)
    const templates = results[0]?.data || []
    const colaboradores = results[1]?.data || []

    // Mapear templates e colaboradores
    const templatesMap = {}
    templates.forEach(t => {
      templatesMap[t.id] = { nome: t.nome, codigo: t.codigo }
    })

    const colaboradoresMap = {}
    colaboradores.forEach(c => {
      colaboradoresMap[c.id] = { nome: c.nome, cargo: c.cargo }
    })

    return documentos.map(doc => ({
      ...doc,
      rh_documentos_templates: doc.template_id ? templatesMap[doc.template_id] : null,
      rh_colaboradores: doc.colaborador_id ? colaboradoresMap[doc.colaborador_id] : null
    }))
  }

  // Estatísticas Gerais
  async getEstatisticasGerais() {
    const [
      colaboradores,
      celulares,
      notebooks,
      linhas,
      onboardingEntrada,
      onboardingSaida,
      eventosMes,
      acoesMes,
    ] = await Promise.all([
      this.supabase.from('vw_rh_colaboradores_detalhes').select('id', { count: 'exact', head: true }),
        this.supabase.from('vw_rh_celulares').select('"Row ID"', { count: 'exact', head: true }),
        this.supabase.from('vw_rh_notebooks').select('"Row ID"', { count: 'exact', head: true }),
        this.supabase.from('vw_rh_linhas_telefonicas').select('"Row ID"', { count: 'exact', head: true }),
      this.supabase.from('rh_kanban_cartoes').select('id', { count: 'exact', head: true })
        .in('coluna', ['novo', 'documentacao', 'config_ti']),
      this.supabase.from('rh_kanban_cartoes').select('id', { count: 'exact', head: true })
        .in('coluna', ['solicitado', 'devolucao_equipamentos', 'bloqueio_acessos']),
      this.supabase.from('rh_calendario_eventos').select('id', { count: 'exact', head: true })
        .gte('data_evento', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      this.supabase.from('rh_acoes_rapidas').select('id', { count: 'exact', head: true })
        .gte('criado_em', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    return {
      totalFuncionarios: colaboradores.count || 0,
      totalCelulares: celulares.count || 0,
      totalNotebooks: notebooks.count || 0,
      totalLinhas: linhas.count || 0,
      onboardingPendente: onboardingEntrada.count || 0,
      offboardingPendente: onboardingSaida.count || 0,
      eventosMes: eventosMes.count || 0,
      acoesMes: acoesMes.count || 0,
    }
  }

  // Exportar para CSV
  exportToCSV(data, filename) {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return JSON.stringify(value)
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const reportsService = new ReportsService()

