-- Extended lead fields for full proponent capture
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS endereco         TEXT,
  ADD COLUMN IF NOT EXISTS profissao        TEXT,
  ADD COLUMN IF NOT EXISTS tipo_renda       TEXT CHECK (tipo_renda IN ('formal', 'informal')),
  ADD COLUMN IF NOT EXISTS cotista          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fator_social     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regiao_interesse TEXT,
  ADD COLUMN IF NOT EXISTS empreendimento   TEXT,
  ADD COLUMN IF NOT EXISTS vgv              NUMERIC,
  ADD COLUMN IF NOT EXISTS proponentes      JSONB DEFAULT '[]'::jsonb;
