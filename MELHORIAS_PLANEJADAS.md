# Melhorias Planejadas - Sistema RH-DP

Este documento organiza todas as melhorias solicitadas, categorizadas por área do sistema.

**Data de criação:** 30/01/2026  
**Última atualização:** 30/01/2026

---

## 📊 Resumo Executivo

Este documento contém **11 melhorias** organizadas em **8 categorias**:

- ✅ **1 melhoria** com componentes prontos (só precisa integração)
- 🔴 **10 melhorias** ainda não iniciadas

**Principais áreas de foco:**
- Cadastro e gestão de funcionários (3 melhorias)
- Equipamentos e inventário (2 melhorias)
- Navegação e UX (1 melhoria)
- Dashboard e visualizações (1 melhoria)
- Filtros e listagens (1 melhoria)
- Calendário (1 melhoria)
- Ações rápidas (1 melhoria)
- Histórico e logs (1 melhoria)

**Estimativa de complexidade:**
- 🟢 Baixa: 6 melhorias
- 🟡 Média: 4 melhorias
- 🔴 Alta: 1 melhoria

---

## 📋 Índice

1. [Cadastro de Funcionários](#cadastro-de-funcionários)
2. [Navegação e UX](#navegação-e-ux)
3. [Equipamentos](#equipamentos)
4. [Dashboard](#dashboard)
5. [Filtros e Listagens](#filtros-e-listagens)
6. [Calendário](#calendário)
7. [Ações Rápidas](#ações-rápidas)
8. [Histórico e Logs](#histórico-e-logs)

---

## 1. Cadastro de Funcionários

### 1.1. Telefones com Nomenclatura
**Descrição:** Separar e identificar telefone corporativo e telefone pessoal com labels claros.

**Arquivos envolvidos:**
- `src/components/Colaboradores/CreateColaboradorModal.jsx`
- `src/pages/ColaboradorDetailsPage.jsx`
- `src/services/colaboradores.service.js`
- Banco de dados: tabela `rh_colaboradores`

**Situação atual:**
- ✅ Campo `telefone` existe no banco (confirmado em `inserir_colaboradores.py`)
- Campo único sendo exibido em `ColaboradorDetailsPage.jsx` (linha 460)
- ❌ Campo não existe no formulário de cadastro (`CreateColaboradorModal.jsx`)

**O que fazer:**
- [ ] Adicionar campo `telefone` no formulário de cadastro (se não existir)
- [ ] Adicionar campos separados no formulário:
  - `telefone_corporativo` (com label "Telefone Corporativo")
  - `telefone_pessoal` (com label "Telefone Pessoal")
- [ ] Atualizar schema do banco:
  - Adicionar colunas `telefone_corporativo` e `telefone_pessoal`
  - Migrar dados existentes de `telefone` (se necessário)
- [ ] Atualizar exibição em `ColaboradorDetailsPage.jsx`:
  - Mostrar dois campos separados com labels claros
  - Manter formatação existente (`formatarTelefone`)
- [ ] Atualizar serviço `colaboradores.service.js` para salvar ambos os campos

**Observações:**
- Campo `telefone` atual pode ser migrado para `telefone_corporativo` ou `telefone_pessoal`
- Decidir estratégia de migração de dados existentes
- Manter compatibilidade durante transição

---

### 1.2. Dispositivos Disponíveis por Departamento no Cadastro
**Descrição:** Mostrar dispositivos disponíveis filtrados por departamento durante o cadastro/edição de funcionário.

**Arquivos envolvidos:**
- `src/components/Colaboradores/CreateColaboradorModal.jsx`
- `src/services/equipamentos.service.js`

**O que fazer:**
- [ ] Ao selecionar um departamento no cadastro, mostrar seção com:
  - Notebooks disponíveis do departamento
  - Celulares disponíveis do departamento
  - Linhas disponíveis do departamento
- [ ] Permitir seleção rápida de equipamentos durante o cadastro
- [ ] Exibir contadores (ex: "3 notebooks disponíveis")

**Observações:**
- Considerar criar componente reutilizável para exibição de equipamentos disponíveis
- Filtrar apenas equipamentos com status "Disponível" e sem usuário atual

---

### 1.3. Ajustar Cores do Cadastro
**Descrição:** Melhorar paleta de cores e contraste no formulário de cadastro de funcionários.

**Arquivos envolvidos:**
- `src/components/Colaboradores/CreateColaboradorModal.jsx`
- `src/index.css` (se necessário ajustes globais)

**O que fazer:**
- [ ] Revisar cores de campos de formulário
- [ ] Melhorar contraste de labels e placeholders
- [ ] Ajustar cores de botões e estados (hover, focus, disabled)
- [ ] Garantir acessibilidade (WCAG)

**Observações:**
- Manter consistência com o tema dark/light mode
- Usar variáveis CSS do tema quando possível

---

## 2. Navegação e UX

### 2.1. Voltar para Tela Anterior
**Descrição:** Implementar navegação que retorna para a tela de origem após ações (ex: após visualizar detalhes de equipamento).

**Arquivos envolvidos:**
- `src/pages/EquipmentDetailsPage.jsx` (linha 390 - botão já existe, mas sempre vai para `/equipamentos`)
- `src/pages/ColaboradorDetailsPage.jsx` (linha 361 - botão já existe, mas sempre vai para `/funcionarios`)
- Possivelmente outros componentes de detalhes

**Situação atual:**
- Botões "Voltar" existem mas sempre navegam para rota fixa
- Não preservam filtros ou estado da página anterior

**O que fazer:**
- [ ] Implementar navegação inteligente:
  - Opção 1: Usar `navigate(-1)` para voltar no histórico do navegador
  - Opção 2: Passar `location.state` ao navegar para detalhes com:
    - Rota de origem
    - Filtros ativos
    - Parâmetros de busca
- [ ] Atualizar links de navegação para detalhes:
  - Em `EquipamentosPage.jsx`: passar estado ao navegar
  - Em `ColaboradoresPage.jsx`: passar estado ao navegar
- [ ] Atualizar botões "Voltar":
  - Verificar se há `location.state` com rota de origem
  - Se sim, navegar para rota salva com filtros
  - Se não, usar `navigate(-1)` ou rota padrão
- [ ] Considerar salvar filtros em `sessionStorage` como fallback

**Observações:**
- `navigate(-1)` é mais simples mas não preserva filtros
- `location.state` preserva contexto mas requer mudanças em todos os links
- Avaliar qual abordagem é melhor para o fluxo de uso

---

## 3. Equipamentos

### 3.1. Botão Devolver no Detalhe de Equipamento
**Descrição:** Adicionar botão "Devolver" na página de detalhes do equipamento para liberar equipamento do usuário atual.

**Arquivos envolvidos:**
- `src/pages/EquipmentDetailsPage.jsx`
- `src/services/equipamentos.service.js`
- `src/components/Equipamentos/ReleaseEquipmentModal.jsx` (✅ JÁ EXISTE)

**O que fazer:**
- [ ] Importar `ReleaseEquipmentModal` em `EquipmentDetailsPage.jsx` (linha 12)
- [ ] Adicionar estado `showReleaseModal` (similar ao `showTransferModal` e `showDiscardModal`)
- [ ] Adicionar botão "Devolver" na seção de ações (linha 414-463):
  - Mostrar apenas quando há `equipment['Usuário atual']`
  - Posicionar entre botões "Transferir" e "Marcar Descarte"
  - Usar cor/estilo apropriado (ex: `bg-success` ou `bg-blue-500`)
- [ ] Criar função `handleRelease` (similar a `handleTransfer` e `handleDiscard`):
  ```javascript
  const handleRelease = async (equipment, motivo) => {
    try {
      if (type === 'celular') {
        await equipamentosService.releaseCelular(id, motivo, user?.id)
      } else if (type === 'notebook') {
        await equipamentosService.releaseNotebook(id, motivo, user?.id)
      } else if (type === 'linha') {
        await equipamentosService.releaseLinha(id, motivo, user?.id)
      }
      await loadEquipment()
      setShowReleaseModal(false)
      alert('Equipamento devolvido com sucesso!')
    } catch (error) {
      console.error('Erro ao devolver equipamento:', error)
      alert('Erro ao devolver equipamento')
    }
  }
  ```
- [ ] Adicionar modal no final do componente (linha 759-788)
- [ ] Atualizar página após devolução (`loadEquipment()`)

**Observações:**
- ✅ `ReleaseEquipmentModal` já existe e está funcionando em `EquipamentosPage.jsx`
- ✅ Métodos `releaseCelular`, `releaseNotebook`, `releaseLinha` já existem no serviço
- ✅ Padrão de implementação já existe (ver `handleTransfer` e `handleDiscard` como referência)
- Implementação é simples: seguir o mesmo padrão dos outros modais

---

### 3.2. Aparelhos Indisponíveis
**Descrição:** Exibir e gerenciar equipamentos com status "Indisponível" de forma destacada.

**Arquivos envolvidos:**
- `src/pages/EquipamentosPage.jsx`
- `src/components/Equipamentos/EquipmentCard.jsx`
- `src/services/equipamentos.service.js`

**O que fazer:**
- [ ] Garantir que status "Indisponível" seja tratado corretamente
- [ ] Adicionar filtro específico para indisponíveis
- [ ] Visual diferenciado para equipamentos indisponíveis (badge, cor, etc.)
- [ ] Permitir alterar status de indisponível para disponível

**Observações:**
- Verificar normalização de status em `normalizeStatus` (já existe em `EquipmentDetailsPage.jsx`)
- Status pode ser "Indisponível" ou "indisponivel" - normalizar

---

## 4. Dashboard

### 4.1. Ajustar Dashboard - Linhas, Notebooks, Celulares
**Descrição:** Melhorar exibição e organização das métricas de equipamentos no dashboard.

**Arquivos envolvidos:**
- `src/pages/HomePage.jsx` (linhas 86-92)
- `src/components/Dashboard/MetricCard.jsx`
- `src/services/metrics.service.js`
- `src/hooks/useMetrics.js`

**Situação atual:**
- Card mostra: `${metrics.notebooks + metrics.celulares}` (soma total)
- Subtitle mostra: `${metrics.notebooks} notebooks • ${metrics.celulares} celulares`
- ❌ **Linhas não são exibidas** no card de equipamentos
- ❌ Não há breakdown por status

**O que fazer:**
- [ ] Incluir linhas no card de equipamentos:
  - Opção 1: Adicionar linhas no subtitle: `X notebooks • Y celulares • Z linhas`
  - Opção 2: Criar card separado para linhas
  - Opção 3: Mostrar total incluindo linhas: `notebooks + celulares + linhas`
- [ ] Verificar se `metrics.linhas` existe em `useMetrics.js`
- [ ] Melhorar layout do card:
  - Expandir card para mostrar mais informações
  - Adicionar breakdown por status (disponíveis, em uso, manutenção)
  - Usar grid interno para organizar métricas
- [ ] Considerar criar cards separados:
  - Card "Notebooks" com breakdown
  - Card "Celulares" com breakdown
  - Card "Linhas" com breakdown
  - Ou card expandido "Equipamentos" com todas as informações

**Observações:**
- Verificar estrutura de dados retornada por `metrics.service.js`
- `equipamentosService.getEstatisticas()` já retorna breakdown por tipo e status
- Considerar usar dados de `getEstatisticas()` para enriquecer o card

---

## 5. Filtros e Listagens

### 5.1. Trabalhar nos Filtros de Status - Mostrar Listagem
**Descrição:** Melhorar filtros de status para exibir listagem clara e organizada.

**Arquivos envolvidos:**
- `src/pages/EquipamentosPage.jsx` (linhas 428-439)
- `src/components/Equipamentos/EquipmentCard.jsx`

**Situação atual:**
- ✅ Dropdown de filtros já existe (linhas 428-439)
- ✅ Todos os status estão listados:
  - Todos os status
  - Em uso (`em_uso`)
  - Disponível (`disponivel`)
  - Manutenção (`manutencao`)
  - Indisponível (`indisponivel`)
  - Descarte (`descarte`)
- ⚠️ Filtro funciona mas pode ter problemas de normalização de status

**O que fazer:**
- [ ] Verificar se filtro está funcionando corretamente:
  - Testar cada opção de status
  - Verificar normalização em `loadEquipamentos` (linha 34-71)
- [ ] Melhorar visualização quando filtro está ativo:
  - Adicionar badge/indicador visual no dropdown
  - Mostrar contador de resultados filtrados
  - Destacar filtro ativo
- [ ] Adicionar contadores por status:
  - Mostrar quantidade de equipamentos por status
  - Exibir em badges ou tooltips
- [ ] Melhorar normalização de status:
  - Garantir que variações sejam tratadas (ex: "Disponível" vs "disponivel")
  - Usar função `normalizeStatus` se necessário

**Observações:**
- Filtro já existe e parece estar implementado
- Foco deve ser em melhorar UX e garantir funcionamento correto
- Verificar se há inconsistências entre valores do banco e valores do filtro

---

## 6. Calendário

### 6.1. Ajustar Cores do Calendário
**Descrição:** Melhorar paleta de cores do calendário para melhor legibilidade e consistência visual.

**Arquivos envolvidos:**
- `src/pages/CalendarPage.jsx`
- `src/index.css` (estilos do react-big-calendar)
- `src/components/Dashboard/CalendarToday.jsx`

**O que fazer:**
- [ ] Revisar `eventColors` em `CalendarPage.jsx`:
  ```javascript
  const eventColors = {
    entrada: '#00FF00',
    documentos: '#0080FF',
    saida: '#FF0000',
    aniversario: '#FF00FF',
    ferias: '#FFA500',
    feriado: '#FF6B6B',
  }
  ```
- [ ] Ajustar cores para melhor contraste e legibilidade
- [ ] Garantir que cores funcionem bem em dark mode
- [ ] Revisar cores em `CalendarToday.jsx` (`colorMap`)
- [ ] Ajustar estilos CSS do react-big-calendar no dark mode

**Observações:**
- Cores muito vibrantes podem não ter bom contraste
- Considerar usar cores do tema do sistema quando possível

---

## 7. Ações Rápidas

### 7.1. Incluir Advertências nas Ações Rápidas
**Descrição:** Adicionar opção de "Advertência" no módulo de ações rápidas.

**Arquivos envolvidos:**
- `src/pages/QuickActionsPage.jsx`
- Banco de dados: tabela `rh_acoes_rapidas`

**O que fazer:**
- [ ] Adicionar novo tipo de ação rápida:
  ```javascript
  {
    type: 'advertencia',
    icon: <AlertTriangle className="w-8 h-8" />,
    label: 'Advertência',
    color: 'bg-yellow-500 hover:bg-yellow-600',
  }
  ```
- [ ] Adicionar ao array `quickActions`
- [ ] Garantir que seja salvo corretamente no banco
- [ ] Considerar campos adicionais específicos para advertências (tipo, grau, etc.)

**Observações:**
- Verificar se há necessidade de campos específicos para advertências
- Considerar integração com histórico do colaborador

---

## 8. Histórico e Logs

### 8.1. Log em Histórico
**Descrição:** Melhorar registro de logs no histórico de ações e equipamentos.

**Arquivos envolvidos:**
- `src/pages/ColaboradorDetailsPage.jsx` (histórico geral)
- `src/pages/EquipmentDetailsPage.jsx` (histórico de equipamento)
- `src/services/equipamentos.service.js`
- Banco de dados: tabelas de histórico

**O que fazer:**
- [ ] Garantir que todas as ações sejam registradas no histórico:
  - Transferências de equipamentos
  - Devoluções
  - Alterações de status
  - Edições de campos
  - Ações rápidas
- [ ] Melhorar formato de exibição do histórico:
  - Timestamp formatado
  - Usuário que executou a ação
  - Tipo de ação
  - Detalhes da mudança
- [ ] Adicionar filtros no histórico (por data, tipo, usuário)
- [ ] Considerar exportação do histórico

**Observações:**
- Verificar se todas as funções de atualização estão registrando no histórico
- Considerar criar serviço centralizado de logging

---

## 📝 Notas Gerais

### Status das Melhorias

| Melhoria | Status | Complexidade | Prioridade |
|----------|-------|--------------|------------|
| Telefones com nomenclatura | 🔴 Não iniciado | Média | Média |
| Voltar para tela anterior | 🔴 Não iniciado | Baixa | Alta |
| Botão devolver equipamento | 🟡 Parcial | Baixa | Alta |
| Aparelhos indisponíveis | 🔴 Não iniciado | Baixa | Média |
| Dashboard ajustes | 🔴 Não iniciado | Baixa | Média |
| Filtros de status | 🔴 Não iniciado | Média | Alta |
| Dispositivos disponíveis no cadastro | 🔴 Não iniciado | Média | Baixa |
| Cores do cadastro | 🔴 Não iniciado | Baixa | Média |
| Cores do calendário | 🔴 Não iniciado | Baixa | Baixa |
| Advertências em ações rápidas | 🔴 Não iniciado | Baixa | Baixa |
| Log em histórico | 🔴 Não iniciado | Média | Baixa |

**Legenda:**
- 🔴 Não iniciado
- 🟡 Parcial (componentes existem, falta integração)
- 🟢 Completo

### Priorização Sugerida

1. **Alta Prioridade:**
   - ✅ Botão devolver equipamento (componentes prontos, só integrar)
   - Voltar para tela anterior (UX crítico)
   - Filtros de status (usabilidade)

2. **Média Prioridade:**
   - Telefones com nomenclatura
   - Aparelhos indisponíveis
   - Dashboard ajustes
   - Cores do cadastro

3. **Baixa Prioridade:**
   - Dispositivos disponíveis no cadastro
   - Cores do calendário
   - Advertências em ações rápidas
   - Log em histórico (melhorias)

### Considerações Técnicas
- Sempre verificar compatibilidade com dados existentes
- Manter consistência com padrões do projeto
- Testar em dark mode e light mode
- Garantir responsividade mobile
- Seguir padrões de código existentes
- Reutilizar componentes existentes quando possível
- Verificar se métodos de serviço já existem antes de criar novos

### Componentes e Serviços Disponíveis

**Componentes que podem ser reutilizados:**
- ✅ `ReleaseEquipmentModal` - Modal de devolução de equipamento
- ✅ `TransferEquipmentModal` - Modal de transferência
- ✅ `DiscardEquipmentModal` - Modal de descarte
- ✅ `AddCommentModal` - Modal de adicionar comentário

**Serviços com métodos úteis:**
- ✅ `equipamentosService.releaseCelular()` - Devolver celular
- ✅ `equipamentosService.releaseNotebook()` - Devolver notebook
- ✅ `equipamentosService.releaseLinha()` - Devolver linha
- ✅ `equipamentosService.getEstatisticas()` - Estatísticas de equipamentos
- ✅ `formatarTelefone()` - Formatação de telefone (em `ColaboradorDetailsPage.jsx`)

### Arquivos de Referência
- Schema do banco: `schema.sql`
- Serviços principais: `src/services/`
- Componentes compartilhados: `src/components/shared/`
- Utilitários: `src/lib/utils.js`

---

**Última atualização:** 30/01/2026
