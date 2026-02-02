# Instruções para Configurar o Drag and Drop do Kanban

## Problema
Se você não consegue arrastar os cards entre as colunas do kanban, provavelmente é um problema de permissões (RLS - Row Level Security) no Supabase.

## Solução

### Passo 1: Executar o Script de Migração

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `migrate_kanban_rls.sql`
4. Copie e cole todo o conteúdo no SQL Editor
5. Clique em **RUN** ou pressione `Ctrl+Enter`

Este script irá:
- ✅ Criar as tabelas se não existirem
- ✅ Criar os índices necessários
- ✅ Habilitar RLS (Row Level Security)
- ✅ Criar todas as políticas de permissão necessárias
- ✅ Verificar se tudo foi configurado corretamente

### Passo 2: Verificar se Funcionou

1. No **SQL Editor** do Supabase
2. Execute o arquivo `test_kanban_permissions.sql`
3. Verifique os resultados:
   - Todas as tabelas devem existir (✓)
   - RLS deve estar habilitado (✓)
   - Deve haver **4 políticas** em `kanban_cartoes`:
     - SELECT (leitura)
     - INSERT (criação)
     - UPDATE (atualização) ← **CRÍTICO para drag and drop**
     - DELETE (deleção)
   - Deve haver **2 políticas** em `kanban_historico`:
     - SELECT (leitura)
     - INSERT (criação)

### Passo 3: Testar no Aplicativo

1. Faça login no aplicativo
2. Vá para a página de Kanban (Onboarding)
3. Tente arrastar um card de uma coluna para outra
4. Abra o **Console do Navegador** (F12) e verifique se há erros

## Se Ainda Não Funcionar

### Verificar no Console do Navegador

Abra o console (F12) e procure por erros como:
- `permission denied`
- `new row violates row-level security policy`
- `403 Forbidden`
- `insufficient_privilege`

### Verificar no Supabase

Execute no SQL Editor:

```sql
-- Verificar políticas ativas
SELECT * FROM pg_policies 
WHERE tablename = 'kanban_cartoes';

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'kanban_cartoes';

-- Verificar usuário atual
SELECT auth.uid(), auth.email();
```

### Verificar Autenticação

Certifique-se de que:
1. Você está **logado** no aplicativo
2. O usuário está **autenticado** no Supabase
3. O `auth.uid()` não é `null`

Execute no SQL Editor:

```sql
SELECT 
  auth.uid() as user_id,
  CASE WHEN auth.uid() IS NOT NULL 
    THEN 'Autenticado ✓' 
    ELSE 'NÃO Autenticado ✗' 
  END as status;
```

## Estrutura Esperada das Políticas

### kanban_cartoes
- **SELECT**: `USING (true)` - Todos autenticados podem ler
- **INSERT**: `WITH CHECK (true)` - Todos autenticados podem criar
- **UPDATE**: `USING (true) WITH CHECK (true)` - Todos autenticados podem atualizar ← **IMPORTANTE**
- **DELETE**: `USING (true)` - Todos autenticados podem deletar

### kanban_historico
- **SELECT**: `USING (true)` - Todos autenticados podem ler
- **INSERT**: `WITH CHECK (true)` - Todos autenticados podem criar

## Troubleshooting

### Erro: "new row violates row-level security policy"
- Execute novamente o script `migrate_kanban_rls.sql`
- Verifique se as políticas foram criadas corretamente

### Erro: "permission denied"
- Verifique se você está autenticado
- Verifique se RLS está habilitado
- Verifique se as políticas existem

### Cards não aparecem após arrastar
- Verifique se o `UPDATE` funcionou (veja no console)
- Verifique se há erros no console do navegador
- Recarregue a página

### Drag funciona mas volta para a posição original
- Verifique se há erros no console
- Verifique se o `moveCard` está sendo chamado
- Verifique se o `loadData` está sendo chamado após o movimento

## Contato

Se após seguir todos os passos o problema persistir, verifique:
1. Logs do console do navegador
2. Logs do Supabase (Dashboard > Logs)
3. Políticas RLS criadas (execute `test_kanban_permissions.sql`)

