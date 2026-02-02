# 📄 Instruções para Configurar Storage de Documentos de Ações Rápidas

## ⚠️ Problema com SQL

As políticas RLS do Supabase Storage não podem ser criadas diretamente via SQL normal devido a restrições de permissões. Siga as instruções abaixo para configurar manualmente.

## 📋 Passo a Passo

### 1. Criar o Bucket no Dashboard

1. Acesse o **Supabase Dashboard**
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure:
   - **Name**: `documentos-acoes-rapidas`
   - **Public bucket**: ✅ Sim (marcado)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: 
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `text/plain`
5. Clique em **Create bucket**

### 2. Criar Políticas RLS

Após criar o bucket, configure as políticas de segurança:

1. No bucket `documentos-acoes-rapidas`, clique na aba **Policies**
2. Clique em **New Policy**

#### Política 1: SELECT (Visualizar)
- **Policy name**: `Usuários autenticados podem visualizar documentos de ações rápidas`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'documentos-acoes-rapidas'
```

#### Política 2: INSERT (Upload)
- **Policy name**: `Usuários autenticados podem fazer upload de documentos`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
```sql
bucket_id = 'documentos-acoes-rapidas'
```

#### Política 3: UPDATE (Atualizar)
- **Policy name**: `Usuários autenticados podem atualizar documentos`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'documentos-acoes-rapidas'
```

#### Política 4: DELETE (Deletar)
- **Policy name**: `Usuários autenticados podem deletar documentos`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'documentos-acoes-rapidas'
```

## ✅ Verificação

Após configurar tudo:

1. Teste fazendo upload de um arquivo através da interface de Ações Rápidas
2. Verifique se o arquivo aparece na lista de anexos
3. Verifique se consegue remover o arquivo antes de salvar
4. Após salvar uma ação rápida, verifique se os anexos foram salvos corretamente

## 📝 Notas Importantes

- Os arquivos são armazenados com nomes únicos baseados em timestamp e string aleatória
- As URLs dos arquivos são salvas no campo `dados.anexos` da tabela `rh_acoes_rapidas`
- O tamanho máximo por arquivo é de 10MB
- Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT

## 🔧 SQL Completo para RLS

Execute o arquivo `migrate_storage_documentos_acoes_rapidas.sql` no SQL Editor do Supabase para criar todas as políticas RLS automaticamente.

### Como executar:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `migrate_storage_documentos_acoes_rapidas.sql`
4. Copie e cole todo o conteúdo no SQL Editor
5. Clique em **RUN** ou pressione `Ctrl+Enter`

O script irá:
- ✅ Criar o bucket (se não existir)
- ✅ Criar todas as 4 políticas RLS necessárias
- ✅ Verificar se tudo foi configurado corretamente

**Nota**: Se o bucket não puder ser criado via SQL (devido a restrições), crie-o manualmente pelo Dashboard primeiro, depois execute o script para criar apenas as políticas.
