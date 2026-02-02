-- Criar tabela para avaliações comportamentais
CREATE TABLE IF NOT EXISTS public.rh_avaliacoes_comportamentais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funcionario text NOT NULL,
  avaliador text NOT NULL,
  tipo_avaliacao character varying NOT NULL CHECK (tipo_avaliacao IN ('gestor', 'par', 'auto')),
  avaliacoes_tecnicas jsonb NOT NULL,
  avaliacoes_emocionais jsonb NOT NULL,
  observacoes text,
  media_tecnica numeric(5,2) NOT NULL,
  media_emocional numeric(5,2) NOT NULL,
  criado_por uuid,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT rh_avaliacoes_comportamentais_pkey PRIMARY KEY (id),
  CONSTRAINT rh_avaliacoes_comportamentais_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.profiles(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rh_avaliacoes_funcionario ON public.rh_avaliacoes_comportamentais(funcionario);
CREATE INDEX IF NOT EXISTS idx_rh_avaliacoes_tipo ON public.rh_avaliacoes_comportamentais(tipo_avaliacao);
CREATE INDEX IF NOT EXISTS idx_rh_avaliacoes_criado_em ON public.rh_avaliacoes_comportamentais(criado_em DESC);

-- Comentários para documentação
COMMENT ON TABLE public.rh_avaliacoes_comportamentais IS 'Tabela de avaliações comportamentais técnicas e emocionais dos funcionários';
COMMENT ON COLUMN public.rh_avaliacoes_comportamentais.tipo_avaliacao IS 'Tipo de avaliação: gestor, par ou auto';
COMMENT ON COLUMN public.rh_avaliacoes_comportamentais.avaliacoes_tecnicas IS 'JSON com as avaliações técnicas (competência_id: valor_frequencia)';
COMMENT ON COLUMN public.rh_avaliacoes_comportamentais.avaliacoes_emocionais IS 'JSON com as avaliações emocionais (competência_id: valor_frequencia)';
