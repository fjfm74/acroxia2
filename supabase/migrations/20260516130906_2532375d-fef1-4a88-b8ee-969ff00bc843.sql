
-- document_relations: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Authenticated users can view document_relations" ON public.document_relations;
CREATE POLICY "Authenticated users can view document_relations"
ON public.document_relations
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.legal_documents
  WHERE legal_documents.id = document_relations.source_document_id
    AND legal_documents.is_active = true
));

-- boe_monitoring_logs: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System can insert boe_monitoring_logs" ON public.boe_monitoring_logs;
CREATE POLICY "Service role can insert boe_monitoring_logs"
ON public.boe_monitoring_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- email_campaign_events: require campaign to exist
DROP POLICY IF EXISTS "Public insert for tracking" ON public.email_campaign_events;
CREATE POLICY "Public insert valid tracking events"
ON public.email_campaign_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.email_campaigns WHERE id = campaign_id)
  AND event_type IN ('open', 'click', 'bounce', 'unsubscribe', 'complaint', 'delivered')
);
