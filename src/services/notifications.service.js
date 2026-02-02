import { supabase } from '@/lib/supabase'

export class NotificationsService {
  constructor() {
    this.supabase = supabase
  }

  async create(usuarioId, tipo, titulo, mensagem) {
    const { data, error } = await this.supabase
      .from('rh_notificacoes')
      .insert({
        usuario_id: usuarioId,
        tipo: tipo,
        titulo: titulo,
        mensagem: mensagem,
        lida: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAll(usuarioId) {
    const { data, error } = await this.supabase
      .from('rh_notificacoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('criada_em', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUnread(usuarioId) {
    const { data, error } = await this.supabase
      .from('rh_notificacoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('lida', false)
      .order('criada_em', { ascending: false })

    if (error) throw error
    return data || []
  }

  async markAsRead(notificationId) {
    const { data, error } = await this.supabase
      .from('rh_notificacoes')
      .update({ lida: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async markAllAsRead(usuarioId) {
    const { error } = await this.supabase
      .from('rh_notificacoes')
      .update({ lida: true })
      .eq('usuario_id', usuarioId)
      .eq('lida', false)

    if (error) throw error
  }

  async delete(notificationId) {
    const { error } = await this.supabase
      .from('rh_notificacoes')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  }

  async deleteAll(usuarioId) {
    const { error } = await this.supabase
      .from('rh_notificacoes')
      .delete()
      .eq('usuario_id', usuarioId)

    if (error) throw error
  }
}

export const notificationsService = new NotificationsService()

