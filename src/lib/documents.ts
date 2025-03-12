import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export interface Document {
  id: string;
  title: string;
  created_at: string;
  status: "pending" | "completed" | "expired";
  user_id: string;
  file_path: string;
  signatories_count: number;
  signed_count: number;
}

export interface Signatory {
  id: string;
  document_id: string;
  email: string;
  name?: string;
  signed: boolean;
  signed_at?: string;
}

export interface SignatureField {
  id: string;
  document_id: string;
  signatory_id?: string;
  x_position: number;
  y_position: number;
  page: number;
  signature_data?: string;
  field_type?: string;
  field_value?: string;
}

export interface Signature {
  id: string;
  signatory_id: string;
  document_id: string;
  signature_data: string;
  signature_type: "draw" | "type";
  created_at: string;
}

// Upload document file to storage
export async function uploadDocumentFile(file: File, userId: string) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  console.log(`Uploading file to ${filePath}`);

  // For PDF files, we need to handle them as binary data
  const options = file.type.includes("pdf")
    ? { contentType: "application/pdf" }
    : undefined;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file, options);

  if (error) {
    console.error("Error uploading file to storage:", error);
    throw error;
  }

  console.log(`File uploaded successfully to ${filePath}`);
  return filePath;
}

// Create a new document record
export async function createDocument(data: {
  title: string;
  user_id: string;
  file_path: string;
}) {
  const { data: document, error } = await supabase
    .from("documents")
    .insert([
      {
        title: data.title,
        user_id: data.user_id,
        file_path: data.file_path,
        status: "pending",
        signatories_count: 0,
        signed_count: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return document;
}

// Get all documents for a user
export async function getUserDocuments(userId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Document[];
}

// Get a single document by ID
export async function getDocument(documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error) throw error;
  return data as Document;
}

// Get document with detailed information
export async function getDocumentWithDetails(documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      signatories:signatories(*),
      signature_fields:signature_fields(*),
      owner:user_id(*)
    `,
    )
    .eq("id", documentId)
    .single();

  if (error) throw error;
  return data;
}

// Get document file URL
export function getDocumentFileUrl(filePath: string) {
  if (!filePath) {
    console.error("No file path provided for document URL");
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
  }

  try {
    // Get a signed URL with longer expiration for better reliability
    const { data: signedData } = supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiration

    if (signedData?.signedUrl) {
      console.log("Generated signed URL for document", filePath);
      return signedData.signedUrl;
    }

    // Fallback to public URL if signed URL fails
    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    if (!data.publicUrl) {
      console.error("Failed to get public URL for file path:", filePath);
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
    }

    console.log("Using public URL for document", filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error getting document URL:", error);
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
  }
}

// Add signatories to a document
export async function addSignatories(
  documentId: string,
  signatories: { email: string; name?: string }[],
) {
  // First check if any of these emails already exist for this document
  const { data: existingSignatories } = await supabase
    .from("signatories")
    .select("email")
    .eq("document_id", documentId);

  const existingEmails = new Set(
    existingSignatories?.map((s) => s.email.toLowerCase()) || [],
  );

  // Filter out duplicates
  const newSignatories = signatories.filter(
    (signatory) => !existingEmails.has(signatory.email.toLowerCase()),
  );

  if (newSignatories.length === 0) {
    // No new signatories to add
    return [];
  }

  const signatoriesToInsert = newSignatories.map((signatory) => ({
    document_id: documentId,
    email: signatory.email,
    name: signatory.name || null,
    signed: false,
  }));

  const { data, error } = await supabase
    .from("signatories")
    .insert(signatoriesToInsert)
    .select();

  if (error) throw error;

  // Get total count of signatories for this document
  const { count } = await supabase
    .from("signatories")
    .select("*", { count: "exact", head: true })
    .eq("document_id", documentId);

  // Update document signatories count
  await supabase
    .from("documents")
    .update({ signatories_count: count || newSignatories.length })
    .eq("id", documentId);

  return data as Signatory[];
}

// Get signatories for a document
export async function getDocumentSignatories(documentId: string) {
  const { data, error } = await supabase
    .from("signatories")
    .select("*")
    .eq("document_id", documentId);

  if (error) throw error;
  return data as Signatory[];
}

// Add signature fields to a document
export async function addSignatureFields(
  documentId: string,
  fields: {
    x: number;
    y: number;
    page?: number;
    signature_data?: string;
    field_type?: string;
    field_value?: string;
  }[],
) {
  // First delete existing fields
  await supabase
    .from("signature_fields")
    .delete()
    .eq("document_id", documentId);

  // Then add the new fields
  const fieldsToInsert = fields.map((field) => ({
    document_id: documentId,
    x_position: field.x,
    y_position: field.y,
    page: field.page || 1,
    signature_data: field.signature_data || null,
    field_type: field.field_type || "signature",
    field_value: field.field_value || field.signature_data || null,
  }));

  if (fieldsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("signature_fields")
    .insert(fieldsToInsert)
    .select();

  if (error) throw error;
  return data as SignatureField[];
}

// Get signature fields for a document
export async function getDocumentSignatureFields(documentId: string) {
  const { data, error } = await supabase
    .from("signature_fields")
    .select("*")
    .eq("document_id", documentId);

  if (error) throw error;
  return data as SignatureField[];
}

// Get signatures for a document
export async function getDocumentSignatures(documentId: string) {
  const { data, error } = await supabase
    .from("signatures")
    .select("*, signatory:signatory_id(*)")
    .eq("document_id", documentId);

  if (error) throw error;
  return data;
}

// Mark a document as signed by a signatory
export async function markAsSigned(documentId: string, signatoryId: string) {
  const { error } = await supabase
    .from("signatories")
    .update({ signed: true, signed_at: new Date().toISOString() })
    .eq("id", signatoryId)
    .eq("document_id", documentId);

  if (error) throw error;

  // Get current signed count
  const { data: signatories } = await supabase
    .from("signatories")
    .select("signed")
    .eq("document_id", documentId);

  const signedCount = signatories?.filter((s) => s.signed).length || 0;

  // Update document signed count
  await supabase
    .from("documents")
    .update({
      signed_count: signedCount,
      status: signedCount === signatories?.length ? "completed" : "pending",
    })
    .eq("id", documentId);

  return signedCount;
}

// Check if a document is fully signed
export async function isDocumentFullySigned(documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("signatories_count, signed_count")
    .eq("id", documentId)
    .single();

  if (error) throw error;
  return (
    data.signatories_count > 0 && data.signatories_count === data.signed_count
  );
}

// Get document audit trail
export async function getDocumentAuditTrail(documentId: string) {
  // Get document creation
  const { data: document } = await supabase
    .from("documents")
    .select("created_at, title, user_id")
    .eq("id", documentId)
    .single();

  // Get all signature events
  const { data: signatures } = await supabase
    .from("signatures")
    .select("created_at, signatory:signatory_id(email, name)")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  // Combine into audit trail
  const auditTrail = [
    {
      event: "Document Created",
      timestamp: document.created_at,
      user: "Owner",
      details: `Document "${document.title}" was created`,
    },
    ...signatures.map((sig) => ({
      event: "Document Signed",
      timestamp: sig.created_at,
      user: sig.signatory.name || sig.signatory.email,
      details: `Signed by ${sig.signatory.name || sig.signatory.email}`,
    })),
  ];

  return auditTrail.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
