-- Configuração de Webhooks para Integração com Flow-Gravit (WhatsApp)
-- IMPORTANTE: A extensão pg_net precisa estar ativada no seu projeto Supabase.

-- Ativar extensão de requisições web (se já estiver ativada, não causará erro)
CREATE EXTENSION IF NOT EXISTS pg_net;


-- ==========================================
-- 1. Trigger: Nova Solicitação de Pré-Agenda
-- ==========================================
-- Esta função será chamada toda vez que alguém preencher o formulário no site
CREATE OR REPLACE FUNCTION public.handle_new_preschedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas disparar se o evento for recém-criado e estiver pendente
  IF NEW.status = 'Pendente' THEN
    -- Chamada POST para o Flow-Gravit (Substitua a URL abaixo quando criar o fluxo)
    PERFORM net.http_post(
        url := 'https://flow-gravit.vercel.app/api/webhook/7da1f009-b400-4fe2-be65-6b74f546086f',
        body := jsonb_build_object(
            'trigger_type', 'NEW_PRESCHEDULE',
            'event_id', NEW.id,
            'title', NEW.title,
            'date', NEW.date,
            'time', NEW.time,
            'applicant_name', NEW.applicant_name,
            'applicant_phone', NEW.applicant_phone
        )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o Gatilho (Trigger) na tabela events
DROP TRIGGER IF EXISTS on_preschedule_created ON public.events;
CREATE TRIGGER on_preschedule_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_preschedule();


-- ==========================================
-- 2. Trigger: Evento Aprovado ou Rejeitado
-- ==========================================
-- Esta função será chamada toda vez que um Master/Admin mudar o status no painel
CREATE OR REPLACE FUNCTION public.handle_preschedule_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas disparar se o status MUDOU e for para Aprovado ou Rejeitado
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Aprovado', 'Rejeitado') THEN
    
    -- Só enviar a notificação se houver um número de telefone registrado
    IF NEW.applicant_phone IS NOT NULL AND NEW.applicant_phone != '' THEN
        PERFORM net.http_post(
            url := 'https://flow-gravit.vercel.app/api/webhook/7da1f009-b400-4fe2-be65-6b74f546086f',
            body := jsonb_build_object(
                'trigger_type', 'STATUS_CHANGED',
                'event_id', NEW.id,
                'title', NEW.title,
                'date', NEW.date,
                'new_status', NEW.status,
                'applicant_name', NEW.applicant_name,
                'applicant_phone', NEW.applicant_phone
            )
        );
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o Gatilho (Trigger) na tabela events
DROP TRIGGER IF EXISTS on_preschedule_status_changed ON public.events;
CREATE TRIGGER on_preschedule_status_changed
  AFTER UPDATE OF status ON public.events
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_preschedule_status_change();


-- ==========================================
-- 3. CRON JOB: Virada de Mês (Agenda p/ Líderes)
-- ==========================================
-- Ative a extensão pg_cron no seu Supabase para fazer funcionar
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Envia um webhook todo dia 1º de cada mês às 08:00
-- SELECT cron.schedule('send_monthly_agenda', '0 8 1 * *', $$
--     SELECT net.http_post(
--         url := 'https://flow-gravit.vercel.app/api/webhook/7da1f009-b400-4fe2-be65-6b74f546086f',
--         body := jsonb_build_object(
--             'trigger_type', 'MONTHLY_AGENDA',
--             'month', extract(month from current_date)
--         )
--     );
-- $$);

-- ==========================================
-- 4. CRON JOB: Lembrete 6 horas antes
-- ==========================================
-- Roda de hora em hora checando se algum evento aprovado acontecerá nas próximas 6h
-- SELECT cron.schedule('check_upcoming_events', '0 * * * *', $$
--     SELECT net.http_post(
--         url := 'https://flow-gravit.vercel.app/api/webhook/7da1f009-b400-4fe2-be65-6b74f546086f',
--         body := jsonb_build_object(
--             'trigger_type', 'REMINDER_6H',
--             'event_id', e.id,
--             'title', e.title,
--             'time', e.time,
--             'applicant_phone', e.applicant_phone
--         )
--     )
--     FROM events e
--     WHERE e.status = 'Aprovado' 
--     AND e.date = current_date 
--     AND e.time::time = (current_time + interval '6 hours')::time;
-- $$);
