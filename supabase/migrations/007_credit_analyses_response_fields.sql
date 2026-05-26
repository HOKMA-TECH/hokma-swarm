-- Adiciona campos de resposta para armazenar assunto, remetente e anexos do email recebido
ALTER TABLE credit_analyses
  ADD COLUMN IF NOT EXISTS response_subject TEXT,
  ADD COLUMN IF NOT EXISTS response_from    TEXT,
  ADD COLUMN IF NOT EXISTS response_attachments JSONB;

-- Adiciona status 'recebido' para quando o email chega mas sem corpo classificável
ALTER TABLE credit_analyses
  DROP CONSTRAINT IF EXISTS credit_analyses_status_check;

ALTER TABLE credit_analyses
  ADD CONSTRAINT credit_analyses_status_check
    CHECK (status IN ('draft','enviado','aprovado','reprovado','condicionado','recebido'));
