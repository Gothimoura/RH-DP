import { supabase } from '@/lib/supabase'
import { kanbanCommentsService } from './kanban-comments.service'

export class KanbanService {
  constructor() {
    this.supabase = supabase
  }

  // Buscar nome da coluna/etapa do banco
  async getColumnName(columnId) {
    try {
      const { data } = await this.supabase
        .from('rh_etapas')
        .select('nome')
        .eq('id', columnId)
        .single()
      
      return data?.nome || columnId
    } catch (error) {
      return columnId
    }
  }

  // Buscar nome do usuário (SEM fallback para email)
  async getUserName(userId) {
    if (!userId) return 'Sistema'
    
    // Tentar usar função RPC primeiro (mais confiável para colunas com espaço)
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_name', { user_id: userId })
      
      if (!error && data && data.trim() !== '' && !data.includes('@')) {
        return data.trim()
      }
    } catch (rpcError) {
      // Se RPC não existir, continuar com outras tentativas
    }
    
    // Tentar buscar diretamente na tabela profiles (tabela atualizada)
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle()
      
      if (data && !error && data.name) {
        return data.name.trim()
      }
    } catch (queryError) {
      // Ignorar erro
    }
    
    return null
  }

  async getCards(tipoProcesso = null) {
    // Buscar etapas do banco para filtrar corretamente
    // "ligado" = onboarding (entrada), "desligado" = offboarding (saída)
    let etapasIds = []
    
    if (tipoProcesso) {
      const tipoFiltro = tipoProcesso === 'entrada' ? 'ligado' : 'desligado'
      
      // Função para normalizar texto (mesma lógica do KanbanBoard)
      const normalizeTipo = (texto) => {
        if (!texto) return ''
        return texto.toString()
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis Unicode
          .replace(/[✅❌]/g, '') // Remove emojis específicos
          .toLowerCase()
          .trim()
      }
      
      // Buscar todas as etapas
      const { data: allEtapas } = await this.supabase
        .from('rh_etapas')
        .select('id, tipo')
      
      if (allEtapas && allEtapas.length > 0) {
        // Filtrar usando a mesma lógica do KanbanBoard para consistência
        const etapasFiltradas = allEtapas.filter(etapa => {
          const tipoEtapaLower = normalizeTipo(etapa.tipo)
          
          if (tipoFiltro === 'ligado') {
            // Para entrada: aceita "ligado" ou "ligamento", mas não "desligado"
            return (tipoEtapaLower.startsWith('ligado') || tipoEtapaLower.includes('ligamento')) && 
                   !tipoEtapaLower.includes('desligado') && !tipoEtapaLower.includes('desligamento')
          } else if (tipoFiltro === 'desligado') {
            // Para saída: aceita "desligado" ou "desligamento"
            return tipoEtapaLower.startsWith('desligado') || tipoEtapaLower.includes('desligamento')
          }
          return false
        })
        
        etapasIds = etapasFiltradas.map(e => e.id)
      }
    }

    // Buscar cards SEM join - buscar responsáveis separadamente
    // IMPORTANTE: Não filtrar por colaborador_id null - incluir TODOS os cards
    let query = this.supabase
      .from('rh_kanban_cartoes')
      .select(`
        id, 
        colaborador_id, 
        coluna, 
        posicao, 
        data_inicio, 
        data_prevista, 
        tem_notebook, 
        tem_celular, 
        tem_acessos, 
        prioridade, 
        observacoes, 
        responsavel_id, 
        criado_em, 
        atualizado_em
      `)
      .order('posicao', { ascending: true })

    // Filtrar por etapas se houver tipoProcesso
    // IMPORTANTE: Se não houver etapas encontradas, retornar array vazio em vez de todos os cards
    if (tipoProcesso) {
      if (etapasIds.length > 0) {
        query = query.in('coluna', etapasIds)
      } else {
        // Se não encontrou etapas do tipo solicitado, retornar vazio
        // Isso evita mostrar cards de outros tipos
        // Log para debug: verificar se etapas estão sendo encontradas
        console.warn(`Nenhuma etapa encontrada para tipoProcesso: ${tipoProcesso}`)
        return []
      }
    }

    const { data, error } = await query

    if (error) throw error
    
    // IMPORTANTE: Retornar TODOS os cards retornados, mesmo com colaborador_id null
    return data || []
  }

  async moveCard(cardId, newColumn, newPosition, userId, userName = null) {
    // Garantir que cardId seja string
    const cardIdStr = String(cardId)
    
    // Buscar card atual (select específico para performance)
    const { data: card, error: cardError } = await this.supabase
      .from('rh_kanban_cartoes')
      .select('id, coluna, posicao')
      .eq('id', cardIdStr)
      .single()

    if (cardError) {
      throw cardError
    }

    if (!card) {
      throw new Error(`Card com ID ${cardIdStr} não encontrado`)
    }

    const oldColumn = card.coluna

    // Buscar cards existentes na coluna de destino (exceto o card que está sendo movido)
    const { data: existingCards } = await this.supabase
      .from('rh_kanban_cartoes')
      .select('id, posicao')
      .eq('coluna', newColumn)
      .neq('id', cardIdStr)
      .order('posicao', { ascending: true })

    // Calcular posição correta
    let finalPosition = newPosition
    if (existingCards && existingCards.length > 0) {
      // Se a posição solicitada é maior que o número de cards existentes, colocar no final
      if (newPosition >= existingCards.length) {
        finalPosition = existingCards.length
      } else {
        // Garantir que a posição seja válida
        finalPosition = Math.max(0, Math.min(newPosition, existingCards.length))
      }
    } else {
      // Se não há cards na coluna, posição será 0
      finalPosition = 0
    }

    // Se não mudou de coluna, apenas atualizar posição
    if (oldColumn === newColumn) {
      const updateData = {
        posicao: finalPosition,
        atualizado_em: new Date().toISOString(),
      }

      const { data: updatedCard, error: updateError } = await this.supabase
        .from('rh_kanban_cartoes')
        .update(updateData)
        .eq('id', cardIdStr)
        .select('id, colaborador_id, coluna, posicao, data_inicio, data_prevista, tem_notebook, tem_celular, tem_acessos, prioridade, observacoes, responsavel_id, criado_em, atualizado_em')
        .single()

      if (updateError) {
        throw updateError
      }

      return updatedCard
    }

    // Atualizar card com nova coluna e posição
    const updateData = {
      coluna: newColumn,
      posicao: finalPosition,
      atualizado_em: new Date().toISOString(),
    }

    const { data: updatedCard, error: updateError } = await this.supabase
      .from('rh_kanban_cartoes')
      .update(updateData)
      .eq('id', cardIdStr)
      .select('id, coluna, posicao, atualizado_em')
      .single()

    if (updateError) {
      throw updateError
    }

    // Registrar no histórico (não bloquear se falhar)
    try {
      await this.supabase.from('rh_kanban_historico').insert({
        cartao_id: cardIdStr,
        de_coluna: oldColumn,
        para_coluna: newColumn,
        movido_por: userId,
      })
    } catch (histError) {
      // Ignorar - não crítico
    }

    // Criar comentário automático sobre a mudança de status
    try {
      const finalUserName = userName || 'Usuário'
      const oldColumnName = await this.getColumnName(oldColumn)
      const newColumnName = await this.getColumnName(newColumn)
      
      const comentario = `📋 Status alterado: ${oldColumnName} → ${newColumnName}`
      
      await kanbanCommentsService.createComment(
        cardIdStr,
        comentario,
        userId || 'sistema',
        finalUserName
      )
    } catch (commentError) {
      // Não bloquear a operação se falhar ao criar comentário
    }

    return updatedCard
  }

  async updateCard(cardId, updates) {
    const { data, error } = await this.supabase
      .from('rh_kanban_cartoes')
      .update({
        ...updates,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select('id, colaborador_id, coluna, posicao, atualizado_em')
      .single()

    if (error) throw error
    return data
  }

  async assignUser(cardId, userId, assignedByUserId, assignedByName) {
    const { data, error } = await this.supabase
      .from('rh_kanban_cartoes')
      .update({
        responsavel_id: userId || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select('id, colaborador_id, coluna, posicao, responsavel_id, atualizado_em')
      .single()

    if (error) {
      console.error('Erro ao atribuir responsável:', error)
      throw error
    }

    // Criar comentário automático sobre a atribuição
    try {
      const { kanbanCommentsService } = await import('./kanban-comments.service')
      const card = await this.getCardById(cardId)
      
      if (card) {
        if (userId) {
          const userName = await this.getUserName(userId)
          const comentario = `👤 Responsável atribuído: ${userName || 'Usuário'}`
          await kanbanCommentsService.createComment(
            cardId,
            comentario,
            assignedByUserId || 'sistema',
            assignedByName || 'Sistema'
          )
        } else {
          const comentario = `👤 Atribuição de responsável removida`
          await kanbanCommentsService.createComment(
            cardId,
            comentario,
            assignedByUserId || 'sistema',
            assignedByName || 'Sistema'
          )
        }
      }
    } catch (commentError) {
      // Não bloquear a operação se falhar ao criar comentário
      console.error('Erro ao criar comentário de atribuição:', commentError)
    }

    return data
  }

  async getCardById(cardId) {
    const { data, error } = await this.supabase
      .from('rh_kanban_cartoes')
      .select('id, colaborador_id, coluna, posicao, responsavel_id')
      .eq('id', cardId)
      .single()

    if (error) throw error
    return data
  }

  async createCard(cardData) {
    // Remover tipo_processo se existir (coluna não existe no banco)
    const { tipo_processo, ...cardDataToInsert } = cardData

    const { data, error } = await this.supabase
      .from('rh_kanban_cartoes')
      .insert(cardDataToInsert)
      .select('id, colaborador_id, coluna, posicao, criado_em')
      .single()

    if (error) throw error
    return data
  }
}

export const kanbanService = new KanbanService()

