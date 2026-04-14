-- Fix 1: Restrict purchase_intents UPDATE policy to service_role only
DROP POLICY IF EXISTS "Allow update purchase_intents" ON public.purchase_intents;

CREATE POLICY "Service role can update purchase_intents"
  ON public.purchase_intents
  FOR UPDATE
  TO service_role
  USING (true);

-- Fix 2: Enable RLS on backup tables
ALTER TABLE public.backup_document_relations_reset_20260225 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_invalid_chunks_20260225 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_invalid_rel_20260225 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_legal_chunks_superseded_reset_20260225 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_legal_documents_supersession_reset_20260225 ENABLE ROW LEVEL SECURITY;

-- Fix 3: Add UPDATE policy for contracts storage bucket
CREATE POLICY "Users can update own contract files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix 4: Set search_path on functions missing it
CREATE OR REPLACE FUNCTION public.enforce_document_relation_integrity()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
declare
  s record;
  t record;
  rel_type text;
begin
  rel_type := lower(trim(coalesce(new.relation_type, '')));
  if rel_type = '' then
    return null;
  end if;

  if rel_type not in ('deroga','modifica','complementa','amplia','prorroga','desarrolla','interpreta') then
    return null;
  end if;

  new.relation_type := rel_type;

  if exists (
    select 1
    from document_relations dr
    where dr.source_document_id = new.source_document_id
      and dr.target_document_id = new.target_document_id
      and lower(trim(dr.relation_type)) = rel_type
  ) then
    return null;
  end if;

  select id, jurisdiction, territorial_code, effective_date
  into s
  from legal_documents
  where id = new.source_document_id;

  select id, jurisdiction, territorial_code, effective_date
  into t
  from legal_documents
  where id = new.target_document_id;

  if s.id is null or t.id is null then
    return null;
  end if;

  if rel_type in ('deroga','modifica') then
    if s.jurisdiction = 'autonomica'
       and t.jurisdiction = 'autonomica'
       and s.territorial_code is not null
       and t.territorial_code is not null
       and s.territorial_code <> t.territorial_code then
      return null;
    end if;

    if s.effective_date is not null
       and t.effective_date is not null
       and s.effective_date < t.effective_date then
      return null;
    end if;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.tg_set_territorial_code_legal_documents()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
begin
  if new.jurisdiction = 'autonomica' then
    if new.territorial_code is null or btrim(new.territorial_code) = '' then
      new.territorial_code := public.map_territorial_code(new.territorial_entity);
    end if;

    if new.territorial_code is null then
      raise exception
        'territorial_entity no válida para jurisdiction=autonomica: %',
        coalesce(new.territorial_entity, 'NULL');
    end if;
  end if;

  return new;
end;
$function$;