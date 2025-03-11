-- Create signatures table to store signature data
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signatory_id UUID NOT NULL REFERENCES signatories(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('draw', 'type')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS policies for signatures table
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Allow document owners to view signatures for their documents
CREATE POLICY "Document owners can view signatures"
  ON signatures FOR SELECT
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

-- Allow signatories to create their own signatures
CREATE POLICY "Signatories can create signatures"
  ON signatures FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_signatures_document_signatory ON signatures(document_id, signatory_id);
