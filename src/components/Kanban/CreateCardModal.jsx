import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { kanbanService } from '@/services/kanban.service'
import { colaboradoresService } from '@/services/colaboradores.service'
import { supabase } from '@/lib/supabase'

export default function CreateCardModal({ tipoProcesso, onClose, onSuccess }) {
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState('')
  const [prioridade, setPrioridade] = useState('normal')
  const [observacoes, setObservacoes] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [primeiraEtapa, setPrimeiraEtapa] = useState(null)

  useEffect(() => {
    loadColaboradores()
    loadPrimeiraEtapa()
  }, [tipoProcesso])

  const loadColaboradores = async () => {
    try {
      setLoading(true)
      const data = await colaboradoresService.getAll()
      setColaboradores(data)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const loadPrimeiraEtapa = async () => {
    try {
      // "ligado" = onboarding (entrada), "desligado" = offboarding (saída)
      const tipoFiltro = tipoProcesso === 'entrada' ? 'ligado' : 'desligado'
      
      // Função para remover emojis e normalizar texto
      const normalizeTipo = (texto) => {
        if (!texto) return ''
        return texto.toString()
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis Unicode
          .replace(/[✅❌]/g, '') // Remove emojis específicos
          .replace(/[^\w\s]/gi, '') // Remove caracteres especiais
          .toLowerCase()
          .trim()
      }
      
      // Buscar todas as etapas e filtrar manualmente
      const { data: allEtapas, error: allError } = await supabase
        .from('rh_etapas')
        .select('id, tipo, nome')
        .order('nome')
      
      if (allError) throw allError
      
      // Filtrar por tipo normalizado
      const etapasFiltradas = (allEtapas || []).filter(etapa => {
        const tipoNormalizado = normalizeTipo(etapa.tipo)
        return tipoNormalizado === tipoFiltro.toLowerCase()
      })
      
      // Pegar a primeira etapa filtrada
      const primeiraEtapa = etapasFiltradas.length > 0 ? etapasFiltradas[0].id : null
      setPrimeiraEtapa(primeiraEtapa)
    } catch (error) {
      // Fallback para valores padrão
      setPrimeiraEtapa(tipoProcesso === 'entrada' ? 'novo' : 'solicitado')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedColaborador) {
      alert('Selecione um colaborador')
      return
    }

    try {
      setCreating(true)
      
      // Usar a primeira etapa do banco de dados
      if (!primeiraEtapa) {
        await loadPrimeiraEtapa()
      }
      
      const colunaInicial = primeiraEtapa || (tipoProcesso === 'entrada' ? 'novo' : 'solicitado')
      
      // Buscar a maior posição na coluna para adicionar no final
      const cards = await kanbanService.getCards(tipoProcesso)
      const cardsNaColuna = cards.filter(card => card.coluna === colunaInicial)
      const maxPosicao = cardsNaColuna.length > 0 
        ? Math.max(...cardsNaColuna.map(c => c.posicao || 0))
        : -1

      await kanbanService.createCard({
        colaborador_id: selectedColaborador,
        coluna: colunaInicial,
        posicao: maxPosicao + 1,
        data_inicio: dataInicio,
        prioridade: prioridade,
        observacoes: observacoes || null,
        tem_notebook: false,
        tem_celular: false,
        tem_acessos: false,
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      alert('Erro ao criar card. Verifique se o colaborador já não possui um card ativo.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Criar Novo Card - {tipoProcesso === 'entrada' ? 'Entrada' : 'Saída'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Colaborador */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Colaborador <span className="text-destructive">*</span>
            </label>
            {loading ? (
              <div className="animate-pulse bg-muted h-10 rounded-lg"></div>
            ) : (
              <select
                value={selectedColaborador}
                onChange={(e) => setSelectedColaborador(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                required
              >
                <option value="">Selecione um colaborador</option>
                {colaboradores.map((colab) => (
                  <option key={colab.id} value={colab.id}>
                    {colab.nome} {colab.cargo ? `- ${colab.cargo}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Data de Início */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Data de Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prioridade
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
            >
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="Adicione observações sobre este processo..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={creating || !selectedColaborador}
            >
              {creating ? 'Criando...' : 'Criar Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

