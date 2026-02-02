import { supabase } from '@/lib/supabase'

export class AvaliacoesService {
  constructor() {
    this.supabase = supabase
  }

  async getAll() {
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_comportamentais')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getByFuncionario(colaboradorNome) {
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_comportamentais')
      .select('*')
      .eq('colaborador_nome', colaboradorNome)
      .order('criado_em', { ascending: false })

    if (error) throw error
    return data || []
  }

  async create(avaliacao) {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_comportamentais')
      .insert({
        ...avaliacao,
        criado_por: user?.id || null
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_comportamentais')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id) {
    const { error } = await this.supabase
      .from('rh_avaliacoes_comportamentais')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const avaliacoesService = new AvaliacoesService()
