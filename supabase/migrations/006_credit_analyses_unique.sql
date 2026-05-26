-- Garante que cada lead tenha no máximo uma análise de crédito
-- Necessário para o upsert da Edge Function funcionar corretamente
ALTER TABLE credit_analyses
  ADD CONSTRAINT credit_analyses_lead_id_unique UNIQUE (lead_id);
