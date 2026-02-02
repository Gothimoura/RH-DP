import { supabase } from '@/lib/supabase'

export class MetricsService {
  constructor() {
    this.supabase = supabase
  }

  async getMetrics() {
    // Sempre calcular diretamente usando as mesmas views da página de equipamentos
    try {
      // Contar colaboradores
      const { count: countColaboradores, error: colabError } = await this.supabase
        .from('vw_rh_colaboradores_detalhes')
        .select('*', { count: 'exact', head: true })
      
      if (colabError) {
        console.warn('Erro ao contar colaboradores:', colabError)
      }
      
      // Contar equipamentos usando as mesmas views que a página de equipamentos
      const { count: countNotebooks, error: notebooksError } = await this.supabase
        .from('vw_rh_notebooks')
        .select('*', { count: 'exact', head: true })
      
      if (notebooksError) {
        console.warn('Erro ao contar notebooks:', notebooksError)
      }
      
      const { count: countCelulares, error: celularesError } = await this.supabase
        .from('vw_rh_celulares')
        .select('*', { count: 'exact', head: true })
      
      if (celularesError) {
        console.warn('Erro ao contar celulares:', celularesError)
      }
      
      // Contar processos de onboarding (entrada)
      // Buscar todas as etapas e filtrar manualmente (mesma lógica do KanbanBoard)
      const { data: allEtapas, error: etapasError } = await this.supabase
        .from('rh_etapas')
        .select('id, tipo')
      
      if (etapasError) {
        console.warn('Erro ao buscar etapas:', etapasError)
      }
      
      let countProcessos = 0
      if (allEtapas && allEtapas.length > 0) {
        // Filtrar etapas de onboarding (ligado) - mesma lógica do KanbanBoard
        const etapasOnboarding = allEtapas.filter(etapa => {
          const tipoEtapaLower = (etapa.tipo || '').toString().toLowerCase().trim()
          return (tipoEtapaLower.startsWith('ligado') || tipoEtapaLower.includes('ligamento')) && 
                 !tipoEtapaLower.includes('desligado') && !tipoEtapaLower.includes('desligamento')
        })
        
        console.log('Etapas de onboarding encontradas:', etapasOnboarding)
        
        if (etapasOnboarding.length > 0) {
          const etapasIds = etapasOnboarding.map(e => e.id)
          const { count, error: processosError } = await this.supabase
            .from('rh_kanban_cartoes')
            .select('*', { count: 'exact', head: true })
            .in('coluna', etapasIds)
          
          if (processosError) {
            console.warn('Erro ao contar processos:', processosError)
          }
          countProcessos = count || 0
        }
      }

      console.log('Métricas calculadas:', {
        funcionarios: countColaboradores,
        notebooks: countNotebooks,
        celulares: countCelulares,
        processos: countProcessos,
      })

      return {
        funcionarios: countColaboradores || 0,
        notebooks: countNotebooks || 0,
        celulares: countCelulares || 0,
        processos: countProcessos || 0,
      }
    } catch (error) {
      console.error('Erro ao calcular métricas:', error)
      return {
        funcionarios: 0,
        notebooks: 0,
        celulares: 0,
        processos: 0,
      }
    }
  }

  async updateMetric(chave, valor, label, icone, cor) {
    const { data, error } = await this.supabase
      .from('rh_painel_metricas')
      .upsert({
        chave,
        valor,
        label,
        icone,
        cor,
        atualizado_em: new Date().toISOString(),
      })
      .select('chave, valor, label, icone, cor')
      .single()

    if (error) throw error
    return data
  }
}

export const metricsService = new MetricsService()

