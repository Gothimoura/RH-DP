# Validação do Schema.sql vs Código da Aplicação

**Data:** 21/01/2026  
**Status:** ⚠️ Inconsistências Identificadas

---

## 📌 Resumo Executivo

O código da aplicação está usando **nomes de colunas com espaços e maiúsculas** (formato legado do Glide), enquanto o `schema.sql` mostra a **estrutura nova normalizada** (snake_case). 

As **views** (`vw_rh_celulares`, `vw_rh_notebooks`, `vw_rh_linhas_telefonicas`) devem estar fazendo o mapeamento entre a tabela unificada `rh_ativos` e o formato antigo usado pelo código.

---

## 🔴 Problemas Críticos Identificados

### 1. **Inconsistência: Tabela `rh_colaboradores`**

#### Schema.sql (Estrutura Nova):
```sql
CREATE TABLE rh_colaboradores (
    id uuid,
    nome character varying,
    cargo character varying,
    departamento_id uuid,
    data_entrada date,
    etapa_id character varying,
    foto_url text,
    ...
);
```

#### Código Usando (Formato Antigo):
```javascript
// colaboradores.service.js
.select('ID, Nome, Cargo, Departamento, "Data Entrada", "Etapa id", Foto')
.eq('ID', id)
```

**Problema:** O código busca colunas `ID`, `Nome`, `Cargo`, `Departamento`, `"Data Entrada"`, `"Etapa id"`, `Foto`, mas o schema mostra `id`, `nome`, `cargo`, `departamento_id`, `data_entrada`, `etapa_id`, `foto_url`.

**Solução Necessária:**
- Criar view `vw_rh_colaboradores` que mapeia para o formato antigo, OU
- Atualizar o código para usar os nomes novos

---

### 2. **Inconsistência: Tabelas de Equipamentos**

#### Schema.sql (Estrutura Nova - Unificada):
```sql
CREATE TABLE rh_ativos (
    id uuid,
    tipo tipo_ativo,  -- 'celular', 'notebook', 'linha'
    identificador text,
    usuario_atual text,
    matricula text,
    departamento_id uuid,
    status status_ativo,
    ...
);
```

#### Código Usando (Tabelas Separadas - Formato Antigo):
```javascript
// equipamentos.service.js
.from('rh_celulares')      // ❌ Não existe no schema
.from('rh_notebooks')     // ❌ Não existe no schema
.from('rh_linhas_telefonicas')  // ❌ Não existe no schema

.select('Row ID', 'Usuário atual', 'Nº Matricula', 'DPTO', 'Status', ...)
```

**Problema:** O código busca tabelas `rh_celulares`, `rh_notebooks`, `rh_linhas_telefonicas` que **não existem no schema.sql**. Essas devem ser **views** que mapeiam `rh_ativos`.

**Solução Necessária:**
- As views `vw_rh_celulares`, `vw_rh_notebooks`, `vw_rh_linhas_telefonicas` devem existir e mapear corretamente
- Verificar se as views estão criadas corretamente no banco

---

### 3. **Inconsistência: Tabelas de Histórico**

#### Schema.sql (Estrutura Nova - Unificada):
```sql
CREATE TABLE rh_ativos_historico (
    id uuid,
    ativo_id uuid,
    data_hora timestamptz,
    usuario character varying,
    usuario_id uuid,
    comentario text,
    ...
);
```

#### Código Usando (Tabelas Separadas - Formato Antigo):
```javascript
// equipamentos.service.js
.from('rh_registros_celulares')    // ❌ Não existe no schema
.from('rh_registros_notebooks')    // ❌ Não existe no schema
.from('rh_registros_linhas')       // ❌ Não existe no schema

.insert({
    ID: celularId,
    'DATA E HORA': new Date().toISOString(),
    USUÁRIO: usuario,
    COMENTÁRIO: comentario,
})
```

**Problema:** O código insere em tabelas separadas que não existem no schema. Essas devem ser **views atualizáveis** ou o código deve usar `rh_ativos_historico` diretamente.

**Solução Necessária:**
- Criar views atualizáveis para histórico, OU
- Atualizar código para usar `rh_ativos_historico` diretamente

---

### 4. **Inconsistência: Tabela `rh_etapas`**

#### Schema.sql:
```sql
CREATE TABLE rh_etapas (
    id character varying,
    tipo tipo_etapa,
    nome character varying,
    ordem integer,
    ativo boolean,
    ...
);
```

#### Código Usando:
```javascript
// kanban.service.js
.from('rh_etapas')
.select('ID, Tipo')
.select('Etapa')  // ❌ Campo não existe no schema
```

**Problema:** O código busca campo `Etapa` que não existe no schema (deveria ser `nome`).

**Solução:** Atualizar código para usar `nome` ou criar view com alias.

---

### 5. **Inconsistência: Tabela `rh_departamentos`**

#### Schema.sql:
```sql
CREATE TABLE rh_departamentos (
    id uuid,
    nome character varying,
    ativo boolean,
    ...
);
```

#### Código Usando:
```javascript
// Vários serviços
.eq('Departamento', filters.departamento)  // ❌ Campo não existe
.eq('DPTO', filters.departamento)          // ❌ Campo não existe
```

