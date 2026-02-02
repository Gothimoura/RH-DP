import { supabase } from '@/lib/supabase'

export class EquipamentosService {
  constructor() {
    this.supabase = supabase
  }

  // ========== CELULARES ==========
  async getCelulares(filters = {}) {
    let query = this.supabase
      .from('vw_rh_celulares')
      .select('*')

    if (filters.status) {
      query = query.eq('Status', filters.status)
    }

    if (filters.departamento) {
      query = query.eq('DPTO', filters.departamento)
    }

    if (filters.usuario_atual) {
      query = query.eq('Usuário atual', filters.usuario_atual)
    }

    const { data, error } = await query.order('CELULAR')

    if (error) throw error
    return data || []
  }

  async getCelularById(id) {
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .select('*')
      .eq('Row ID', id)
      .single()

    if (error) throw error
    return data
  }

  async updateCelular(id, updates, usuarioId = null) {
    const celularAntigo = await this.getCelularById(id)
    
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .update(updates)
      .eq('Row ID', id)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico se houver alterações significativas
    if (usuarioId) {
      const alteracoes = []
      Object.keys(updates).forEach(key => {
        if (celularAntigo[key] !== updates[key] && key !== 'Row ID') {
          alteracoes.push(`${key}: "${celularAntigo[key] || '-'}" → "${updates[key] || '-'}"`)
        }
      })
      
      if (alteracoes.length > 0) {
        await this.registrarHistoricoCelular(
          id,
          'Sistema',
          usuarioId,
          `Editado: ${alteracoes.join(', ')}`
        )
      }
    }

    return data
  }

