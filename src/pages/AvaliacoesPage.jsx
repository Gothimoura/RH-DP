import { useState, useEffect } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import { avaliacoesService } from '@/services/avaliacoes.service'
import { avaliacoesTokensService } from '@/services/avaliacoes-tokens.service'
import { colaboradoresService } from '@/services/colaboradores.service'
import { useAuth } from '@/hooks/useAuth'
import { Target, FileText, BarChart3, AlertTriangle, CheckCircle2, Key, PieChart, TrendingUp, TrendingDown, Users } from 'lucide-react'
import TokensTab from '@/components/Avaliacoes/TokensTab'

// Competências Técnicas e Emocionais
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

export default function AvaliacoesPage() {
  const { userData } = useAuth()
  const [currentTab, setCurrentTab] = useState('avaliar')
  const [avaliacoes, setAvaliacoes] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])


  const loadData = async () => {
    try {
      setLoading(true)
      const [avaliacoesData, colaboradoresData] = await Promise.all([
        avaliacoesService.getAll(),
        colaboradoresService.getAll()
      ])
      setAvaliacoes(avaliacoesData)
      setColaboradores(colaboradoresData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadTokens = async () => {
    try {
      const tokensData = await avaliacoesTokensService.getAll()
      setTokens(tokensData)
    } catch (error) {
      console.error('Erro ao carregar tokens:', error)
      alert('Erro ao carregar tokens')
    }
  }

  const handleGenerateToken = async (tokenData) => {
    try {
      await avaliacoesTokensService.createToken(tokenData)
      await loadTokens()
      alert('Token gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar token:', error)
      alert('Erro ao gerar token: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleDeleteToken = async (tokenId) => {
    if (!confirm('Deseja realmente excluir este token?')) return
    
    try {
      await avaliacoesTokensService.delete(tokenId)
      await loadTokens()
      alert('Token excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir token:', error)
      alert('Erro ao excluir token: ' + (error.message || 'Erro desconhecido'))
    }
  }


  const detectarVies = () => {
    const avaliacoesPorFuncionario = {}

    avaliacoes.forEach(av => {
      const funcionarioNome = av.colaborador_nome || av.funcionario
      if (!avaliacoesPorFuncionario[funcionarioNome]) {
        avaliacoesPorFuncionario[funcionarioNome] = []
      }
      avaliacoesPorFuncionario[funcionarioNome].push(av)
    })

    const alertas = []
    const statusFuncionarios = []

    Object.entries(avaliacoesPorFuncionario).forEach(([funcionario, avaliacoesList]) => {
      // Calcular médias gerais
      const mediaGeralTecnica = avaliacoesList.reduce((sum, av) => sum + parseFloat(av.media_tecnica || 0), 0) / avaliacoesList.length
      const mediaGeralEmocional = avaliacoesList.reduce((sum, av) => sum + parseFloat(av.media_emocional || 0), 0) / avaliacoesList.length
      const mediaGeral = (mediaGeralTecnica + mediaGeralEmocional) / 2

      // Determinar status
      let status = 'aprovado'
      let classificacao = 'Excelente'
      let corStatus = 'green'
      
      if (mediaGeral >= 80) {
        classificacao = 'Excelente'
        corStatus = 'green'
      } else if (mediaGeral >= 60) {
        classificacao = 'Bom'
        corStatus = 'blue'
      } else if (mediaGeral >= 40) {
        classificacao = 'Regular'
        corStatus = 'yellow'
        status = 'desaprovado'
      } else {
        classificacao = 'Ruim'
        corStatus = 'red'
        status = 'desaprovado'
      }

      if (mediaGeral < 60) {
        status = 'desaprovado'
      }

      // Adicionar ao status de funcionários
      statusFuncionarios.push({
        funcionario,
        mediaGeral,
        mediaGeralTecnica,
        mediaGeralEmocional,
        status,
        classificacao,
        corStatus,
        totalAvaliacoes: avaliacoesList.length,
        avaliacoes: avaliacoesList
      })

      // Detectar vieses - melhorada para detectar discrepâncias entre avaliações
      
      // Rastrear avaliações que já foram marcadas como tendo viés (para evitar alertas duplicados)
      const avaliacoesComVies = new Set()
      
      // 1. Detectar discrepâncias quando uma avaliação está muito diferente das outras
      if (avaliacoesList.length >= 2) {
        avaliacoesList.forEach((av, index) => {
          const mediaAvaliacao = (parseFloat(av.media_tecnica || 0) + parseFloat(av.media_emocional || 0)) / 2
          
          // Calcular média das OUTRAS avaliações (excluindo esta)
          const outrasAvaliacoes = avaliacoesList.filter((_, i) => i !== index)
          const mediasOutras = outrasAvaliacoes.map(a => (parseFloat(a.media_tecnica || 0) + parseFloat(a.media_emocional || 0)) / 2)
          const mediaOutras = mediasOutras.reduce((a, b) => a + b, 0) / mediasOutras.length
          
          // Detectar quando uma avaliação está muito abaixo da média das outras
          const diferenca = mediaOutras - mediaAvaliacao
          
          if (diferenca > 30) {
            const tipoAval = av.tipo_avaliacao === 'auto' ? 'Auto-avaliação' : av.tipo_avaliacao === 'gestor' ? 'Avaliação do Gestor' : 'Avaliação'
            const avaliador = av.avaliador_nome || 'Desconhecido'
            
            // Marcar esta avaliação como tendo viés detectado
            avaliacoesComVies.add(av.id || index)
            
            alertas.push({
              tipo: 'discrepancia_viés',
              funcionario,
              mensagem: `⚠️ VIÉS DETECTADO: ${tipoAval} de ${avaliador} está ${diferenca.toFixed(0)} pontos abaixo da média das outras avaliações (${mediaAvaliacao.toFixed(0)}% vs média de ${mediaOutras.toFixed(0)}%). Todas as outras avaliações estão acima de ${Math.min(...mediasOutras).toFixed(0)}%, enquanto esta está em ${mediaAvaliacao.toFixed(0)}%.`,
              severidade: diferenca > 40 ? 'alta' : 'media'
            })
          }
          
          // Também detectar quando uma avaliação está muito acima (possível favoritismo)
          if (mediaAvaliacao - mediaOutras > 30) {
            const tipoAval = av.tipo_avaliacao === 'auto' ? 'Auto-avaliação' : av.tipo_avaliacao === 'gestor' ? 'Avaliação do Gestor' : 'Avaliação'
            const avaliador = av.avaliador_nome || 'Desconhecido'
            
            // Marcar esta avaliação como tendo viés detectado
            avaliacoesComVies.add(av.id || index)
            
            alertas.push({
              tipo: 'discrepancia_favoritismo',
              funcionario,
              mensagem: `⚠️ POSSÍVEL FAVORITISMO: ${tipoAval} de ${avaliador} está ${(mediaAvaliacao - mediaOutras).toFixed(0)} pontos acima da média das outras avaliações (${mediaAvaliacao.toFixed(0)}% vs média de ${mediaOutras.toFixed(0)}%).`,
              severidade: 'media'
            })
          }
        })
      }
      
      // 2. Detectar avaliações individuais muito baixas (apenas se não foi detectado viés para esta avaliação)
      avaliacoesList.forEach((av, index) => {
        // Pular se já foi detectado viés para esta avaliação
        if (avaliacoesComVies.has(av.id || index)) return
        
        const mediaAvaliacao = (parseFloat(av.media_tecnica || 0) + parseFloat(av.media_emocional || 0)) / 2
        
        // Só alertar se for muito baixa E não houver outras avaliações para comparar (ou se todas forem baixas)
        if (avaliacoesList.length === 1 && mediaAvaliacao < 50) {
          alertas.push({
            tipo: 'avaliacao_baixa',
            funcionario,
            mensagem: `Avaliação muito baixa detectada (${mediaAvaliacao.toFixed(0)}% - Técnica: ${parseFloat(av.media_tecnica || 0).toFixed(0)}%, Emocional: ${parseFloat(av.media_emocional || 0).toFixed(0)}%) - ${av.tipo_avaliacao === 'auto' ? 'Auto-avaliação' : av.tipo_avaliacao === 'gestor' ? 'Avaliação do Gestor' : 'Avaliação'}`,
            severidade: mediaAvaliacao < 30 ? 'alta' : 'media'
          })
        }
      })

      // 2. Detectar discrepâncias entre auto-avaliação e avaliação do gestor (quando houver ambas)
      if (avaliacoesList.length >= 2) {
        const autoAvaliacao = avaliacoesList.find(a => a.tipo_avaliacao === 'auto')
        const avaliacaoGestor = avaliacoesList.find(a => a.tipo_avaliacao === 'gestor')

        if (autoAvaliacao && avaliacaoGestor) {
          const difTecnica = Math.abs(parseFloat(autoAvaliacao.media_tecnica) - parseFloat(avaliacaoGestor.media_tecnica))
          const difEmocional = Math.abs(parseFloat(autoAvaliacao.media_emocional) - parseFloat(avaliacaoGestor.media_emocional))

          if (difTecnica > 30 || difEmocional > 30) {
            alertas.push({
              tipo: 'discrepancia',
              funcionario,
              mensagem: `Grande discrepância entre auto-avaliação e avaliação do gestor (${difTecnica.toFixed(0)}% técnica, ${difEmocional.toFixed(0)}% emocional)`,
              severidade: 'alta'
            })
          }
        }

        // 3. Detectar padrões consistentes de avaliações muito baixas ou muito altas
        const avaliacoesGestor = avaliacoesList.filter(a => a.tipo_avaliacao === 'gestor')
        if (avaliacoesGestor.length > 0) {
          const mediasGestor = avaliacoesGestor.map(a => (parseFloat(a.media_tecnica) + parseFloat(a.media_emocional)) / 2)
          const mediaGeralGestor = mediasGestor.reduce((a, b) => a + b, 0) / mediasGestor.length

          if (mediaGeralGestor < 40) {
            alertas.push({
              tipo: 'extremo_baixo',
              funcionario,
              mensagem: `Avaliações consistentemente muito baixas (média ${mediaGeralGestor.toFixed(0)}%) - possível viés negativo ou necessidade de atenção`,
              severidade: mediaGeralGestor < 30 ? 'alta' : 'media'
            })
          } else if (mediaGeralGestor > 95) {
            alertas.push({
              tipo: 'extremo_alto',
              funcionario,
              mensagem: `Avaliações consistentemente muito altas (média ${mediaGeralGestor.toFixed(0)}%) - possível viés positivo`,
              severidade: 'media'
            })
          }
        }
      }
    })

    return { alertas, statusFuncionarios: statusFuncionarios.sort((a, b) => b.mediaGeral - a.mediaGeral) }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Avaliação Comportamental Técnica
          </h1>
          <p className="text-muted-foreground">
            Análise objetiva baseada em comportamentos observáveis
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex border-b border-border overflow-x-auto">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'avaliar'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setCurrentTab('avaliar')}
            >
              ✍️ Nova Avaliação
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'vies'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setCurrentTab('vies')}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Análise de Viés
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'graficos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setCurrentTab('graficos')}
            >
              <PieChart className="w-4 h-4 inline mr-2" />
              Matriz de Decisão
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'tokens'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setCurrentTab('tokens')
                loadTokens()
              }}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Gerenciar Tokens
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === 'inicio'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setCurrentTab('inicio')}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Como Funciona
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {currentTab === 'inicio' && <InicioTab />}
          {currentTab === 'avaliar' && (
            <CriarAvaliacaoTab
              colaboradores={colaboradores}
              onGenerateToken={handleGenerateToken}
            />
          )}
          {currentTab === 'dashboard' && (
            <DashboardTab avaliacoes={avaliacoes} />
          )}
          {currentTab === 'vies' && (
            <ViesTab avaliacoes={avaliacoes} detectarVies={detectarVies} colaboradores={colaboradores} />
          )}
          {currentTab === 'graficos' && (
            <GraficosTab avaliacoes={avaliacoes} colaboradores={colaboradores} />
          )}
          {currentTab === 'tokens' && (
            <TokensTab
              tokens={tokens}
              colaboradores={colaboradores}
              onGenerateToken={handleGenerateToken}
              onDeleteToken={handleDeleteToken}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}

// Componentes das abas
function InicioTab() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Como Funciona o Sistema</h2>

      <div className="space-y-6">
        <div className="border-l-4 border-primary pl-6 py-2">
          <h3 className="text-lg font-semibold text-primary mb-2">1. Avaliação por Frequência</h3>
          <p className="text-muted-foreground mb-3">
            Ao invés de dar notas de 1 a 10 (subjetivo), o avaliador indica com que <strong>frequência</strong> o comportamento é observado:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Nunca (0%)</strong> - Não demonstra esse comportamento</li>
            <li>• <strong className="text-foreground">Raramente (25%)</strong> - Menos de 25% das situações</li>
            <li>• <strong className="text-foreground">Às vezes (50%)</strong> - Cerca de 50% das situações</li>
            <li>• <strong className="text-foreground">Frequentemente (75%)</strong> - Mais de 75% das situações</li>
            <li>• <strong className="text-foreground">Sempre (100%)</strong> - Consistentemente demonstra</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-6 py-2">
          <h3 className="text-lg font-semibold text-purple-500 mb-2">2. Competências Baseadas em Comportamentos</h3>
          <p className="text-muted-foreground mb-3">
            Todas as perguntas são sobre <strong>comportamentos específicos e observáveis</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="inline-block px-2 py-1 bg-blue-500/20 text-blue-600 text-xs font-semibold rounded mb-2">Técnicas</div>
              <div className="text-sm text-muted-foreground">17 comportamentos relacionados a habilidades e conhecimento técnico</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="inline-block px-2 py-1 bg-purple-500/20 text-purple-600 text-xs font-semibold rounded mb-2">Emocionais</div>
              <div className="text-sm text-muted-foreground">13 comportamentos relacionados a atitude e caráter</div>
            </div>
          </div>
        </div>

        <div className="border-l-4 border-green-500 pl-6 py-2">
          <h3 className="text-lg font-semibold text-green-500 mb-2">3. Avaliação 360°</h3>
          <p className="text-muted-foreground mb-3">
            Múltiplas perspectivas para maior objetividade:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-1">👤</div>
              <div className="font-medium text-foreground">Auto-avaliação</div>
              <div className="text-xs text-muted-foreground">Própria perspectiva</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-1">👔</div>
              <div className="font-medium text-foreground">Gestor</div>
              <div className="text-xs text-muted-foreground">Visão da liderança</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-1">🤝</div>
              <div className="font-medium text-foreground">Pares</div>
              <div className="text-xs text-muted-foreground">Colegas de trabalho</div>
            </div>
          </div>
        </div>

        <div className="border-l-4 border-yellow-500 pl-6 py-2">
          <h3 className="text-lg font-semibold text-yellow-500 mb-2">4. Detecção Automática de Viés</h3>
          <p className="text-muted-foreground mb-3">
            O sistema analisa estatisticamente as avaliações e detecta:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Grandes discrepâncias entre auto-avaliação e avaliação do gestor</li>
            <li>• Padrões de avaliações extremamente baixas (possível perseguição)</li>
            <li>• Padrões de avaliações extremamente altas (possível favoritismo)</li>
            <li>• Inconsistências entre múltiplos avaliadores</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-6 bg-primary/10 border border-primary/30 rounded-lg">
        <h3 className="font-semibold text-primary mb-2">💡 Benefício Principal</h3>
        <p className="text-muted-foreground">
          Este sistema torna a avaliação muito mais <strong>objetiva, justa e defensável</strong>,
          eliminando a subjetividade das notas de 1-10 e fornecendo dados concretos sobre
          comportamentos observáveis ao longo do tempo.
        </p>
      </div>

      <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
        <h3 className="font-semibold text-green-600 mb-2">🔗 Sistema de Tokens Seguros</h3>
        <p className="text-muted-foreground mb-4">
          Para garantir segurança, cada funcionário recebe um link único com token. Acesse a aba "Gerenciar Tokens" para gerar links personalizados.
        </p>
        <p className="text-xs text-muted-foreground">
          Cada token está vinculado a um funcionário específico e só pode ser usado uma vez.
        </p>
      </div>
    </div>
  )
}

function CriarAvaliacaoTab({ colaboradores, onGenerateToken }) {
  const [selectedColaborador, setSelectedColaborador] = useState('')
  const [tipoAvaliacao, setTipoAvaliacao] = useState('auto')
  const [avaliadorNome, setAvaliadorNome] = useState('')
  const [avaliadorEmail, setAvaliadorEmail] = useState('')
  const [diasExpiracao, setDiasExpiracao] = useState('30')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!selectedColaborador) {
      alert('Selecione um funcionário')
      return
    }

    const colaborador = colaboradores.find(c => c.id === selectedColaborador)
    if (!colaborador) {
      alert('Funcionário não encontrado')
      return
    }

    try {
      setGenerating(true)
      const expiraEm = diasExpiracao ? new Date(Date.now() + parseInt(diasExpiracao) * 24 * 60 * 60 * 1000).toISOString() : null

      await onGenerateToken({
        colaborador_id: colaborador.id,
        colaborador_nome: colaborador.nome,
        tipo_avaliacao: tipoAvaliacao,
        avaliador_nome: avaliadorNome || null,
        avaliador_email: avaliadorEmail || null,
        expira_em: expiraEm
      })

      // Reset form
      setSelectedColaborador('')
      setAvaliadorNome('')
      setAvaliadorEmail('')
      setDiasExpiracao('30')
      setTipoAvaliacao('auto')
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-foreground mb-2">Criar Nova Avaliação</h3>
        <p className="text-muted-foreground">
          Gere um token único para que o funcionário ou avaliador possa acessar e responder a avaliação
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Funcionário *
          </label>
          <select
            value={selectedColaborador}
            onChange={(e) => setSelectedColaborador(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">Selecione um funcionário</option>
            {colaboradores.map((col) => (
              <option key={col.id} value={col.id}>
                {col.nome} {col.cargo ? `- ${col.cargo}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tipo de Avaliação *
          </label>
          <select
            value={tipoAvaliacao}
            onChange={(e) => setTipoAvaliacao(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="auto">Auto-avaliação</option>
            <option value="par">Avaliação de Par</option>
            <option value="gestor">Avaliação do Gestor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome do Avaliador (Opcional)
          </label>
          <input
            type="text"
            value={avaliadorNome}
            onChange={(e) => setAvaliadorNome(e.target.value)}
            placeholder="Nome de quem vai avaliar"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email do Avaliador (Opcional)
          </label>
          <input
            type="email"
            value={avaliadorEmail}
            onChange={(e) => setAvaliadorEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Expira em (dias) - Deixe vazio para não expirar
          </label>
          <input
            type="number"
            value={diasExpiracao}
            onChange={(e) => setDiasExpiracao(e.target.value)}
            placeholder="30"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedColaborador}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Key className="w-4 h-4" />
          {generating ? 'Gerando...' : 'Gerar Token de Avaliação'}
        </button>
      </div>
    </div>
  )
}

function CompetenciaItem({ competencia, valorSelecionado, onChange }) {
  return (
    <div className="border-b border-border pb-6 last:border-0">
      <div className="mb-3">
        <span className="text-sm font-medium text-muted-foreground">#{competencia.id}</span>
        <p className="text-foreground mt-1">{competencia.text}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FREQUENCIAS.map((freq) => (
          <button
            key={freq.value}
            className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
              valorSelecionado === freq.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50'
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

function DashboardTab({ avaliacoes }) {
  if (avaliacoes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2 text-foreground">Nenhuma Avaliação Ainda</h3>
        <p className="text-muted-foreground mb-6">
          Comece criando sua primeira avaliação na aba "Nova Avaliação"
        </p>
      </div>
    )
  }

  // Agrupar por funcionário
  const avaliacoesPorFuncionario = {}
  avaliacoes.forEach((av) => {
    const funcionarioNome = av.colaborador_nome || av.funcionario
    if (!avaliacoesPorFuncionario[funcionarioNome]) {
      avaliacoesPorFuncionario[funcionarioNome] = []
    }
    avaliacoesPorFuncionario[funcionarioNome].push(av)
  })

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-6 text-foreground">
          Resumo das Avaliações
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-primary">
              {Object.keys(avaliacoesPorFuncionario).length}
            </div>
            <div className="text-sm text-muted-foreground">Funcionários Avaliados</div>
          </div>
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-bold text-purple-500">
              {avaliacoes.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Avaliações</div>
          </div>
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-green-500">
              {(
                avaliacoes.reduce(
                  (sum, av) => sum + (parseFloat(av.media_tecnica) + parseFloat(av.media_emocional)) / 2,
                  0
                ) / avaliacoes.length
              ).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Média Geral</div>
          </div>
        </div>
      </div>

      {/* Detalhes por funcionário */}
      {Object.entries(avaliacoesPorFuncionario).map(([funcionario, avs]) => (
        <FuncionarioCard key={funcionario} funcionario={funcionario} avaliacoes={avs} />
      ))}
    </div>
  )
}

function FuncionarioCard({ funcionario, avaliacoes }) {
  const mediaGeralTecnica =
    avaliacoes.reduce((sum, av) => sum + parseFloat(av.media_tecnica), 0) / avaliacoes.length
  const mediaGeralEmocional =
    avaliacoes.reduce((sum, av) => sum + parseFloat(av.media_emocional), 0) / avaliacoes.length

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground">{funcionario}</h3>
          <p className="text-sm text-muted-foreground">{avaliacoes.length} avaliação(ões) registrada(s)</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            {((mediaGeralTecnica + mediaGeralEmocional) / 2).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">Média Geral</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-600 text-xs font-semibold rounded">Técnica</span>
            <span className="text-2xl font-bold text-blue-500">{mediaGeralTecnica.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${mediaGeralTecnica}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-1 bg-purple-500/20 text-purple-600 text-xs font-semibold rounded">Emocional</span>
            <span className="text-2xl font-bold text-purple-500">{mediaGeralEmocional.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full">
            <div
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${mediaGeralEmocional}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Lista de avaliações */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Histórico de Avaliações</h4>
        <div className="space-y-2">
          {avaliacoes.map((av, idx) => (
            <div
              key={idx}
              className="bg-muted/30 p-3 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(av.criado_em).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-sm text-foreground">{av.avaliador_nome}</span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    av.tipo_avaliacao === 'auto'
                      ? 'bg-green-500/20 text-green-600'
                      : av.tipo_avaliacao === 'gestor'
                      ? 'bg-yellow-500/20 text-yellow-600'
                      : 'bg-blue-500/20 text-blue-600'
                  }`}
                >
                  {av.tipo_avaliacao === 'auto' ? 'Auto' : av.tipo_avaliacao === 'gestor' ? 'Gestor' : 'Par'}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-500">T: {parseFloat(av.media_tecnica).toFixed(0)}%</span>
                <span className="text-purple-500">E: {parseFloat(av.media_emocional).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ViesTab({ avaliacoes, detectarVies, colaboradores }) {
  const { alertas, statusFuncionarios } = detectarVies()

  if (avaliacoes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2 text-foreground">Nenhuma Avaliação</h3>
        <p className="text-muted-foreground">
          Não há avaliações para análise
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status dos Funcionários */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-2 text-foreground">
          Status dos Funcionários
        </h3>
        <p className="text-muted-foreground mb-6">
          Visão geral do desempenho de cada funcionário nas avaliações
        </p>

        {statusFuncionarios.length === 0 ? (
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground">Nenhum funcionário com avaliações suficientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusFuncionarios.map((status, idx) => {
              const colaborador = colaboradores.find(c => c.nome === status.funcionario)
              const getStatusColor = () => {
                if (status.corStatus === 'green') return 'bg-green-500/10 border-green-500/30 text-green-600'
                if (status.corStatus === 'blue') return 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                if (status.corStatus === 'yellow') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'
                return 'bg-red-500/10 border-red-500/30 text-red-600'
              }

              const getStatusIcon = () => {
                if (status.status === 'aprovado') {
                  return status.corStatus === 'green' ? '✅' : '✓'
                }
                return '⚠️'
              }

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-lg border ${getStatusColor()}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getStatusIcon()}</span>
                        <h4 className="text-lg font-bold text-foreground">{status.funcionario}</h4>
                      </div>
                      {colaborador && (
                        <p className="text-sm text-muted-foreground">
                          {colaborador.cargo || 'Sem cargo definido'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${
                        status.corStatus === 'green' ? 'text-green-600' :
                        status.corStatus === 'blue' ? 'text-blue-600' :
                        status.corStatus === 'yellow' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {status.mediaGeral.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Média Geral</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Status:</span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded ${
                        status.status === 'aprovado'
                          ? 'bg-green-500/20 text-green-700'
                          : 'bg-red-500/20 text-red-700'
                      }`}>
                        {status.status === 'aprovado' ? '✓ Aprovado' : '✗ Desaprovado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Classificação:</span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded ${
                        status.corStatus === 'green' ? 'bg-green-500/20 text-green-700' :
                        status.corStatus === 'blue' ? 'bg-blue-500/20 text-blue-700' :
                        status.corStatus === 'yellow' ? 'bg-yellow-500/20 text-yellow-700' :
                        'bg-red-500/20 text-red-700'
                      }`}>
                        {status.classificacao}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Técnica</div>
                      <div className="text-lg font-bold text-blue-600">{status.mediaGeralTecnica.toFixed(1)}%</div>
                      <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(status.mediaGeralTecnica, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Emocional</div>
                      <div className="text-lg font-bold text-purple-600">{status.mediaGeralEmocional.toFixed(1)}%</div>
                      <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(status.mediaGeralEmocional, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {status.totalAvaliacoes} avaliação(ões) registrada(s)
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Alertas de Viés */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-2 text-foreground">
          Análise de Viés Estatístico
        </h3>
        <p className="text-muted-foreground mb-6">
          Detecção automática de padrões que podem indicar perseguição, favoritismo ou outros vieses
        </p>

        {alertas.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5" />
            <div>
              <div className="font-semibold mb-1 text-foreground">Nenhum Alerta de Viés Detectado</div>
              <div className="text-sm text-muted-foreground">
                As avaliações parecem estar dentro de padrões normais e consistentes
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map((alerta, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  alerta.severidade === 'alta'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-6 h-6 mt-0.5 ${
                      alerta.severidade === 'alta' ? 'text-yellow-500' : 'text-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-semibold mb-1 text-foreground">{alerta.funcionario}</div>
                    <div className="text-sm text-muted-foreground">{alerta.mensagem}</div>
                    <div className="mt-2 flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          alerta.severidade === 'alta'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-blue-500/20 text-blue-600'
                        }`}
                      >
                        {alerta.severidade === 'alta' ? 'Alta Severidade' : 'Média Severidade'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Critérios de Detecção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Discrepância 360°</h4>
                <p className="text-sm text-muted-foreground">
                  Diferenças maiores que 30% entre auto-avaliação e avaliação do gestor
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📉</span>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Avaliações Extremamente Baixas</h4>
                <p className="text-sm text-muted-foreground">
                  Média geral abaixo de 20% - possível perseguição
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Avaliações Extremamente Altas</h4>
                <p className="text-sm text-muted-foreground">
                  Média geral acima de 95% - possível favoritismo
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Consistência Temporal</h4>
                <p className="text-sm text-muted-foreground">
                  Análise de padrões ao longo de múltiplas avaliações
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GraficosTab({ avaliacoes, colaboradores }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Converter média de 0-100% para escala -5 a +5
  const converterParaEscalaNegativa = (mediaPercentual) => {
    // Conversão: 0% = -5, 50% = 0, 100% = +5
    // Fórmula: valor = (mediaPercentual / 100) * 10 - 5
    const valor = (mediaPercentual / 100) * 10 - 5
    return Math.max(-5, Math.min(5, valor))
  }

  // Classificar em quadrante da matriz 2x2
  const classificarQuadrante = (tecnica, emocional) => {
    const tecnicaEscala = converterParaEscalaNegativa(tecnica)
    const emocionalEscala = converterParaEscalaNegativa(emocional)
    
    const altoTecnico = tecnicaEscala >= 0
    const altaAtitude = emocionalEscala >= 0

    if (altoTecnico && altaAtitude) {
      return {
        quadrante: 'PROMISSOR',
        icone: '✅',
        cor: 'green',
        acao: 'Reter e Promover',
        descricao: 'Alto desempenho técnico e excelente atitude. Funcionário-chave que deve ser retido e promovido.'
      }
    } else if (altoTecnico && !altaAtitude) {
      return {
        quadrante: 'PROBLEMA',
        icone: '⚠️',
        cor: 'orange',
        acao: 'Desenvolver ou Demitir',
        descricao: 'Boa competência técnica mas atitude problemática. Requer desenvolvimento comportamental ou considerar demissão.'
      }
    } else if (!altoTecnico && altaAtitude) {
      return {
        quadrante: 'POTENCIAL',
        icone: '🌱',
        cor: 'blue',
        acao: 'Treinar e Desenvolver',
        descricao: 'Boa atitude mas precisa desenvolver competências técnicas. Investir em treinamento.'
      }
    } else {
      return {
        quadrante: 'DEMITIR',
        icone: '❌',
        cor: 'red',
        acao: 'Demitir',
        descricao: 'Baixa competência técnica e atitude problemática. Considerar demissão.'
      }
    }
  }

  // Função para determinar ação baseada na média (mantida para compatibilidade)
  const determinarAcao = (mediaGeral) => {
    if (mediaGeral >= 80) {
      return {
        acao: 'Oportunidades',
        descricao: 'Funcionário de alto desempenho. Deve receber oportunidades de crescimento, projetos desafiadores e possíveis promoções.',
        cor: 'green',
        icone: '🚀',
        prioridade: 'alta'
      }
    } else if (mediaGeral >= 60) {
      return {
        acao: 'Desenvolvimento',
        descricao: 'Bom desempenho. Deve receber oportunidades de desenvolvimento e crescimento profissional.',
        cor: 'blue',
        icone: '📈',
        prioridade: 'media'
      }
    } else if (mediaGeral >= 40) {
      return {
        acao: 'Treinamento',
        descricao: 'Desempenho regular. Deve passar por treinamento e estudar mais para melhorar suas competências.',
        cor: 'yellow',
        icone: '📚',
        prioridade: 'media'
      }
    } else if (mediaGeral >= 20) {
      return {
        acao: 'Advertência Verbal',
        descricao: 'Desempenho abaixo do esperado. Deve receber advertência verbal e plano de melhoria com acompanhamento.',
        cor: 'orange',
        icone: '⚠️',
        prioridade: 'alta'
      }
    } else {
      return {
        acao: 'Demissão',
        descricao: 'Desempenho muito abaixo do esperado. Avaliar possibilidade de demissão após análise de todos os fatores.',
        cor: 'red',
        icone: '🔴',
        prioridade: 'critica'
      }
    }
  }

  // Agrupar avaliações por funcionário
  const avaliacoesPorFuncionario = {}
  avaliacoes.forEach((av) => {
    const funcionarioNome = av.colaborador_nome || av.funcionario
    if (!avaliacoesPorFuncionario[funcionarioNome]) {
      avaliacoesPorFuncionario[funcionarioNome] = []
    }
    avaliacoesPorFuncionario[funcionarioNome].push(av)
  })

  // Calcular dados para cada funcionário
  const funcionariosComAcoes = Object.entries(avaliacoesPorFuncionario).map(([funcionario, avaliacoesList]) => {
    const mediaGeralTecnica = avaliacoesList.reduce((sum, av) => sum + parseFloat(av.media_tecnica || 0), 0) / avaliacoesList.length
    const mediaGeralEmocional = avaliacoesList.reduce((sum, av) => sum + parseFloat(av.media_emocional || 0), 0) / avaliacoesList.length
    const mediaGeral = (mediaGeralTecnica + mediaGeralEmocional) / 2
    const acao = determinarAcao(mediaGeral)
    const quadrante = classificarQuadrante(mediaGeralTecnica, mediaGeralEmocional)
    const colaborador = colaboradores.find(c => c.nome === funcionario)
    
    // Calcular perguntas críticas automaticamente baseado nas médias
    const calcularPerguntaContrataria = (mediaTecnica, mediaEmocional) => {
      if (mediaTecnica >= 70 && mediaEmocional >= 70) return true
      if (mediaTecnica >= 60 && mediaEmocional >= 60) return null // TALVEZ
      return false
    }

    const calcularPerguntaSentiriaFalta = (mediaGeral, temViesCritico = false) => {
      if (mediaGeral >= 75 && !temViesCritico) return true
      if (mediaGeral >= 60 && mediaGeral < 75) return null // TALVEZ
      return false
    }

    // Verificar se há alertas críticos de viés
    const temViesCritico = avaliacoesList.some(av => {
      const mediaAv = (parseFloat(av.media_tecnica) + parseFloat(av.media_emocional)) / 2
      return mediaAv < 20 // Avaliações muito baixas indicam possível viés
    })

    const perguntaContrataria = calcularPerguntaContrataria(mediaGeralTecnica, mediaGeralEmocional)
    const perguntaSentiriaFalta = calcularPerguntaSentiriaFalta(mediaGeral, temViesCritico)

    return {
      funcionario,
      colaborador,
      mediaGeral,
      mediaGeralTecnica,
      mediaGeralEmocional,
      tecnicaEscala: converterParaEscalaNegativa(mediaGeralTecnica),
      emocionalEscala: converterParaEscalaNegativa(mediaGeralEmocional),
      acao,
      quadrante,
      perguntaContrataria,
      perguntaSentiriaFalta,
      totalAvaliacoes: avaliacoesList.length
    }
  }).sort((a, b) => b.mediaGeral - a.mediaGeral)

  // Agrupar por ação para gráficos
  const distribuicaoAcoes = {}
  funcionariosComAcoes.forEach(f => {
    if (!distribuicaoAcoes[f.acao.acao]) {
      distribuicaoAcoes[f.acao.acao] = {
        quantidade: 0,
        cor: f.acao.cor,
        icone: f.acao.icone
      }
    }
    distribuicaoAcoes[f.acao.acao].quantidade++
  })

  // Calcular percentuais para gráfico
  const totalFuncionarios = funcionariosComAcoes.length
  const dadosGrafico = Object.entries(distribuicaoAcoes).map(([acao, dados]) => ({
    acao,
    quantidade: dados.quantidade,
    percentual: totalFuncionarios > 0 ? (dados.quantidade / totalFuncionarios) * 100 : 0,
    cor: dados.cor,
    icone: dados.icone
  }))

  if (avaliacoes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2 text-foreground">Nenhuma Avaliação</h3>
        <p className="text-muted-foreground">
          Não há avaliações para análise da matriz de decisão
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Matriz 2x2 - Scatter Plot */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-2 text-foreground">
            Matriz de Decisão 2x2
          </h3>
          <p className="text-muted-foreground text-sm">
            Posicionamento dos colaboradores baseado em Competência Técnica e Atitude/Inteligência Emocional
          </p>
        </div>
        
        {/* Scatter Plot */}
        <div className="relative bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg p-6 mb-6 overflow-x-auto">
          <div className="min-w-[600px] relative">
            {/* Tooltip */}
            {hoveredPoint && (
              <div
                className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  transform: 'translate(-50%, calc(-100% - 10px))'
                }}
              >
                  <div className="text-sm font-semibold text-foreground mb-1">{hoveredPoint.funcionario}</div>
                <div className="text-xs text-muted-foreground">
                  <div>Atitude/IE: <span className="font-semibold">{hoveredPoint.emocionalEscala >= 0 ? '+' : ''}{hoveredPoint.emocionalEscala.toFixed(1)}</span></div>
                  <div>Competência Técnica: <span className="font-semibold">{hoveredPoint.tecnicaEscala >= 0 ? '+' : ''}{hoveredPoint.tecnicaEscala.toFixed(1)}</span></div>
                  <div className="mt-1 pt-1 border-t border-border">
                    Coordenadas: <span className="font-mono">({hoveredPoint.emocionalEscala >= 0 ? '+' : ''}{hoveredPoint.emocionalEscala.toFixed(1)}, {hoveredPoint.tecnicaEscala >= 0 ? '+' : ''}{hoveredPoint.tecnicaEscala.toFixed(1)})</span>
                  </div>
                </div>
              </div>
            )}
            <svg width="100%" height="600" viewBox="0 0 600 600" className="border border-border rounded-lg bg-background">
            {/* Fundo dos quadrantes - divisão em 5 (meio) */}
            <g>
              {/* PROMISSOR - Superior Direito (X >= 5, Y >= 5) */}
              <rect x="300" y="50" width="250" height="250" fill="rgba(34, 197, 94, 0.08)" />
              {/* PROBLEMA - Superior Esquerdo (X < 5, Y >= 5) */}
              <rect x="50" y="50" width="250" height="250" fill="rgba(249, 115, 22, 0.08)" />
              {/* POTENCIAL - Inferior Direito (X >= 5, Y < 5) */}
              <rect x="300" y="300" width="250" height="250" fill="rgba(59, 130, 246, 0.08)" />
              {/* DEMITIR - Inferior Esquerdo (X < 5, Y < 5) */}
              <rect x="50" y="300" width="250" height="250" fill="rgba(239, 68, 68, 0.08)" />
            </g>
            
            {/* Grid lines - linhas de grade mais suaves (-5 a +5) */}
            {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(i => {
              // Mapear -5 a +5 para posições 50-550, com 0 no centro (300)
              const xPos = 300 + (i / 5) * 250
              const yPos = 300 - (i / 5) * 250 // Invertido para Y
              return (
                <g key={i}>
                  <line x1={xPos} y1="50" x2={xPos} y2="550" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  <line x1="50" y1={yPos} x2="550" y2={yPos} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                </g>
              )
            })}
            
            {/* Linhas centrais divisórias (0 em cada eixo) - mais destacadas */}
            <line x1="300" y1="50" x2="300" y2="550" stroke="#4b5563" strokeWidth="2.5" />
            <line x1="50" y1="300" x2="550" y2="300" stroke="#4b5563" strokeWidth="2.5" />
            
            {/* Labels numéricos nos eixos - Eixo X (Atitude) -5 a +5 */}
            {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(i => {
              const xPos = 300 + (i / 5) * 250
              return (
                <g key={`x-${i}`}>
                  <text 
                    x={xPos} 
                    y="575" 
                    textAnchor="middle" 
                    className="text-xs fill-foreground font-semibold"
                    style={{ fontSize: '11px' }}
                  >
                    {i >= 0 ? `+${i}` : i}
                  </text>
                  {/* Marcador no eixo */}
                  <line 
                    x1={xPos} 
                    y1="550" 
                    x2={xPos} 
                    y2="555" 
                    stroke="#6b7280" 
                    strokeWidth="2"
                  />
                </g>
              )
            })}
            
            {/* Labels numéricos nos eixos - Eixo Y (Técnica) -5 a +5 */}
            {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(i => {
              const yPos = 300 - (i / 5) * 250 // Invertido para Y
              return (
                <g key={`y-${i}`}>
                  <text 
                    x="35" 
                    y={yPos + 5} 
                    textAnchor="middle" 
                    className="text-xs fill-foreground font-semibold"
                    style={{ fontSize: '11px' }}
                  >
                    {i >= 0 ? `+${i}` : i}
                  </text>
                  {/* Marcador no eixo */}
                  <line 
                    x1="50" 
                    y1={yPos} 
                    x2="55" 
                    y2={yPos} 
                    stroke="#6b7280" 
                    strokeWidth="2"
                  />
                </g>
              )
            })}
            
            {/* Labels dos quadrantes - melhor posicionados */}
            <g>
              {/* PROMISSOR - Superior Direito */}
              <text x="425" y="80" textAnchor="middle" className="text-base font-bold fill-green-600" style={{ fontSize: '14px' }}>✅ PROMISSOR</text>
              <text x="425" y="100" textAnchor="middle" className="text-xs fill-green-600/80" style={{ fontSize: '11px' }}>Reter e Promover</text>
              
              {/* PROBLEMA - Superior Esquerdo */}
              <text x="175" y="80" textAnchor="middle" className="text-base font-bold fill-orange-600" style={{ fontSize: '14px' }}>⚠️ PROBLEMA</text>
              <text x="175" y="100" textAnchor="middle" className="text-xs fill-orange-600/80" style={{ fontSize: '11px' }}>Desenvolver ou Demitir</text>
              
              {/* POTENCIAL - Inferior Direito */}
              <text x="425" y="520" textAnchor="middle" className="text-base font-bold fill-blue-600" style={{ fontSize: '14px' }}>🌱 POTENCIAL</text>
              <text x="425" y="540" textAnchor="middle" className="text-xs fill-blue-600/80" style={{ fontSize: '11px' }}>Treinar e Desenvolver</text>
              
              {/* DEMITIR - Inferior Esquerdo */}
              <text x="175" y="520" textAnchor="middle" className="text-base font-bold fill-red-600" style={{ fontSize: '14px' }}>❌ DEMITIR</text>
              <text x="175" y="540" textAnchor="middle" className="text-xs fill-red-600/80" style={{ fontSize: '11px' }}>Demitir</text>
            </g>
            
            {/* Eixos labels principais */}
            <text x="300" y="590" textAnchor="middle" className="text-sm font-bold fill-foreground" style={{ fontSize: '13px' }}>Atitude / Inteligência Emocional (-5 a +5)</text>
            <text x="20" y="300" textAnchor="middle" className="text-sm font-bold fill-foreground" transform="rotate(-90 20 300)" style={{ fontSize: '13px' }}>Competência Técnica (-5 a +5)</text>
            
            {/* Pontos no scatter plot */}
            {funcionariosComAcoes.map((item, idx) => {
              // Mapear valores -5 a +5 para posições 50-550 (área útil do gráfico)
              // Valor 0 deve estar exatamente no meio (300)
              // Fórmula: x = 300 + (valor / 5) * 250
              // Para Y (invertido): y = 300 - (valor / 5) * 250
              const x = 300 + (item.emocionalEscala / 5) * 250
              const y = 300 - (item.tecnicaEscala / 5) * 250 // Invertido: valores positivos no topo
              
              const getCor = () => {
                if (item.quadrante.cor === 'green') return '#22c55e'
                if (item.quadrante.cor === 'orange') return '#f97316'
                if (item.quadrante.cor === 'blue') return '#3b82f6'
                return '#ef4444'
              }
              
              return (
                <g key={idx}>
                  {/* Sombra do círculo */}
                  <circle
                    cx={x + 1}
                    cy={y + 1}
                    r="10"
                    fill="rgba(0,0,0,0.1)"
                  />
                  {/* Círculo principal */}
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill={getCor()}
                    stroke="white"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all"
                    style={{ 
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                      r: hoveredPoint?.idx === idx ? '14' : '10'
                    }}
                    onMouseEnter={(e) => {
                      setHoveredPoint({
                        funcionario: item.funcionario,
                        emocionalEscala: item.emocionalEscala,
                        tecnicaEscala: item.tecnicaEscala,
                        idx
                      })
                      setTooltipPos({
                        x: e.clientX,
                        y: e.clientY
                      })
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({
                        x: e.clientX,
                        y: e.clientY
                      })
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null)
                    }}
                  />
                  {/* Nome do funcionário */}
                  <text
                    x={x}
                    y={y - 18}
                    textAnchor="middle"
                    className="text-xs font-bold fill-foreground pointer-events-none"
                    style={{ fontSize: '11px', fontWeight: '600' }}
                  >
                    {item.funcionario.split(' ')[0]}
                  </text>
                  {/* Coordenadas exatas */}
                  <text
                    x={x}
                    y={y + 28}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    ({item.emocionalEscala >= 0 ? '+' : ''}{item.emocionalEscala.toFixed(1)}, {item.tecnicaEscala >= 0 ? '+' : ''}{item.tecnicaEscala.toFixed(1)})
                  </text>
                </g>
              )
            })}
            </svg>
          </div>
        </div>

        {/* Legenda dos Quadrantes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">✅</div>
            <h4 className="font-semibold text-green-600 mb-1">PROMISSOR</h4>
            <p className="text-xs text-muted-foreground">Alto Técnico + Alta Atitude</p>
            <p className="text-xs text-muted-foreground mt-1">Reter e Promover</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">⚠️</div>
            <h4 className="font-semibold text-orange-600 mb-1">PROBLEMA</h4>
            <p className="text-xs text-muted-foreground">Alto Técnico + Baixa Atitude</p>
            <p className="text-xs text-muted-foreground mt-1">Desenvolver ou Demitir</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">🌱</div>
            <h4 className="font-semibold text-blue-600 mb-1">POTENCIAL</h4>
            <p className="text-xs text-muted-foreground">Baixo Técnico + Alta Atitude</p>
            <p className="text-xs text-muted-foreground mt-1">Treinar e Desenvolver</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">❌</div>
            <h4 className="font-semibold text-red-600 mb-1">DEMITIR</h4>
            <p className="text-xs text-muted-foreground">Baixo Técnico + Baixa Atitude</p>
            <p className="text-xs text-muted-foreground mt-1">Demitir</p>
          </div>
        </div>
      </div>

      {/* Matriz de Decisão - Legenda Antiga (mantida para referência) */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-foreground">
          Critérios por Percentual (Referência)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-semibold text-green-600 mb-1">≥ 80% - Oportunidades</h4>
            <p className="text-xs text-muted-foreground">Alto desempenho - Promoções e projetos desafiadores</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-semibold text-blue-600 mb-1">60-79% - Desenvolvimento</h4>
            <p className="text-xs text-muted-foreground">Bom desempenho - Oportunidades de crescimento</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-semibold text-yellow-600 mb-1">40-59% - Treinamento</h4>
            <p className="text-xs text-muted-foreground">Regular - Treinamento e estudo</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">⚠️</div>
            <h4 className="font-semibold text-orange-600 mb-1">20-39% - Advertência</h4>
            <p className="text-xs text-muted-foreground">Abaixo do esperado - Advertência verbal</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="text-2xl mb-2">🔴</div>
            <h4 className="font-semibold text-red-600 mb-1">&lt; 20% - Demissão</h4>
            <p className="text-xs text-muted-foreground">Muito abaixo - Avaliar demissão</p>
          </div>
        </div>
      </div>

      {/* Gráfico de Distribuição */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-foreground">
          Distribuição de Ações Recomendadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Barras Horizontal */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Por Quantidade</h4>
            <div className="space-y-3">
              {dadosGrafico.map((item, idx) => {
                const getCorClasses = () => {
                  if (item.cor === 'green') return 'bg-green-500'
                  if (item.cor === 'blue') return 'bg-blue-500'
                  if (item.cor === 'yellow') return 'bg-yellow-500'
                  if (item.cor === 'orange') return 'bg-orange-500'
                  return 'bg-red-500'
                }
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        <span>{item.icone}</span>
                        {item.acao}
                      </span>
                      <span className="text-muted-foreground">{item.quantidade} funcionário(s)</span>
                    </div>
                    <div className="w-full bg-muted h-6 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getCorClasses()} transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${(item.quantidade / totalFuncionarios) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {item.percentual.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gráfico de Pizza Simples */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Por Percentual</h4>
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {dadosGrafico.reduce((acc, item, idx) => {
                    const startAngle = acc.currentAngle
                    const angle = (item.percentual / 100) * 360
                    const endAngle = startAngle + angle
                    
                    const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180)
                    const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180)
                    const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180)
                    const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180)
                    
                    const largeArc = angle > 180 ? 1 : 0
                    
                    const getCor = () => {
                      if (item.cor === 'green') return '#22c55e'
                      if (item.cor === 'blue') return '#3b82f6'
                      if (item.cor === 'yellow') return '#eab308'
                      if (item.cor === 'orange') return '#f97316'
                      return '#ef4444'
                    }
                    
                    const path = (
                      <path
                        key={idx}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={getCor()}
                        stroke="white"
                        strokeWidth="2"
                      />
                    )
                    
                    acc.paths.push(path)
                    acc.currentAngle = endAngle
                    return acc
                  }, { currentAngle: 0, paths: [] }).paths}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{totalFuncionarios}</div>
                    <div className="text-sm text-muted-foreground">Funcionários</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {dadosGrafico.map((item, idx) => {
                const getCorClasses = () => {
                  if (item.cor === 'green') return 'bg-green-500'
                  if (item.cor === 'blue') return 'bg-blue-500'
                  if (item.cor === 'yellow') return 'bg-yellow-500'
                  if (item.cor === 'orange') return 'bg-orange-500'
                  return 'bg-red-500'
                }
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded ${getCorClasses()}`}></div>
                    <span className="text-foreground">{item.icone} {item.acao}: {item.percentual.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários com Ações */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-foreground">
          Recomendações por Funcionário
        </h3>
        <div className="space-y-4">
          {funcionariosComAcoes.map((item, idx) => {
            const getAcaoClasses = () => {
              if (item.acao.cor === 'green') return 'bg-green-500/10 border-green-500/30'
              if (item.acao.cor === 'blue') return 'bg-blue-500/10 border-blue-500/30'
              if (item.acao.cor === 'yellow') return 'bg-yellow-500/10 border-yellow-500/30'
              if (item.acao.cor === 'orange') return 'bg-orange-500/10 border-orange-500/30'
              return 'bg-red-500/10 border-red-500/30'
            }

            const getAcaoTextClasses = () => {
              if (item.acao.cor === 'green') return 'text-green-600'
              if (item.acao.cor === 'blue') return 'text-blue-600'
              if (item.acao.cor === 'yellow') return 'text-yellow-600'
              if (item.acao.cor === 'orange') return 'text-orange-600'
              return 'text-red-600'
            }

            return (
              <div
                key={idx}
                className={`p-5 rounded-lg border ${getAcaoClasses()}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{item.acao.icone}</span>
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{item.funcionario}</h4>
                        {item.colaborador && (
                          <p className="text-sm text-muted-foreground">{item.colaborador.cargo || 'Sem cargo definido'}</p>
                        )}
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${getAcaoTextClasses()} bg-white/50`}>
                        {item.acao.acao}
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                        item.quadrante.cor === 'green' ? 'text-green-600 bg-green-500/20' :
                        item.quadrante.cor === 'orange' ? 'text-orange-600 bg-orange-500/20' :
                        item.quadrante.cor === 'blue' ? 'text-blue-600 bg-blue-500/20' :
                        'text-red-600 bg-red-500/20'
                      }`}>
                        {item.quadrante.icone} {item.quadrante.quadrante}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.quadrante.descricao}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                      <span>
                        <strong>Contrataria hoje?</strong> {
                          item.perguntaContrataria === true ? '✅ Sim' : 
                          item.perguntaContrataria === false ? '❌ Não' : 
                          '⚠️ Talvez'
                        }
                      </span>
                      <span>
                        <strong>Sentiria falta?</strong> {
                          item.perguntaSentiriaFalta === true ? '✅ Sim' : 
                          item.perguntaSentiriaFalta === false ? '❌ Não' : 
                          '⚠️ Talvez'
                        }
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.acao.descricao}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-foreground">
                      {item.mediaGeral.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Média Geral</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-background/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Competência Técnica</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-bold text-blue-600">{item.mediaGeralTecnica.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">({item.tecnicaEscala >= 0 ? '+' : ''}{item.tecnicaEscala.toFixed(1)})</div>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(item.mediaGeralTecnica, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Atitude / IE</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-bold text-purple-600">{item.mediaGeralEmocional.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">({item.emocionalEscala >= 0 ? '+' : ''}{item.emocionalEscala.toFixed(1)})</div>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full mt-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min(item.mediaGeralEmocional, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Baseado em {item.totalAvaliacoes} avaliação(ões)
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
