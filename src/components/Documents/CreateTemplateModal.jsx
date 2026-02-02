import { useState, useEffect, useRef } from 'react'
import { X, FileText, Code, Type, FileEdit, Eye, Plus, Package, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CreateTemplateModal({ isOpen, onClose, onSuccess, editingTemplate = null }) {
  const [creating, setCreating] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        setCodigo(editingTemplate.codigo || '')
        setNome(editingTemplate.nome || '')
        setConteudo(editingTemplate.conteudo || '')
        setAtivo(editingTemplate.ativo !== undefined ? editingTemplate.ativo : true)
      } else {
        setCodigo('')
        setNome('')
        setConteudo('')
        setAtivo(true)
      }
      setShowPreview(false)
    }
  }, [isOpen, editingTemplate])

  const resetForm = () => {
    setCodigo('')
    setNome('')
    setConteudo('')
    setAtivo(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!codigo || !nome || !conteudo) {
      alert('Código, nome e conteúdo são obrigatórios.')
      return
    }

    setCreating(true)
    try {
      if (editingTemplate) {
        // Atualizar template existente
        const { error } = await supabase
          .from('rh_documentos_templates')
          .update({
            codigo: codigo.trim(),
            nome: nome.trim(),
            conteudo: conteudo.trim(),
            ativo: ativo,
          })
          .eq('id', editingTemplate.id)

        if (error) throw error
      } else {
        // Criar novo template
        const { error } = await supabase
          .from('rh_documentos_templates')
          .insert({
            codigo: codigo.trim(),
            nome: nome.trim(),
            conteudo: conteudo.trim(),
            ativo: ativo,
          })

        if (error) throw error
      }

      resetForm()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      alert('Erro ao salvar template: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {editingTemplate ? 'Editar Template' : 'Criar Template'}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                {editingTemplate ? 'Edite o template de documento' : 'Crie um novo template de documento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Informações sobre variáveis e HTML */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Variáveis automáticas (preenchidas automaticamente):</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p><code className="bg-blue-100 px-1 rounded">{'{{nome}}'}</code> - Nome do funcionário</p>
                <p><code className="bg-blue-100 px-1 rounded">{'{{cargo}}'}</code> - Cargo do funcionário</p>
                <p><code className="bg-blue-100 px-1 rounded">{'{{departamento}}'}</code> - Departamento</p>
                <p><code className="bg-blue-100 px-1 rounded">{'{{data_entrada}}'}</code> - Data de entrada</p>
                <p><code className="bg-blue-100 px-1 rounded">{'{{data}}'}</code> - Data atual</p>
              </div>
            </div>
            <div className="border-t border-blue-300 pt-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Variáveis customizadas:</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>Você pode criar variáveis customizadas como <code className="bg-blue-100 px-1 rounded">{'{{equipamento1}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{observacao}}'}</code>, etc.</p>
                <p className="mt-2"><strong>Exemplo:</strong> Use <code className="bg-blue-100 px-1 rounded">{'{{equipamento1}}'}</code> no template e um campo aparecerá na geração para preencher.</p>
              </div>
            </div>
            <div className="border-t border-blue-300 pt-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">HTML suportado:</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>Você pode usar tags HTML para formatar o documento:</p>
                <p><code className="bg-blue-100 px-1 rounded">{'<h1>, <h2>, <h3>'}</code> - Títulos</p>
                <p><code className="bg-blue-100 px-1 rounded">{'<p>, <br>'}</code> - Parágrafos e quebras</p>
                <p><code className="bg-blue-100 px-1 rounded">{'<strong>, <b>, <em>, <i>'}</code> - Negrito e itálico</p>
                <p><code className="bg-blue-100 px-1 rounded">{'<ul>, <ol>, <li>'}</code> - Listas</p>
                <p><code className="bg-blue-100 px-1 rounded">{'<table>, <tr>, <td>'}</code> - Tabelas</p>
                <p><code className="bg-blue-100 px-1 rounded">{'<div>, <span>'}</code> - Containers</p>
                <p><code className="bg-blue-100 px-1 rounded">{'style="..."'}</code> - Estilos inline</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Code className="w-4 h-4 inline mr-1" />
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: DECLARACAO_TRABALHO"
                required
                disabled={!!editingTemplate}
              />
              <p className="text-xs text-muted-foreground mt-1">Código único para identificar o template</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Type className="w-4 h-4 inline mr-1" />
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Declaração de Trabalho"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Nome exibido na lista de templates</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                <FileEdit className="w-4 h-4 inline mr-1" />
                Conteúdo do Template (HTML) <span className="text-red-500">*</span>
              </label>
              {conteudo && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
                </button>
              )}
            </div>
            {showPreview ? (
              <div className="border border-border rounded-lg p-4 bg-white min-h-[300px] max-h-[400px] overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12pt',
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      // Função para formatar data apenas como DD/MM/YYYY
                      const formatDateOnly = (date) => {
                        if (!date) return ''
                        const d = new Date(date)
                        if (isNaN(d.getTime())) return ''
                        const day = String(d.getDate()).padStart(2, '0')
                        const month = String(d.getMonth() + 1).padStart(2, '0')
                        const year = d.getFullYear()
                        return `${day}/${month}/${year}`
                      }
                      
                      let previewContent = conteudo
                      previewContent = previewContent.replace(/\{\{nome\}\}/g, '<strong>João Silva</strong>')
                      previewContent = previewContent.replace(/\{\{cargo\}\}/g, '<strong>Analista</strong>')
                      previewContent = previewContent.replace(/\{\{departamento\}\}/g, '<strong>TI</strong>')
                      previewContent = previewContent.replace(/\{\{data_entrada\}\}/g, '01/01/2020')
                      previewContent = previewContent.replace(/\{\{data\}\}/g, formatDateOnly(new Date()))
                      return previewContent
                    })()
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const equipamentoCount = (conteudo.match(/\{\{equipamento\d+\}\}/g) || []).length
                        const novoEquipamento = equipamentoCount + 1
                        const cursorPos = textareaRef.current?.selectionStart || conteudo.length
                        const novoConteudo = conteudo.slice(0, cursorPos) + `{{equipamento${novoEquipamento}}}` + conteudo.slice(cursorPos)
                        setConteudo(novoConteudo)
                        // Focar no textarea novamente após um pequeno delay
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus()
                            const newPos = cursorPos + `{{equipamento${novoEquipamento}}}`.length
                            textareaRef.current.setSelectionRange(newPos, newPos)
                          }
                        }, 10)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Equipamento
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cursorPos = textareaRef.current?.selectionStart || conteudo.length
                        const novoConteudo = conteudo.slice(0, cursorPos) + `{{observacao}}` + conteudo.slice(cursorPos)
                        setConteudo(novoConteudo)
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus()
                            const newPos = cursorPos + `{{observacao}}`.length
                            textareaRef.current.setSelectionRange(newPos, newPos)
                          }
                        }, 10)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Adicionar Observação
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cursorPos = textareaRef.current?.selectionStart || conteudo.length
                        const novoConteudo = conteudo.slice(0, cursorPos) + `{{senha}}` + conteudo.slice(cursorPos)
                        setConteudo(novoConteudo)
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus()
                            const newPos = cursorPos + `{{senha}}`.length
                            textareaRef.current.setSelectionRange(newPos, newPos)
                          }
                        }, 10)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      Adicionar Senha
                    </button>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  placeholder={`Exemplo:
<h1 style="text-align: center; color: #2563eb;">DECLARAÇÃO</h1>
<p>Declaro para os devidos fins que <strong>{{nome}}</strong>, portador do cargo de <strong>{{cargo}}</strong>, está lotado no departamento de <strong>{{departamento}}</strong> desde {{data_entrada}}.</p>
<p style="margin-top: 20px;">Data: {{data}}</p>`}
                  required
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Use HTML para formatar o documento. Variáveis: <code className="bg-muted px-1 rounded">{'{{nome}}'}</code>, <code className="bg-muted px-1 rounded">{'{{cargo}}'}</code>, etc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-foreground cursor-pointer">
              Template ativo (visível na lista)
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={creating}
            >
              {creating ? 'Salvando...' : editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

