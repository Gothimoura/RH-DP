import { supabase } from '@/lib/supabase'

export class KanbanCommentsService {
  constructor() {
    this.supabase = supabase
  }

  async getComments(cardId) {
    try {
      // Buscar comentários (select específico para performance)
      const { data, error } = await this.supabase
        .from('rh_kanban_comentarios')
        .select('id, cartao_id, comentario, usuario_id, usuario_nome, criado_em')
        .eq('cartao_id', cardId)
        .order('criado_em', { ascending: false })
        .limit(100)

      if (error) {
        return []
      }
      return data || []
    } catch (error) {
      return []
    }
  }

  async createComment(cardId, comentario, usuarioId, userName = null) {
    try {
      // Validar dados antes de inserir
      if (!cardId) {
        throw new Error('ID do card é obrigatório')
      }
      if (!comentario || comentario.trim() === '') {
        throw new Error('Comentário não pode estar vazio')
      }
      if (!usuarioId) {
        throw new Error('ID do usuário é obrigatório')
      }

      // Preparar dados para inserção
      const insertData = {
        cartao_id: String(cardId),
        comentario: String(comentario).trim(),
        usuario_id: String(usuarioId),
      }

      // Adicionar usuario_nome apenas se fornecido e não vazio
      if (userName && userName.trim() !== '') {
        insertData.usuario_nome = String(userName).trim()
      }

      const { data, error } = await this.supabase
        .from('rh_kanban_comentarios')
        .insert(insertData)
        .select('id, cartao_id, comentario, usuario_id, usuario_nome, criado_em')
        .single()

      if (error) {
        // Se a coluna usuario_nome não existir, tentar sem ela
        if (error.code === '42703' || error.message?.includes('usuario_nome') || error.message?.includes('column')) {
          const { data: data2, error: error2 } = await this.supabase
            .from('rh_kanban_comentarios')
            .insert({
              cartao_id: String(cardId),
              comentario: String(comentario).trim(),
              usuario_id: String(usuarioId),
            })
            .select('id, cartao_id, comentario, usuario_id, criado_em')
            .single()
          
          if (error2) {
            throw error2
          }
          return data2
        }
        
        // Erro de permissão RLS
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          throw new Error('Erro de permissão. Verifique as políticas RLS da tabela rh_kanban_comentarios.')
        }
        
        throw error
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  async deleteComment(commentId) {
    try {
      const { error } = await this.supabase
        .from('rh_kanban_comentarios')
        .delete()
        .eq('id', commentId)

      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  }
}

export const kanbanCommentsService = new KanbanCommentsService()

