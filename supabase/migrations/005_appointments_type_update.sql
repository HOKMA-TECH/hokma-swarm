-- Update appointments type constraint: visita/call/reuniao → atendimento/visita/agencia
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_type_check;
UPDATE appointments SET type = 'atendimento' WHERE type = 'call';
UPDATE appointments SET type = 'atendimento' WHERE type = 'reuniao';
ALTER TABLE appointments ADD CONSTRAINT appointments_type_check
  CHECK (type IN ('atendimento','visita','agencia'));
