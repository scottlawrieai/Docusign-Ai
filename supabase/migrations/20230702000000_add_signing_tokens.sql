-- Create signing_tokens table for secure document signing links
CREATE TABLE signing_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signatory_id UUID NOT NULL REFERENCES signatories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster token lookups
CREATE INDEX idx_signing_tokens_token ON signing_tokens(token);

-- Set up RLS policies for signing_tokens table
ALTER TABLE signing_tokens ENABLE ROW LEVEL SECURITY;

-- Allow document owners to view tokens for their documents
CREATE POLICY "Document owners can view signing tokens"
  ON signing_tokens FOR SELECT
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

-- Allow document owners to create tokens
CREATE POLICY "Document owners can create signing tokens"
  ON signing_tokens FOR INSERT
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

-- Allow document owners to update tokens (e.g., mark as used)
CREATE POLICY "Document owners can update signing tokens"
  ON signing_tokens FOR UPDATE
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

-- Allow anonymous access for token verification (needed for signing page)
CREATE POLICY "Anyone can verify tokens"
  ON signing_tokens FOR SELECT
  USING (true);
