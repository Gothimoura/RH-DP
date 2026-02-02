# Mudanças Necessárias no Banco de Dados

**Data:** 21/01/2026  
**Status:** ✅ Código Atualizado - Nenhuma Mudança no Banco Necessária

---

## 📌 Resumo

Este documento lista **apenas** as mudanças necessárias no banco de dados após as correções no código. O código foi atualizado para usar os nomes corretos do schema (`id`, `nome`, `tipo` em vez de `ID`, `Etapa`, `Tipo`).

---

## ✅ Código Corrigido

As seguintes correções foram feitas no código:

1. **`rh_etapas`** - Todos os usos atualizados:
   - `ID` → `id`
   - `Etapa` → `nome`
   - `Tipo` → `tipo`

**Arquivos atualizados:**
- `src/services/kanban.service.js`
- `src/components/Kanban/CreateCardModal.jsx`
- `src/components/Kanban/KanbanBoard.jsx`
- `src/components/Colaboradores/CreateColaboradorModal.jsx`
- `src/pages/ColaboradorDetailsPage.jsx`

---

## ✅ Views Confirmadas no Banco

As seguintes views foram **confirmadas como existentes** no banco de dados:

- ✅ `vw_rh_celulares` - View para celulares
- ✅ `vw_rh_notebooks` - View para notebooks  
- ✅ `vw_rh_linhas_telefonicas` - View para linhas telefônicas
- ✅ `vw_rh_colaboradores_detalhes` - View para colaboradores com detalhes
- ✅ `vw_rh_dashboard_ativos` - View para dashboard de ativos

**Status RLS:** Todas marcadas como "UNRESTRICTED"

---

## ✅ Código Atualizado para Usar Views

O código foi **atualizado** para usar as views com prefixo `vw_`:

- ✅ `rh_celulares` → `vw_rh_celulares`
- ✅ `rh_notebooks` → `vw_rh_notebooks`
- ✅ `rh_linhas_telefonicas` → `vw_rh_linhas_telefonicas`

**Arquivos atualizados:**
- `src/services/equipamentos.service.js`
- `src/services/reports.service.js`
- `src/services/metrics.service.js`

**Se não existirem, criar views** (ver seção abaixo).

---

### 2. **Views de Histórico**

O código usa tabelas de histórico que devem ser **views** ou o código precisa ser atualizado:

#### Tabelas que o código busca:

- `rh_registros_celulares`
- `rh_registros_notebooks`
- `rh_registros_linhas`

**Opções:**

**Opção A:** Criar views atualizáveis que mapeiam para `rh_ativos_historico`
**Opção B:** Atualizar código para usar `rh_ativos_historico` diretamente (recomendado)

**Verificar se existem:**
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('rh_registros_celulares', 'rh_registros_notebooks', 'rh_registros_linhas');
```

---

### 3. **View de Compatibilidade para Colaboradores**

O código ainda usa formato antigo para `rh_colaboradores`:

#### Campos que o código busca:

- `ID` (deve mapear para `id`)
- `Nome` (deve mapear para `nome`)
- `Cargo` (deve mapear para `cargo`)
- `Departamento` (deve mapear para `departamento_id` via join com `rh_departamentos.nome`)
- `"Data Entrada"` (deve mapear para `data_entrada`)
- `"Etapa id"` (deve mapear para `etapa_id`)
- `Foto` (deve mapear para `foto_url`)

**Opções:**

**Opção A:** Criar view `vw_rh_colaboradores` ou `rh_colaboradores` como view
**Opção B:** Manter tabela e criar view apenas se necessário

**Verificar estrutura atual:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'rh_colaboradores'
ORDER BY ordinal_position;
```

---

## 📋 Scripts SQL para Verificação

### Verificar Views Existentes

```sql
-- Listar todas as views do schema RH
SELECT 
    table_name as view_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name LIKE 'rh_%' 
    OR table_name LIKE 'vw_rh_%'
)
AND table_type = 'VIEW'
ORDER BY table_name;
```

### Verificar Estrutura de Views

```sql
-- Ver colunas de uma view específica
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'rh_celulares'  -- ou outra view
ORDER BY ordinal_position;
```

### Verificar se Tabelas são Views ou Tabelas Reais

```sql
-- Verificar tipo de objeto
SELECT 
    schemaname,
    tablename,
    'TABLE' as object_type
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('rh_celulares', 'rh_notebooks', 'rh_linhas_telefonicas', 'rh_colaboradores')

UNION ALL

SELECT 
    schemaname,
    viewname as tablename,
    'VIEW' as object_type
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('rh_celulares', 'rh_notebooks', 'rh_linhas_telefonicas', 'rh_colaboradores');
```

---

## ✅ Nenhuma Mudança Necessária no Banco

Como o código foi atualizado para usar as views existentes (`vw_rh_*`), **não é necessário criar views adicionais no banco**.

### Validações Recomendadas

1. ✅ **Views confirmadas** - `vw_rh_*` existem e estão funcionando
2. ✅ **Código atualizado** - Agora usa `vw_rh_*` corretamente
3. ⚠️ **Testar queries** - Garantir que SELECT funciona através das views
4. ⚠️ **Testar INSERT/UPDATE** - Se necessário, garantir que views são atualizáveis (pode ser necessário usar triggers ou atualizar diretamente `rh_ativos`)

---

## 📝 Observações

- ✅ O código foi corrigido para usar `rh_etapas` com nomes corretos (`id`, `nome`, `tipo`)
- ✅ O código foi atualizado para usar views `vw_rh_*` em vez de `rh_*`
- ✅ **Nenhuma mudança no banco necessária** - As views já existem e o código agora as usa corretamente
- ⚠️ **Atenção:** Se as views não forem atualizáveis (INSERT/UPDATE), pode ser necessário criar triggers ou atualizar diretamente a tabela `rh_ativos`

---

## 🔗 Próximos Passos

1. **Executar scripts de verificação** acima
2. **Confirmar se views existem**
3. **Se não existirem:** Criar views ou atualizar código
4. **Se existirem:** Validar mapeamento e testar

---

**Nota:** Este documento lista apenas o que precisa ser **verificado** no banco. Se tudo estiver funcionando, nenhuma mudança é necessária.
