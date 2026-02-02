# Correções no Sistema de Kanban/Onboarding

**Data:** 21/01/2026  
**Status:** ✅ Correções Aplicadas

---

## 📌 Problema Identificado

A jornada de onboarding do Luis (e possivelmente outros colaboradores) não estava aparecendo no sistema. Foram identificados vários problemas que causavam o desaparecimento de cards:

1. **Cards com `colaborador_id` null não eram exibidos corretamente**
2. **Filtro de etapas inconsistente entre componentes**
3. **Cards não eram exibidos quando colaborador não era encontrado na view**

---

## ✅ Correções Aplicadas

### 1. **Correção no Hook `useKanban.js` - BUSCA DE COLABORADORES**

**Problema CRÍTICO:** Cards dependem do funcionário estar na view `vw_rh_colaboradores_detalhes`. Se o colaborador não está na view (por filtros ou condições), o card não aparece mesmo existindo no banco.

**Solução:**
- Buscar colaboradores primeiro da view (pode ter filtros aplicados)
- **FALLBACK CRÍTICO:** Se algum colaborador não foi encontrado na view, buscar diretamente da tabela `rh_colaboradores`
- Garantir que TODOS os cards sejam mantidos, mesmo com `colaborador_id` null
- Criar mapa de colaboradores para busca rápida
- Manter cards mesmo quando colaborador não é encontrado na view

**Arquivo:** `src/hooks/useKanban.js`

**Código Adicionado:**
```javascript
// Buscar colaboradores primeiro da view
let employeesData = await colaboradoresService.getByIds(colaboradorIds)

// FALLBACK: Se não encontrado na view, buscar da tabela diretamente
const encontradosIds = new Set(employeesData.map(e => e.id))
const naoEncontradosIds = colaboradorIds.filter(id => !encontradosIds.has(id))

if (naoEncontradosIds.length > 0) {
  // Buscar diretamente da tabela rh_colaboradores
  const { data: colaboradoresTabela } = await supabase
    .from('rh_colaboradores')
    .select('id, nome, cargo, departamento_id, ...')
    .in('id', naoEncontradosIds)
  
  // Normalizar e adicionar aos colaboradores encontrados
  employeesData = [...employeesData, ...colaboradoresNormalizados]
}
```

```javascript
// ANTES: Filtrava colaboradorIds, perdendo cards
const colaboradorIds = [...new Set(cardsData.map(c => c.colaborador_id).filter(Boolean))]

// DEPOIS: Mantém todos os cards, cria mapa para busca
const colaboradorIds = [...new Set(cardsData.map(c => c.colaborador_id).filter(Boolean))]
const employeesMap = {}
employeesData.forEach(emp => {
  employeesMap[emp.id] = emp
})
```

---

### 2. **Correção no Componente `KanbanColumn.jsx`**

**Problema:** Cards não eram exibidos quando `employee` era `undefined` ou não encontrado.

**Solução:**
- Buscar colaborador de forma segura mesmo quando não encontrado
- Garantir que `employee` seja sempre `null` em vez de `undefined`
- Cards são exibidos mesmo sem colaborador associado

**Arquivo:** `src/components/Kanban/KanbanColumn.jsx`

```javascript
// ANTES: Podia retornar undefined
const employee = employees.find((e) => e.id === card.colaborador_id)

// DEPOIS: Sempre retorna null se não encontrado
const employee = card.colaborador_id 
  ? employees.find((e) => e && e.id && String(e.id) === String(card.colaborador_id))
  : null
```

---

### 3. **Correção no Serviço `kanban.service.js`**

**Problema:** 
- Filtro de etapas inconsistente com o componente `KanbanBoard`
- Normalização muito restritiva que removia caracteres importantes

**Solução:**
- Alinhar lógica de filtro com `KanbanBoard.jsx`
- Usar mesma função de normalização (sem remover caracteres especiais importantes)
- Garantir que cards sejam retornados mesmo com `colaborador_id` null

**Arquivo:** `src/services/kanban.service.js`

```javascript
// ANTES: Normalização muito restritiva
const normalizeTipo = (texto) => {
  return texto.toString()
    .replace(/[^\w\s]/gi, '') // Remove caracteres especiais - MUITO RESTRITIVO
    .toLowerCase()
    .trim()
}

// DEPOIS: Normalização alinhada com KanbanBoard
const normalizeTipo = (texto) => {
  return texto.toString()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove apenas emojis
    .replace(/[✅❌]/g, '') // Remove emojis específicos
    .toLowerCase()
    .trim()
}
```

---

## 🔍 Problemas Relacionados à Foreign Key

