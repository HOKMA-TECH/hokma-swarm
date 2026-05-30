-- 009_follow_ups.sql
-- Tabela de follow-ups escalonados usada pelo agente n8n "06 FOLLOW-UP-AGENTE".
-- O follow-up roda por cron (de hora em hora) e escalona tentativas de WhatsApp
-- enquanto o lead estiver em estagios ativos do funil sem responder.

CREATE TABLE IF NOT EXISTS follow_ups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'whatsapp'
                 CHECK (type IN ('whatsapp', 'call', 'human_notify', 'reminder')),
  scheduled_at   TIMESTAMPTZ NOT NULL,
  executed_at    TIMESTAMPTZ,
  attempt_number INT NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente', 'executado', 'cancelado')),
  outcome        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
-- indice parcial para a query do cron (proximos follow-ups pendentes vencidos)
CREATE INDEX IF NOT EXISTS idx_follow_ups_pendentes
  ON follow_ups(scheduled_at)
  WHERE status = 'pendente';

-- Loga criacao de follow-up na timeline do CRM (mesma convencao dos outros triggers)
CREATE OR REPLACE FUNCTION log_follow_up_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (lead_id, type, payload)
  VALUES (NEW.lead_id, 'follow_up_agendado',
    jsonb_build_object('type', NEW.type, 'attempt', NEW.attempt_number, 'scheduled_at', NEW.scheduled_at));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS follow_ups_created ON follow_ups;
CREATE TRIGGER follow_ups_created
  AFTER INSERT ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION log_follow_up_created();
