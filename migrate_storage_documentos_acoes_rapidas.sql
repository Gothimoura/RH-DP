-- =====================================================
-- Script de Migração: Políticas RLS para Storage de Documentos de Ações Rápidas
-- =====================================================
-- Este script cria as políticas RLS necessárias para o bucket
-- 'documentos-acoes-rapidas' (bucket já deve estar criado)
-- =====================================================

-- =====================================================
-- POLÍTICAS RLS PARA O BUCKET
-- =====================================================

-- Remover políticas existentes (se houver) para evitar conflitos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar documentos de ações rápidas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar documentos" ON storage.objects;

-- Política 1: SELECT (Visualizar documentos)
-- Permite que usuários autenticados visualizem documentos
CREATE POLICY "Usuários autenticados podem visualizar documentos de ações rápidas"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-acoes-rapidas'
);

-- Política 2: INSERT (Upload de documentos)
-- Permite que usuários autenticados façam upload de documentos
CREATE POLICY "Usuários autenticados podem fazer upload de documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-acoes-rapidas'
);

-- Política 3: UPDATE (Atualizar documentos)
-- Permite que usuários autenticados atualizem documentos
CREATE POLICY "Usuários autenticados podem atualizar documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos-acoes-rapidas'
)
WITH CHECK (
  bucket_id = 'documentos-acoes-rapidas'
);

-- Política 4: DELETE (Deletar documentos)
-- Permite que usuários autenticados deletem documentos
CREATE POLICY "Usuários autenticados podem deletar documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-acoes-rapidas'
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'documentos-acoes-rapidas';

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%documentos-acoes-rapidas%'
    OR policyname LIKE '%ações rápidas%'
    OR policyname LIKE '%upload de documentos%'
    OR policyname LIKE '%visualizar documentos%'
    OR policyname LIKE '%atualizar documentos%'
    OR policyname LIKE '%deletar documentos%'
  )
ORDER BY policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. O bucket 'documentos-acoes-rapidas' já deve estar criado
-- 2. As políticas podem ser executadas múltiplas vezes (IF NOT EXISTS)
-- 3. Todos os usuários autenticados terão acesso completo ao bucket
-- 4. O tamanho máximo por arquivo é de 10MB (configurado no bucket)
-- 5. Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
