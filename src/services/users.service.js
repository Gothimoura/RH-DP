import { supabase } from '@/lib/supabase'

export class UsersService {
  constructor() {
    this.supabase = supabase
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    return this.getById(user.id)
  }

  async getById(id) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name, email, photo, role, access_medicoes, access_dp_rh, allowed_tabs, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(userData) {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(userData)
      .select('id, name, email, photo, role')
      .single()

    if (error) throw error
    return data
  }

  async update(id, updates) {
    console.log('usersService.update chamado:', { id, updates })
    
    // Usar upsert para garantir que o registro seja criado ou atualizado
    // Isso resolve problemas de RLS e registros inexistentes
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert({ id, ...updates }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select('id, name, email, photo, role, access_medicoes, access_dp_rh, allowed_tabs')
      .single()

    if (error) {
      console.error('Erro no usersService.update:', error)
      throw error
    }
    
    console.log('usersService.update retornou:', data)
    return data
  }

  async getAll() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name, email, photo, role, access_medicoes, access_dp_rh, allowed_tabs, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async upsert(userData) {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(userData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select('id, name, email, photo, role, access_medicoes, access_dp_rh, allowed_tabs')
      .single()

    if (error) throw error
    return data
  }
}

export const usersService = new UsersService()

