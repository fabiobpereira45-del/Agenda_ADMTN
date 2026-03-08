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
        url := 'COLE_AQUI_A_URL_DO_WEBHOOK_DE_NOVA_AGENDA_DA_FLOW_GRAVIT',
        body := jsonb_build_object(
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
            url := 'COLE_AQUI_A_URL_DO_WEBHOOK_DE_APROVACAO_DA_FLOW_GRAVIT',
            body := jsonb_build_object(
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


-- Aviso ao administrador: 
-- Lembre-se de substituir as URLs falsas acima pelas URLs reais geradas no Flow-Gravit.
