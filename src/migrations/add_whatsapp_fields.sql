-- Adicionar colunas de contato do solicitante na tabela 'events'
ALTER TABLE events
ADD COLUMN IF NOT EXISTS applicant_name TEXT,
ADD COLUMN IF NOT EXISTS applicant_phone TEXT;

-- Opcional: Para evitar nulos caso o sistema passe a cobrar sempre
-- UPDATE events SET applicant_name = 'Sistema antigo', applicant_phone = '00000000000' WHERE applicant_name IS NULL;