**Problema:** O código busca campos `Departamento` e `DPTO` que não existem no schema.

**Solução:** Atualizar código para usar `nome` ou criar views com aliases.

---

## 🟡 Problemas Médios Identificados

### 6. **Campos Faltantes no Schema**

#### Tabela `rh_colaboradores`:
- ❌ Campo `matricula` existe no schema mas não é usado no código
- ❌ Campo `email` existe no schema mas não é usado no código
- ❌ Campo `telefone` existe no schema mas não é usado no código
- ❌ Campo `data_saida` existe no schema mas não é usado no código
- ❌ Campo `ativo` existe no schema mas não é usado no código

**Observação:** Esses campos podem estar sendo usados em outras partes do código não analisadas.

---

### 7. **Tabelas Legacy no Schema**

O schema contém tabelas `_old` que são mencionadas na documentação:
- ✅ `rh_acoes_rapidas_old`
- ✅ `rh_calendario_alertas_old`
- ✅ `rh_relatorios_config_old`
- ✅ `rh_relatorios_gerados_old`

**Status:** OK - São tabelas de backup.

---

## ✅ Pontos Corretos

### 1. **Tabelas que Estão Consistentes:**

- ✅ `rh_kanban_cartoes` - Código usa campos corretos (`id`, `colaborador_id`, `coluna`, etc.)
- ✅ `rh_kanban_comentarios` - Código usa campos corretos
- ✅ `rh_kanban_historico` - Código usa campos corretos
- ✅ `rh_avaliacoes_tokens` - Código usa campos corretos
- ✅ `rh_avaliacoes_comportamentais` - Código usa campos corretos
- ✅ `rh_calendario_eventos` - Código usa campos corretos
- ✅ `rh_notificacoes` - Código usa campos corretos
- ✅ `rh_painel_metricas` - Código usa campos corretos
- ✅ `profiles` - Código usa campos corretos

---

## 📋 Resumo de Ações Necessárias

### Prioridade ALTA 🔴

1. **Verificar/Criar Views de Compatibilidade:**
   - `vw_rh_colaboradores` - Mapear para formato antigo (`ID`, `Nome`, etc.)
   - `vw_rh_celulares` - Mapear `rh_ativos` onde `tipo = 'celular'`
   - `vw_rh_notebooks` - Mapear `rh_ativos` onde `tipo = 'notebook'`
   - `vw_rh_linhas_telefonicas` - Mapear `rh_ativos` onde `tipo = 'linha'`
   - Views atualizáveis para histórico (ou atualizar código)

2. **Verificar Mapeamento de Campos:**
   - `rh_colaboradores.nome` → `Nome`
   - `rh_colaboradores.departamento_id` → `Departamento` (via join)
   - `rh_colaboradores.data_entrada` → `"Data Entrada"`
   - `rh_colaboradores.etapa_id` → `"Etapa id"`
   - `rh_colaboradores.foto_url` → `Foto`
   - `rh_etapas.nome` → `Etapa`

### Prioridade MÉDIA 🟡

3. **Documentar Views Existentes:**
   - Criar arquivo `migrate_views.sql` documentando todas as views
   - Incluir mapeamento completo de campos

4. **Validar Views no Banco:**
   - Verificar se as views estão criadas corretamente
   - Testar queries através das views
   - Validar que INSERT/UPDATE funcionam (se necessário)

### Prioridade BAIXA 🟢

5. **Otimização Futura:**
   - Migrar código para usar estrutura nova diretamente
   - Remover dependência de views de compatibilidade
   - Usar nomes de colunas normalizados

---

## 🔍 Próximos Passos Recomendados

1. **Verificar no Banco de Dados:**
   ```sql
   -- Listar todas as views
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'vw_rh_%';
   
   -- Verificar estrutura das views
   SELECT * FROM information_schema.columns 
   WHERE table_name IN ('vw_rh_celulares', 'vw_rh_notebooks', 'vw_rh_linhas_telefonicas', 'vw_rh_colaboradores');
   ```

2. **Criar/Atualizar Views se Necessário:**
   - Criar arquivo `migrate_views.sql` com todas as views
   - Garantir mapeamento correto de campos
   - Testar queries através das views

3. **Documentar Mapeamento:**
   - Criar tabela de mapeamento campo a campo
   - Documentar qual view mapeia qual tabela

---

## 📝 Observações Finais

O `schema.sql` está **correto** e representa a estrutura nova normalizada do banco. O código ainda usa o formato antigo, o que é **esperado** durante uma migração gradual.

As **views de compatibilidade** são essenciais para manter o código funcionando enquanto a migração não é concluída. É importante:

1. ✅ Garantir que todas as views necessárias existem
2. ✅ Validar que as views mapeiam corretamente
3. ✅ Documentar o mapeamento
4. ⏳ Planejar migração gradual do código para estrutura nova

---

## 🔗 Referências

- Schema atual: `schema.sql`
- Documentação: `ARQUITETURA.md`
- Código analisado:
  - `src/services/colaboradores.service.js`
  - `src/services/equipamentos.service.js`
  - `src/services/kanban.service.js`
  - `src/services/reports.service.js`
  - `src/services/metrics.service.js`