### Foreign Key com `ON DELETE SET NULL`

O schema fornecido mostra:
```sql
constraint rh_kanban_cartoes_colaborador_id_fkey1 
foreign KEY (colaborador_id) 
references rh_colaboradores (id) 
on delete set null
```

**Impacto:** Se um colaborador for deletado, o `colaborador_id` do card será setado para `NULL`, mas o card permanece no banco.

**Solução Aplicada:** O código agora trata corretamente cards com `colaborador_id` null, exibindo-os mesmo quando o colaborador não existe mais.

---

## 📋 Verificações Necessárias

### 1. Verificar Cards do Luis no Banco

Execute a seguinte query para verificar se existem cards do Luis:

```sql
-- Buscar cards do Luis (substituir 'Luis' pelo nome correto)
SELECT 
  kc.id,
  kc.colaborador_id,
  kc.coluna,
  kc.posicao,
  kc.data_inicio,
  c.nome as colaborador_nome,
  e.tipo as etapa_tipo,
  e.nome as etapa_nome
FROM rh_kanban_cartoes kc
LEFT JOIN rh_colaboradores c ON c.id = kc.colaborador_id
LEFT JOIN rh_etapas e ON e.id = kc.coluna
WHERE c.nome ILIKE '%Luis%' OR kc.colaborador_id IS NULL
ORDER BY kc.criado_em DESC;
```

### 1.1. Verificar se Luis está na View

**IMPORTANTE:** Verificar se o Luis está na view `vw_rh_colaboradores_detalhes`:

```sql
-- Verificar se Luis está na view
SELECT id, nome, cargo, departamento
FROM vw_rh_colaboradores_detalhes
WHERE nome ILIKE '%Luis%';

-- Comparar com a tabela base
SELECT id, nome, cargo, departamento_id, ativo
FROM rh_colaboradores
WHERE nome ILIKE '%Luis%';
```

**Se o Luis estiver na tabela mas NÃO na view:** Isso explica por que o card não aparecia. A correção agora busca diretamente da tabela quando não encontra na view.

### 2. Verificar Etapas de Tipo "Ligado"

Execute para verificar se as etapas estão corretas:

```sql
-- Verificar etapas do tipo "ligado" (onboarding)
SELECT id, tipo, nome, ordem, ativo
FROM rh_etapas
WHERE tipo ILIKE '%ligado%' OR tipo ILIKE '%ligamento%'
ORDER BY ordem;
```

### 3. Verificar Se Cards Estão em Etapas Corretas

```sql
-- Verificar cards que podem estar em etapas incorretas
SELECT 
  kc.id,
  kc.colaborador_id,
  kc.coluna,
  c.nome as colaborador_nome,
  e.tipo as etapa_tipo,
  e.nome as etapa_nome
FROM rh_kanban_cartoes kc
LEFT JOIN rh_colaboradores c ON c.id = kc.colaborador_id
LEFT JOIN rh_etapas e ON e.id = kc.coluna
WHERE kc.colaborador_id IS NOT NULL
  AND (e.tipo IS NULL OR e.tipo NOT ILIKE '%ligado%')
ORDER BY kc.criado_em DESC;
```

---

## ✅ Resultado Esperado

Após as correções:

1. ✅ Cards são exibidos mesmo quando `colaborador_id` é null
2. ✅ **Cards são exibidos mesmo quando colaborador NÃO está na view** (busca fallback na tabela)
3. ✅ Filtro de etapas é consistente entre todos os componentes
4. ✅ Cards não desaparecem quando colaborador é deletado (se FK tiver `on delete set null`)
5. ✅ **Cards aparecem mesmo se o colaborador não atender aos critérios da view** (ex: filtros de `ativo`, departamento, etc.)

---

## 🔧 Próximos Passos Recomendados

1. **Testar no ambiente:** Verificar se o card do Luis aparece agora
2. **Verificar dados no banco:** Executar queries acima para diagnosticar problemas específicos
3. **Validar foreign key:** Confirmar se a FK está configurada com `on delete set null` ou `on delete restrict`
4. **Monitorar logs:** Verificar se há erros ao buscar colaboradores ou etapas

---

## 📝 Observações

- O código agora é mais resiliente a dados inconsistentes
- Cards são sempre exibidos, mesmo sem colaborador associado
- Filtro de etapas está alinhado entre todos os componentes
- Sistema funciona corretamente mesmo com `colaborador_id` null

---

**Arquivos Modificados:**
- `src/hooks/useKanban.js`
- `src/components/Kanban/KanbanColumn.jsx`
- `src/services/kanban.service.js`
