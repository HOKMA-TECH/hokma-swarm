-- Enable RLS on all tables
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_links    ENABLE ROW LEVEL SECURITY;

-- Single-tenant v1: any authenticated user has full access
CREATE POLICY "authenticated_full_access" ON leads
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON documents
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON conversations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON appointments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON credit_analyses
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON timeline_events
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON portal_links
  FOR ALL USING (auth.uid() IS NOT NULL);
