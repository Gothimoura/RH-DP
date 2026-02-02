import { supabase } from '@/lib/supabase'

export class AvaliacoesTokensService {
  constructor() {
    this.supabase = supabase
  }

  // Gerar token único
  generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  // Criar novo token para um funcionário
  async createToken(tokenData) {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    const token = this.generateToken()
    
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .insert({
        ...tokenData,
        token: token,
        criado_por: user?.id || null
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Buscar token por código
  async getByToken(token) {
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .select('*')
      .eq('token', token.toUpperCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Token não encontrado
        return null
      }
      throw error
    }
    return data
  }

  // Verificar se token é válido
  async validateToken(token) {
    const tokenData = await this.getByToken(token)
    
    if (!tokenData) {
      return { valid: false, reason: 'Token não encontrado' }
    }

    if (tokenData.usado) {
      return { valid: false, reason: 'Este token já foi utilizado' }
    }

    if (tokenData.expira_em) {
      const agora = new Date()
      const expiracao = new Date(tokenData.expira_em)
      if (agora > expiracao) {
        return { valid: false, reason: 'Este token expirou' }
      }
    }

    return { valid: true, tokenData }
  }

  // Marcar token como usado
  async markAsUsed(tokenId) {
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .update({
        usado: true,
        usado_em: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Listar todos os tokens (para administração)
  async getAll() {
    // Buscar tokens sem join - buscar colaboradores separadamente
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Listar tokens por funcionário
  async getByFuncionario(colaboradorId) {
    const { data, error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .select('*')
      .eq('colaborador_id', colaboradorId)
      .order('criado_em', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Deletar token
  async delete(tokenId) {
    const { error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .delete()
      .eq('id', tokenId)

    if (error) throw error
  }

  // Gerar múltiplos tokens (para vários funcionários)
  async createBulkTokens(tokensData) {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    const tokens = tokensData.map(tokenData => ({
      ...tokenData,
      token: this.generateToken(),
      criado_por: user?.id || null
    }))

    const { data, error } = await this.supabase
      .from('rh_avaliacoes_tokens')
      .insert(tokens)
      .select()

    if (error) throw error
    return data || []
  }
}

export const avaliacoesTokensService = new AvaliacoesTokensService()
