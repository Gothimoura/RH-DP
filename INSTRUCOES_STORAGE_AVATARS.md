# 📸 Instruções para Configurar Storage de Avatares

## ⚠️ Problema com SQL

As políticas RLS do Supabase Storage não podem ser criadas diretamente via SQL normal devido a restrições de permissões. Siga as instruções abaixo para configurar manualmente.

## 📋 Passo a Passo

### 1. Criar o Bucket no Dashboard

1. Acesse o **Supabase Dashboard**
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Sim (marcado)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
5. Clique em **Create bucket**

### 2. Criar Políticas RLS

Após criar o bucket, configure as políticas de segurança:

1. No bucket `avatars`, clique na aba **Policies**
2. Clique em **New Policy**

#### Política 1: SELECT (Visualizar)
- **Policy name**: `Usuários autenticados podem visualizar avatares`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'avatars'
```

#### Política 2: INSERT (Upload)
- **Policy name**: `Usuários podem fazer upload de seus próprios avatares`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
```sql
bucket_id = 'avatars' AND split_part(name, '-', 1) = auth.uid()::text
```

#### Política 3: UPDATE (Atualizar)
- **Policy name**: `Usuários podem atualizar seus próprios avatares`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'avatars' AND split_part(name, '-', 1) = auth.uid()::text
```

#### Política 4: DELETE (Deletar)
- **Policy name**: `Usuários podem deletar seus próprios avatares`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'avatars' AND split_part(name, '-', 1) = auth.uid()::text
```

## ✅ Verificação

Após configurar tudo:

1. Teste fazendo upload de uma foto no sistema
2. Verifique se o arquivo aparece em **Storage > avatars**
3. O nome do arquivo deve começar com o ID do usuário (ex: `{userId}-{timestamp}.jpg`)

## 🔒 Segurança

As políticas garantem que:
- ✅ Todos os usuários autenticados podem **visualizar** avatares
- ✅ Usuários só podem fazer **upload/atualizar/deletar** seus próprios avatares
- ✅ A verificação é feita pelo ID do usuário no nome do arquivo

## 🐛 Troubleshooting

**Erro: "Bucket not found"**
- Verifique se o bucket `avatars` foi criado corretamente
- Confirme que o nome está exatamente como `avatars` (minúsculas)

**Erro: "new row violates row-level security policy"**
- Verifique se as políticas RLS foram criadas corretamente
- Confirme que o nome do arquivo começa com o ID do usuário

**Erro: "permission denied"**
- Verifique se o usuário está autenticado
- Confirme que as políticas estão aplicadas ao role `authenticated`

