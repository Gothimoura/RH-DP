-- Criar tabela para tokens de avaliação pública
CREATE TABLE IF NOT EXISTS public.rh_avaliacoes_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funcionario_id text NOT NULL,
  funcionario_nome text NOT NULL,
  tipo_avaliacao character varying NOT NULL CHECK (tipo_avaliacao IN ('auto', 'par', 'gestor')),
  token text NOT NULL UNIQUE,
  avaliador_nome text,
  avaliador_email text,
  usado boolean DEFAULT false,
  expira_em timestamp with time zone,
  criado_por uuid,
  criado_em timestamp with time zone DEFAULT now(),
  usado_em timestamp with time zone,
  CONSTRAINT rh_avaliacoes_tokens_pkey PRIMARY KEY (id)
);

-- Adicionar foreign keys separadamente (caso as tabelas já existam)
DO $$
BEGIN
  -- Verificar se a tabela rh_colaboradores existe antes de criar a foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rh_colaboradores') THEN
    -- Verificar se a coluna ID existe na tabela rh_colaboradores
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'rh_colaboradores' 
      AND column_name = 'ID'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rh_avaliacoes_tokens_funcionario_id_fkey'
      ) THEN
        ALTER TABLE public.rh_avaliacoes_tokens
        ADD CONSTRAINT rh_avaliacoes_tokens_funcionario_id_fkey 
        FOREIGN KEY (funcionario_id) REFERENCES public.rh_colaboradores("ID");
      END IF;
    END IF;
  END IF;

  -- Verificar se a tabela profiles existe antes de criar a foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Verificar se a coluna id existe na tabela profiles
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rh_avaliacoes_tokens_criado_por_fkey'
      ) THEN
        ALTER TABLE public.rh_avaliacoes_tokens
        ADD CONSTRAINT rh_avaliacoes_tokens_criado_por_fkey 
        FOREIGN KEY (criado_por) REFERENCES public.profiles(id);
      END IF;
    END IF;
  END IF;
END $$;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_rh_avaliacoes_tokens_token ON public.rh_avaliacoes_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rh_avaliacoes_tokens_funcionario_id ON public.rh_avaliacoes_tokens(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_rh_avaliacoes_tokens_usado ON public.rh_avaliacoes_tokens(usado);

-- Função para gerar token único
CREATE OR REPLACE FUNCTION gerar_token_avaliacao()
RETURNS text AS $$
DECLARE
  token text;
BEGIN
  -- Gera um token aleatório de 32 caracteres
  token := encode(gen_random_bytes(24), 'base64');
  -- Remove caracteres especiais e limita a 32 caracteres
  token := regexp_replace(token, '[^a-zA-Z0-9]', '', 'g');
  token := substring(token from 1 for 32);
  RETURN upper(token);
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE public.rh_avaliacoes_tokens IS 'Tokens únicos para acesso público às avaliações comportamentais';
COMMENT ON COLUMN public.rh_avaliacoes_tokens.token IS 'Token único de 32 caracteres para acesso à avaliação';
COMMENT ON COLUMN public.rh_avaliacoes_tokens.usado IS 'Indica se o token já foi utilizado para enviar uma avaliação';
COMMENT ON COLUMN public.rh_avaliacoes_tokens.expira_em IS 'Data de expiração do token (opcional)';
