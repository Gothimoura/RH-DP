import { supabase } from '@/lib/supabase'

export class CalendarioService {
  constructor() {
    this.supabase = supabase
  }

  async getEvents(filters = {}) {
    let query = this.supabase
      .from('rh_calendario_eventos')
      .select('id, colaborador_id, tipo_evento, titulo, descricao, data_evento, hora_evento, cor, departamento_id, status, criado_em, atualizado_em')

    if (filters.data_evento) {
      query = query.eq('data_evento', filters.data_evento)
    }

    if (filters.startDate && filters.endDate) {
      query = query
        .gte('data_evento', filters.startDate)
        .lte('data_evento', filters.endDate)
    }

    query = query.order('data_evento', { ascending: true })
      .order('hora_evento', { ascending: true })

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getTodayEvents() {
    const today = new Date().toISOString().split('T')[0]
    return this.getEvents({ data_evento: today })
  }

  async createEvent(eventData) {
    const { data, error } = await this.supabase
      .from('rh_calendario_eventos')
      .insert(eventData)
      .select('id, colaborador_id, tipo_evento, titulo, descricao, data_evento, hora_evento, cor, departamento_id, status, criado_em')
      .single()

    if (error) throw error
    return data
  }

  async updateEvent(eventId, updates) {
    const { data, error } = await this.supabase
      .from('rh_calendario_eventos')
      .update({
        ...updates,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select('id, colaborador_id, tipo_evento, titulo, descricao, data_evento, hora_evento, cor, departamento_id, status, atualizado_em')
      .single()

    if (error) throw error
    return data
  }

  async deleteEvent(eventId) {
    const { error } = await this.supabase
      .from('rh_calendario_eventos')
      .delete()
      .eq('id', eventId)

    if (error) throw error
  }
}

export const calendarioService = new CalendarioService()

