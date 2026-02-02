import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { avaliacoesService } from '@/services/avaliacoes.service'
import { avaliacoesTokensService } from '@/services/avaliacoes-tokens.service'
import { Target, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

// Competências Técnicas e Emocionais (mesmas da página principal)
const COMPETENCIAS_TECNICAS = [
  { id: 1, text: "Tem compromisso assumido com as metas da organização" },
  { id: 2, text: "Atinge os resultados desejados" },
  { id: 3, text: "Dedica atenção a tudo o que faz" },
  { id: 4, text: "Trabalha consistentemente em alto nível na sua função" },
  { id: 5, text: "Toma decisões apropriadas quando necessário" },
  { id: 6, text: "Contribui com ideias e sugestões para melhoria" },
  { id: 7, text: "Ouve feedbacks e busca ser melhor" },
  { id: 8, text: "Define prioridades corretas no momento certo" },
  { id: 9, text: "Tem práticas e sistemas eficientes para o trabalho" },
  { id: 10, text: "Transmite informações importantes de maneira eficiente" },
  { id: 11, text: "Cumpre todos os compromissos" },
  { id: 12, text: "Informa quando não terá condições de cumprir uma promessa" },
  { id: 13, text: "É habilidoso ao dar e receber feedbacks sobre desempenho" },
  { id: 14, text: "Procura exceder as expectativas dos clientes" },
  { id: 15, text: "Age positivamente ao buscar oportunidades para aprender" },
  { id: 16, text: "Compreende bem as tecnologias de trabalho atuais e futuras" },
  { id: 17, text: "Assume responsabilidade pelo próprio desenvolvimento profissional" }
]

const COMPETENCIAS_EMOCIONAIS = [
  { id: 1, text: "Autoconfiança: tem um sólido senso do próprio valor e capacidades" },
  { id: 2, text: "Autocontrole emocional: mantém emoções e impulsos sob controle" },
  { id: 3, text: "Superação: possui ímpeto para melhorar o desempenho continuamente" },
  { id: 4, text: "Iniciativa: está sempre pronto para agir e aproveitar oportunidades" },
  { id: 5, text: "Transparência e Credibilidade: é honesto, íntegro e digno de confiança" },
  { id: 6, text: "Flexibilidade: adapta-se a pessoas e situações diferentes" },
  { id: 7, text: "Otimismo: vê o lado bom dos acontecimentos em qualquer situação" },
  { id: 8, text: "Empatia: percebe emoções alheias e se interessa pelas preocupações dos outros" },
  { id: 9, text: "Serviço: reconhece e satisfaz as necessidades dos subordinados e clientes" },
  { id: 10, text: "Liderança inspiradora: orienta e motiva com uma visão instigante" },
  { id: 11, text: "Influência: dispõe da capacidade de persuadir e influenciar pessoas" },
  { id: 12, text: "Gerenciamento de conflitos: soluciona divergências levando à integração" },
  { id: 13, text: "Trabalho em equipe: conquista a colaboração e alto desempenho em equipe" }
]

const FREQUENCIAS = [
  { value: 0, label: "Nunca", description: "Não demonstra esse comportamento" },
  { value: 25, label: "Raramente", description: "Demonstra em menos de 25% das situações" },
  { value: 50, label: "Às vezes", description: "Demonstra em cerca de 50% das situações" },
  { value: 75, label: "Frequentemente", description: "Demonstra em mais de 75% das situações" },
  { value: 100, label: "Sempre", description: "Demonstra consistentemente esse comportamento" }
]

export default function AvaliacoesPublicPage() {
  const { token } = useParams()
  const [funcionario, setFuncionario] = useState('')
  const [funcionarioId, setFuncionarioId] = useState('')
  const [avaliador, setAvaliador] = useState('')
  const [tipoAvaliacao, setTipoAvaliacao] = useState('auto')
  const [avaliacoesTecnicas, setAvaliacoesTecnicas] = useState({})
  const [avaliacoesEmocionais, setAvaliacoesEmocionais] = useState({})
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [tokenData, setTokenData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setError('Token não fornecido. Acesse através do link enviado.')
      setLoading(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      setLoading(true)
      const validation = await avaliacoesTokensService.validateToken(token)
      
      if (!validation.valid) {
        setError(validation.reason || 'Token inválido')
        setLoading(false)
        return
      }

      setTokenData(validation.tokenData)
      setFuncionario(validation.tokenData.colaborador_nome)
      setFuncionarioId(validation.tokenData.colaborador_id)
      setTipoAvaliacao(validation.tokenData.tipo_avaliacao)
      
      if (validation.tokenData.avaliador_nome) {
        setAvaliador(validation.tokenData.avaliador_nome)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erro ao validar token:', error)
      setError('Erro ao validar token. Tente novamente.')
      setLoading(false)
    }
  }

  const calcularMedia = (avaliacoes) => {
    const valores = Object.values(avaliacoes)
    if (valores.length === 0) return 0
    return valores.reduce((a, b) => a + b, 0) / valores.length
  }

  const handleFrequencyChange = (tipo, competenciaId, valor) => {
    if (tipo === 'tecnica') {
      setAvaliacoesTecnicas(prev => ({
        ...prev,
        [competenciaId]: valor
      }))
    } else {
      setAvaliacoesEmocionais(prev => ({
        ...prev,
        [competenciaId]: valor
      }))
    }
  }

  const handleSubmit = async () => {
    if (!avaliador) {
      alert('Por favor, preencha seu nome')
      return
    }

    const totalTecnicas = COMPETENCIAS_TECNICAS.length
    const totalEmocionais = COMPETENCIAS_EMOCIONAIS.length

    if (Object.keys(avaliacoesTecnicas).length !== totalTecnicas ||
        Object.keys(avaliacoesEmocionais).length !== totalEmocionais) {
      alert('Por favor, complete todas as avaliações')
      return
    }

    try {
      setSaving(true)
      const mediaTecnica = calcularMedia(avaliacoesTecnicas)
      const mediaEmocional = calcularMedia(avaliacoesEmocionais)

      // Perguntas críticas são calculadas automaticamente na exibição (não salvamos no banco)
      // Salvar avaliação
      await avaliacoesService.create({
        colaborador_nome: funcionario,
        avaliador_nome: avaliador,
        tipo_avaliacao: tipoAvaliacao,
        avaliacoes_tecnicas: avaliacoesTecnicas,
        avaliacoes_emocionais: avaliacoesEmocionais,
        observacoes,
        media_tecnica: mediaTecnica,
        media_emocional: mediaEmocional
      })

      // Marcar token como usado
      if (tokenData) {
        await avaliacoesTokensService.markAsUsed(tokenData.id)
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      alert('Erro ao salvar avaliação: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Validando acesso...</h1>
          <p className="text-gray-600">Aguarde enquanto verificamos seu token de acesso.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Se você recebeu um link de avaliação, verifique se copiou o link completo.
            Caso o problema persista, entre em contato com o RH.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Avaliação Enviada com Sucesso!</h1>
          <p className="text-gray-600 mb-6">
            Sua avaliação foi registrada no sistema. Obrigado pela participação!
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Este link não pode ser usado novamente. Se precisar fazer outra avaliação, solicite um novo link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Avaliação Comportamental</h1>
              <p className="text-sm text-gray-600">Sistema de avaliação por frequência de comportamentos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Informações básicas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Informações da Avaliação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funcionário a ser Avaliado *
              </label>
              <input
                type="text"
                value={funcionario}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este campo está bloqueado pelo token de acesso
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu Nome *
              </label>
              <input
                type="text"
                value={avaliador}
                onChange={(e) => setAvaliador(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Avaliação *
              </label>
              <input
                type="text"
                value={
                  tipoAvaliacao === 'auto' ? 'Auto-avaliação' :
                  tipoAvaliacao === 'par' ? 'Avaliação de Par (Colega)' :
                  'Avaliação do Gestor'
                }
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Definido pelo token de acesso
              </p>
            </div>
          </div>
        </div>

        {/* Competências Técnicas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Competências Técnicas
              </h3>
              <p className="text-sm text-gray-600">
                Habilidades e Conhecimento Técnico ({Object.keys(avaliacoesTecnicas).length}/{COMPETENCIAS_TECNICAS.length})
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(Object.keys(avaliacoesTecnicas).length / COMPETENCIAS_TECNICAS.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-6">
            {COMPETENCIAS_TECNICAS.map((comp) => (
              <CompetenciaItem
                key={comp.id}
                competencia={comp}
                valorSelecionado={avaliacoesTecnicas[comp.id]}
                onChange={(valor) => handleFrequencyChange('tecnica', comp.id, valor)}
              />
            ))}
          </div>
        </div>

        {/* Competências Emocionais */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Competências Emocionais
              </h3>
              <p className="text-sm text-gray-600">
                Atitude e Caráter ({Object.keys(avaliacoesEmocionais).length}/{COMPETENCIAS_EMOCIONAIS.length})
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${(Object.keys(avaliacoesEmocionais).length / COMPETENCIAS_EMOCIONAIS.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-6">
            {COMPETENCIAS_EMOCIONAIS.map((comp) => (
              <CompetenciaItem
                key={comp.id}
                competencia={comp}
                valorSelecionado={avaliacoesEmocionais[comp.id]}
                onChange={(valor) => handleFrequencyChange('emocional', comp.id, valor)}
              />
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Observações Adicionais (Opcional)
          </h3>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows="4"
            placeholder="Exemplos específicos de comportamentos observados, contexto adicional, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Botão de submissão */}
        <div className="flex justify-end gap-4 mb-8">
          <button
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Enviando...' : '💾 Enviar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CompetenciaItem({ competencia, valorSelecionado, onChange }) {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-500">#{competencia.id}</span>
        <p className="text-gray-900 mt-1">{competencia.text}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FREQUENCIAS.map((freq) => (
          <button
            key={freq.value}
            className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
              valorSelecionado === freq.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50'
            }`}
            onClick={() => onChange(freq.value)}
            title={freq.description}
          >
            <div className="font-semibold">{freq.label}</div>
            <div className="text-xs opacity-70">{freq.value}%</div>
          </button>
        ))}
      </div>
    </div>
  )
}
