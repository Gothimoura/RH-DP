import { useState } from 'react'
import { Key, Copy, Trash2 } from 'lucide-react'

export default function TokensTab({ tokens, colaboradores, onGenerateToken, onDeleteToken }) {
  const [showGenerateModal, setShowGenerateModal] = useState(false)
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

      setShowGenerateModal(false)
      setSelectedColaborador('')
      setAvaliadorNome('')
      setAvaliadorEmail('')
      setDiasExpiracao('30')
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyLink = (token) => {
    const link = `${window.location.origin}/avaliacoes/public/${token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado para a área de transferência!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">Gerenciar Tokens de Acesso</h3>
            <p className="text-muted-foreground mt-1">
              Gere tokens únicos para cada funcionário acessar sua avaliação
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Gerar Novo Token
          </button>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum token gerado ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Gerar Novo Token" para começar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className={`p-4 rounded-lg border ${
                  token.usado
                    ? 'bg-muted/50 border-border opacity-60'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{token.colaborador_nome}</h4>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          token.tipo_avaliacao === 'auto'
                            ? 'bg-green-500/20 text-green-600'
                            : token.tipo_avaliacao === 'gestor'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-blue-500/20 text-blue-600'
                        }`}
                      >
                        {token.tipo_avaliacao === 'auto' ? 'Auto' : token.tipo_avaliacao === 'gestor' ? 'Gestor' : 'Par'}
                      </span>
                      {token.usado && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-500/20 text-gray-600">
                          Usado
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Token:</strong>{' '}
                        <code className="bg-muted px-2 py-1 rounded font-mono text-xs">{token.token}</code>
                      </p>
                      {token.avaliador_nome && (
                        <p>
                          <strong className="text-foreground">Avaliador:</strong> {token.avaliador_nome}
                        </p>
                      )}
                      {token.expira_em && (
                        <p>
                          <strong className="text-foreground">Expira em:</strong>{' '}
                          {new Date(token.expira_em).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {token.usado && token.usado_em && (
                        <p>
                          <strong className="text-foreground">Usado em:</strong>{' '}
                          {new Date(token.usado_em).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!token.usado && (
                      <button
                        onClick={() => copyLink(token.token)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Copiar link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteToken(token.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir token"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Geração */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Gerar Novo Token</h3>

            <div className="space-y-4">
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
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                disabled={generating}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedColaborador}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
              >
                {generating ? 'Gerando...' : 'Gerar Token'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
