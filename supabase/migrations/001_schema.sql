-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  telefone        TEXT NOT NULL,
  email           TEXT,
  cpf             TEXT,
  renda           NUMERIC,
  tipo_imovel     TEXT,
  stage           TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (stage IN ('pendente','em_analise','aprovado','reprovado',
                                    'condicionado','desistencia','contrato',
                                    'formularios','repasse','concluido')),
  campaign_source TEXT,
  loss_reason     TEXT,
  observations    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID REFERENCES leads(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT,
  storage_path  TEXT NOT NULL,
  uploaded_by   TEXT DEFAULT 'corretor',
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('lead','agent')),
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'text' CHECK (type IN ('text','audio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('visita','call','reuniao')),
  title      TEXT NOT NULL,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  location   TEXT,
  notes      TEXT,
  status     TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','realizado','cancelado')),
  created_by TEXT DEFAULT 'corretor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_analyses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        UUID REFERENCES leads(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','enviado','aprovado','reprovado','condicionado')),
  sent_at        TIMESTAMPTZ,
  responded_at   TIMESTAMPTZ,
  approved_value NUMERIC,
  response_text  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE timeline_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon_label  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Timeline trigger: log stage changes automatically
CREATE OR REPLACE FUNCTION log_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO timeline_events (lead_id, type, payload)
    VALUES (NEW.id, 'stage_mudou',
      jsonb_build_object('de', OLD.stage, 'para', NEW.stage));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_stage_change
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_stage_change();

-- Timeline trigger: log new documents
CREATE OR REPLACE FUNCTION log_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (lead_id, type, payload)
  VALUES (NEW.lead_id, 'doc_enviado',
    jsonb_build_object('name', NEW.name, 'type', NEW.type, 'by', NEW.uploaded_by));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_upload
  AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION log_document_upload();

-- Timeline trigger: log new appointments
CREATE OR REPLACE FUNCTION log_appointment_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (lead_id, type, payload)
  VALUES (NEW.lead_id, 'agendamento_criado',
    jsonb_build_object('title', NEW.title, 'start_at', NEW.start_at, 'by', NEW.created_by));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_created
  AFTER INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_created();

-- Seed default portal links
INSERT INTO portal_links (name, url, icon_label) VALUES
  ('ZAP Imóveis',      'https://www.zapimoveis.com.br',      'ZAP'),
  ('VivaReal',         'https://www.vivareal.com.br',         'VR'),
  ('OLX Imóveis',      'https://www.olx.com.br/imoveis',      'OLX'),
  ('Chaves na Mão',    'https://www.chavesnamao.com.br',      'CN'),
  ('Simulador CAIXA',  'https://www8.caixa.gov.br/siopiinternet-web/simulaOperacaoInternet.do', 'CX'),
  ('CRECI Online',     'https://www.creci.org.br',            'CR');
