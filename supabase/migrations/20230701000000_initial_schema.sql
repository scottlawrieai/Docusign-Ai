-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'expired')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  signatories_count INTEGER DEFAULT 0,
  signed_count INTEGER DEFAULT 0
);

-- Create signatories table
CREATE TABLE signatories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signature_fields table
CREATE TABLE signature_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signatory_id UUID REFERENCES signatories(id) ON DELETE SET NULL,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  page INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', TRUE);

-- Set up storage policies
CREATE POLICY "Documents are accessible to their owners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (user_id = auth.uid());

-- Set up RLS policies for signatories table
ALTER TABLE signatories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatories for their documents"
  ON signatories FOR SELECT
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert signatories for their documents"
  ON signatories FOR INSERT
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can update signatories for their documents"
  ON signatories FOR UPDATE
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete signatories for their documents"
  ON signatories FOR DELETE
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

-- Set up RLS policies for signature_fields table
ALTER TABLE signature_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signature fields for their documents"
  ON signature_fields FOR SELECT
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert signature fields for their documents"
  ON signature_fields FOR INSERT
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can update signature fields for their documents"
  ON signature_fields FOR UPDATE
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete signature fields for their documents"
  ON signature_fields FOR DELETE
  USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()));
