import { supabase } from '@/lib/supabase'

export class ColaboradoresService {
  constructor() {
    this.supabase = supabase
  }

  async getAll() {
    const { data, error } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('*')
      .order('nome')

    if (error) throw error
    return data || []
  }

  async getById(id) {
    // Buscar diretamente da tabela para garantir todos os campos incluindo telefone_pessoal
    const { data, error } = await this.supabase
      .from('rh_colaboradores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    
    // Buscar nome do departamento se houver departamento_id
    if (data && data.departamento_id) {
      const { data: departamento } = await this.supabase
        .from('rh_departamentos')
        .select('nome')
        .eq('id', data.departamento_id)
        .single()
      
      if (departamento) {
        data.departamento = departamento.nome
      }
    }
    
    return data
  }

  async getByIds(ids) {
    if (!ids || ids.length === 0) return []
    
    const { data, error } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('*')
      .in('id', ids)

    if (error) throw error
    return data || []
  }

  async create(colaborador) {
    // Views geralmente não são atualizáveis, então inserir na tabela base
    const { data, error } = await this.supabase
      .from('rh_colaboradores')
      .insert(colaborador)
      .select('*')
      .single()

    if (error) throw error
    
    // Retornar dados da view para manter consistência
    const { data: viewData } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('*')
      .eq('id', data.id)
      .single()
    
    return viewData || data
  }

  async update(id, updates) {
    // Views geralmente não são atualizáveis, então atualizar na tabela base
    const { data, error } = await this.supabase
      .from('rh_colaboradores')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    
    // Retornar dados da view para manter consistência
    const { data: viewData } = await this.supabase
      .from('vw_rh_colaboradores_detalhes')
      .select('*')
      .eq('id', id)
      .single()
    
    return viewData || data
  }
}

export const colaboradoresService = new ColaboradoresService()