  async assignCelular(celularId, colaboradorId, usuarioId) {
    // Buscar dados do colaborador
    const { data: colaborador } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('nome, departamento')
      .eq('id', colaboradorId)
      .single()

    // Atualizar celular
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .update({
        'Usuário atual': colaborador.nome,
        'DPTO': colaborador.departamento,
        Status: 'Em uso',
      })
      .eq('Row ID', celularId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoCelular(celularId, colaborador.nome, usuarioId, 'Atribuído')

    return data
  }

  async releaseCelular(celularId, motivo, usuarioId) {
    const celular = await this.getCelularById(celularId)
    
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .update({
        'Útimo usuário': celular['Usuário atual'],
        'Usuário atual': null,
        Status: 'Disponível',
        OBS: motivo || celular.OBS,
      })
      .eq('Row ID', celularId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoCelular(celularId, celular['Usuário atual'], usuarioId, `Devolvido: ${motivo}`)

    return data
  }

  async registrarHistoricoCelular(celularId, usuario, usuarioId, comentario) {
    // Buscar o UUID real do ativo a partir do legacy_row_id
    const { data: ativo } = await this.supabase
      .from('rh_ativos')
      .select('id')
      .eq('legacy_row_id', celularId)
      .single()
    
    if (!ativo) {
      console.error('Ativo não encontrado:', celularId)
      return
    }
    
    const { error } = await this.supabase
      .from('rh_ativos_historico')
      .insert({
        ativo_id: ativo.id,
        data_hora: new Date().toISOString(),
        usuario: usuario,
        usuario_id: usuarioId,
        comentario: comentario,
      })

    if (error) throw error
  }

  async getHistoricoCelular(celularId) {
    // Buscar o UUID real do ativo a partir do legacy_row_id
    const { data: ativo } = await this.supabase
      .from('rh_ativos')
      .select('id')
      .eq('legacy_row_id', celularId)
      .single()
    
    if (!ativo) return []
    
    const { data, error } = await this.supabase
      .from('rh_ativos_historico')
      .select('*')
      .eq('ativo_id', ativo.id)
      .order('data_hora', { ascending: false })

    if (error) throw error
    return data || []
  }

  async addComentarioCelular(celularId, comentario, usuarioId) {
    // Buscar nome do usuário
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('name')
      .eq('id', usuarioId)
      .single()

    const nomeUsuario = profile?.name || 'Sistema'

    await this.registrarHistoricoCelular(celularId, nomeUsuario, usuarioId, comentario)
  }

  async createCelular(celularData) {
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .insert(celularData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async transferCelular(celularId, novoColaboradorId, usuarioId) {
    const celular = await this.getCelularById(celularId)
    
    // Buscar dados do novo colaborador
    const { data: novoColaborador } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('nome, departamento')
      .eq('id', novoColaboradorId)
      .single()

    // Atualizar celular
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .update({
        'Útimo usuário': celular['Usuário atual'],
        'Usuário atual': novoColaborador.nome,
        'DPTO': novoColaborador.departamento,
        Status: 'Em uso',
      })
      .eq('Row ID', celularId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoCelular(
      celularId, 
      novoColaborador.nome, 
      usuarioId, 
      `Transferido de ${celular['Usuário atual']} para ${novoColaborador.nome}`
    )

    return data
  }

  async discardCelular(celularId, motivo, usuarioId) {
    const celular = await this.getCelularById(celularId)
    
    const { data, error } = await this.supabase
      .from('vw_rh_celulares')
      .update({
        'Útimo usuário': celular['Usuário atual'] || celular['Útimo usuário'],
        'Usuário atual': null,
        Status: 'Descarte',
        OBS: motivo ? `${celular.OBS || ''}\nDescarte: ${motivo}`.trim() : celular.OBS,
      })
      .eq('Row ID', celularId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoCelular(
      celularId, 
      celular['Usuário atual'] || 'Sistema', 
      usuarioId, 
      `Marcado como descarte: ${motivo}`
    )

    return data
  }

  // ========== NOTEBOOKS ==========
  async getNotebooks(filters = {}) {
    let query = this.supabase
      .from('vw_rh_notebooks')
      .select('*')

    if (filters.status) {
      query = query.eq('Status', filters.status)
    }

    if (filters.departamento) {
      query = query.eq('Departamento', filters.departamento)
    }

    if (filters.usuario_atual) {
      query = query.eq('Usuário atual', filters.usuario_atual)
    }

    const { data, error } = await query.order('Modelo')

    if (error) throw error
    return data || []
  }

  async getNotebookById(id) {
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .select('*')
      .eq('Row ID', id)
      .single()

    if (error) throw error
    return data
  }

  async updateNotebook(id, updates, usuarioId = null) {
    const notebookAntigo = await this.getNotebookById(id)
    
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .update(updates)
      .eq('Row ID', id)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico se houver alterações significativas
    if (usuarioId) {
      const alteracoes = []
      Object.keys(updates).forEach(key => {
        if (notebookAntigo[key] !== updates[key] && key !== 'Row ID') {
          alteracoes.push(`${key}: "${notebookAntigo[key] || '-'}" → "${updates[key] || '-'}"`)
        }
      })
      
      if (alteracoes.length > 0) {
        await this.registrarHistoricoNotebook(
          id,
          'Sistema',
          usuarioId,
          `Editado: ${alteracoes.join(', ')}`
        )
      }
    }

    return data
  }

  async assignNotebook(notebookId, colaboradorId, usuarioId) {
    // Buscar dados do colaborador
    const { data: colaborador } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('nome, departamento')
      .eq('id', colaboradorId)
      .single()

    // Atualizar notebook
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .update({
        'Usuário atual': colaborador.nome,
        'Departamento': colaborador.departamento,
        Status: 'Em uso',
      })
      .eq('Row ID', notebookId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoNotebook(notebookId, colaborador.nome, usuarioId, 'Atribuído')

    return data
  }

  async releaseNotebook(notebookId, motivo, usuarioId) {
    const notebook = await this.getNotebookById(notebookId)
    
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .update({
        'Último usuário': notebook['Usuário atual'],
        'Usuário atual': null,
        Status: 'Disponível',
        OBS: motivo || notebook.OBS,
      })
      .eq('Row ID', notebookId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoNotebook(notebookId, notebook['Usuário atual'], usuarioId, `Devolvido: ${motivo}`)

    return data
  }

  async registrarHistoricoNotebook(notebookId, usuario, usuarioId, comentario) {
    // Buscar o UUID real do ativo a partir do legacy_row_id
    const { data: ativo } = await this.supabase
      .from('rh_ativos')
      .select('id')
      .eq('legacy_row_id', notebookId)
      .single()
    
    if (!ativo) {
      console.error('Ativo não encontrado:', notebookId)
      return
    }
    
    const { error } = await this.supabase
      .from('rh_ativos_historico')
      .insert({
        ativo_id: ativo.id,
        data_hora: new Date().toISOString(),
        usuario: usuario,
        usuario_id: usuarioId,
        comentario: comentario,
      })

    if (error) throw error
  }

  async getHistoricoNotebook(notebookId) {
    // Buscar o UUID real do ativo a partir do legacy_row_id
    const { data: ativo } = await this.supabase
      .from('rh_ativos')
      .select('id')
      .eq('legacy_row_id', notebookId)
      .single()
    
    if (!ativo) return []
    
    const { data, error } = await this.supabase
      .from('rh_ativos_historico')
      .select('*')
      .eq('ativo_id', ativo.id)
      .order('data_hora', { ascending: false })

    if (error) throw error
    return data || []
  }

  async addComentarioNotebook(notebookId, comentario, usuarioId) {
    // Buscar nome do usuário
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('name')
      .eq('id', usuarioId)
      .single()

    const nomeUsuario = profile?.name || 'Sistema'

    await this.registrarHistoricoNotebook(notebookId, nomeUsuario, usuarioId, comentario)
  }

  async createNotebook(notebookData) {
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .insert(notebookData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async transferNotebook(notebookId, novoColaboradorId, usuarioId) {
    const notebook = await this.getNotebookById(notebookId)
    
    // Buscar dados do novo colaborador
    const { data: novoColaborador } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('nome, departamento')
      .eq('id', novoColaboradorId)
      .single()

    // Atualizar notebook
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .update({
        'Último usuário': notebook['Usuário atual'],
        'Usuário atual': novoColaborador.nome,
        'Departamento': novoColaborador.departamento,
        Status: 'Em uso',
      })
      .eq('Row ID', notebookId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoNotebook(
      notebookId, 
      novoColaborador.nome, 
      usuarioId, 
      `Transferido de ${notebook['Usuário atual']} para ${novoColaborador.nome}`
    )

    return data
  }

  async discardNotebook(notebookId, motivo, usuarioId) {
    const notebook = await this.getNotebookById(notebookId)
    
    const { data, error } = await this.supabase
      .from('vw_rh_notebooks')
      .update({
        'Último usuário': notebook['Usuário atual'] || notebook['Último usuário'],
        'Usuário atual': null,
        Status: 'Descarte',
        OBS: motivo ? `${notebook.OBS || ''}\nDescarte: ${motivo}`.trim() : notebook.OBS,
      })
      .eq('Row ID', notebookId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoNotebook(
      notebookId, 
      notebook['Usuário atual'] || 'Sistema', 
      usuarioId, 
      `Marcado como descarte: ${motivo}`
    )

    return data
  }

  // ========== LINHAS/CHIPS ==========
  async getLinhas(filters = {}) {
    let query = this.supabase
      .from('vw_rh_linhas_telefonicas')
      .select('*')

    if (filters.status) {
      query = query.eq('Status', filters.status)
    }

    if (filters.centro_custo) {
      query = query.eq('Centro de custo', filters.centro_custo)
    }

    if (filters.usuario_atual) {
      query = query.eq('Usuário atual', filters.usuario_atual)
    }

    const { data, error } = await query.order('NTC')

    if (error) throw error
    return data || []
  }

  async getLinhaById(id) {
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .select('*')
      .eq('Row ID', id)
      .single()

    if (error) throw error
    return data
  }

  async updateLinha(id, updates, usuarioId = null) {
    const linhaAntiga = await this.getLinhaById(id)
    
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .update(updates)
      .eq('Row ID', id)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico se houver alterações significativas
    if (usuarioId) {
      const alteracoes = []
      Object.keys(updates).forEach(key => {
        if (linhaAntiga[key] !== updates[key] && key !== 'Row ID') {
          alteracoes.push(`${key}: "${linhaAntiga[key] || '-'}" → "${updates[key] || '-'}"`)
        }
      })
      
      if (alteracoes.length > 0) {
        await this.registrarHistoricoLinha(
          id,
          'Sistema',
          usuarioId,
          `Editado: ${alteracoes.join(', ')}`
        )
      }
    }

    return data
  }

  async assignLinha(linhaId, colaboradorId, usuarioId) {
    // Buscar dados do colaborador
    const { data: colaborador } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('nome, departamento')
      .eq('id', colaboradorId)
      .single()

    // Atualizar linha
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .update({
        'Usuário atual': colaborador.nome,
        'Centro de custo': colaborador.departamento,
        Status: 'Em uso',
      })
      .eq('Row ID', linhaId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoLinha(linhaId, colaborador.nome, usuarioId, 'Atribuído')

    return data
  }

  async releaseLinha(linhaId, motivo, usuarioId) {
    const linha = await this.getLinhaById(linhaId)
    
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .update({
        'Usuário atual': null,
        Status: 'Disponível',
        OBS: motivo || linha.OBS,
      })
      .eq('Row ID', linhaId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoLinha(linhaId, linha['Usuário atual'], usuarioId, `Devolvido: ${motivo}`)

    return data
  }

  async registrarHistoricoLinha(linhaId, usuario, usuarioId, comentario) {
    // Buscar o UUID real do ativo a partir do legacy_row_id
    const { data: ativo } = await this.supabase
      .from('rh_ativos')
      .select('id')
      .eq('legacy_row_id', linhaId)
      .single()
    
    if (!ativo) {
      console.error('Ativo não encontrado:', linhaId)
      return
    }
    
    const { error } = await this.supabase
      .from('rh_ativos_historico')
      .insert({
        ativo_id: ativo.id,
        data_hora: new Date().toISOString(),
        usuario: usuario,
        usuario_id: usuarioId,
        comentario: comentario,
      })

    if (error) throw error
  }

  async getHistoricoLinha(linhaId) {
    // Buscar o UUID real do ativo a partir do legacy_row_id
    const { data: ativo } = await this.supabase
      .from('rh_ativos')
      .select('id')
      .eq('legacy_row_id', linhaId)
      .single()
    
    if (!ativo) return []
    
    const { data, error } = await this.supabase
      .from('rh_ativos_historico')
      .select('*')
      .eq('ativo_id', ativo.id)
      .order('data_hora', { ascending: false })

    if (error) throw error
    return data || []
  }

  async addComentarioLinha(linhaId, comentario, usuarioId) {
    // Buscar nome do usuário
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('name')
      .eq('id', usuarioId)
      .single()

    const nomeUsuario = profile?.name || 'Sistema'

    await this.registrarHistoricoLinha(linhaId, nomeUsuario, usuarioId, comentario)
  }

  async createLinha(linhaData) {
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .insert(linhaData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async transferLinha(linhaId, novoColaboradorId, usuarioId) {
    const linha = await this.getLinhaById(linhaId)
    
    // Buscar dados do novo colaborador
    const { data: novoColaborador } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('nome, departamento')
      .eq('id', novoColaboradorId)
      .single()

    // Atualizar linha
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .update({
        'Usuário atual': novoColaborador.nome,
        'Centro de custo': novoColaborador.departamento,
        Status: 'Em uso',
      })
      .eq('Row ID', linhaId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoLinha(
      linhaId, 
      novoColaborador.nome, 
      usuarioId, 
      `Transferido de ${linha['Usuário atual'] || 'N/A'} para ${novoColaborador.nome}`
    )

    return data
  }

  async discardLinha(linhaId, motivo, usuarioId) {
    const linha = await this.getLinhaById(linhaId)
    
    const { data, error } = await this.supabase
      .from('vw_rh_linhas_telefonicas')
      .update({
        'Usuário atual': null,
        Status: 'Descarte',
        OBS: motivo ? `${linha.OBS || ''}\nDescarte: ${motivo}`.trim() : linha.OBS,
      })
      .eq('Row ID', linhaId)
      .select()
      .single()

    if (error) throw error

    // Registrar histórico
    await this.registrarHistoricoLinha(
      linhaId, 
      linha['Usuário atual'] || 'Sistema', 
      usuarioId, 
      `Marcado como descarte: ${motivo}`
    )

    return data
  }

  // ========== ESTATÍSTICAS ==========
  async getEstatisticas() {
    const [celulares, notebooks, linhas] = await Promise.all([
      this.getCelulares(),
      this.getNotebooks(),
      this.getLinhas(),
    ])

    // Função auxiliar para verificar se está disponível (baseado apenas no campo Status)
    const estaDisponivel = (eq) => {
      const status = eq.Status?.toLowerCase().trim() || ''
      // Disponível se: status vazio, "disponivel", "disponível"
      return !status || status === 'disponivel' || status === 'disponível'
    }

    // Função auxiliar para verificar se está em uso (baseado apenas no campo Status)
    const estaEmUso = (eq) => {
      const status = eq.Status?.toLowerCase().trim() || ''
      return status === 'em_uso' || status === 'em uso'
    }

    // Em uso: baseado no campo Status
    const emUso = {
      celulares: celulares.filter(c => estaEmUso(c)).length,
      notebooks: notebooks.filter(n => estaEmUso(n)).length,
      linhas: linhas.filter(l => estaEmUso(l)).length,
    }

    // Disponíveis: baseado no campo Status
    const disponiveis = {
      celulares: celulares.filter(c => estaDisponivel(c)).length,
      notebooks: notebooks.filter(n => estaDisponivel(n)).length,
      linhas: linhas.filter(l => estaDisponivel(l)).length,
    }

    return {
      total: {
        celulares: celulares.length,
        notebooks: notebooks.length,
        linhas: linhas.length,
      },
      disponiveis,
      emUso,
    }
  }
}

export const equipamentosService = new EquipamentosService()

