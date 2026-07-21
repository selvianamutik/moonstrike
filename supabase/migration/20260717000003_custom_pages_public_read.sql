CREATE POLICY "Public can read active pages"
  ON custom_pages
  FOR SELECT
  TO anon
  USING (status = 'active');
