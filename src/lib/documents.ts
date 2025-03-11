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
}

// Upload document file to storage
export async function uploadDocumentFile(file: File, userId: string) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) throw error;

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

// Get document file URL
export function getDocumentFileUrl(filePath: string) {
  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
  return data.publicUrl;
}

// Add signatories to a document
export async function addSignatories(
  documentId: string,
  signatories: { email: string; name?: string }[],
) {
  const signatoriesToInsert = signatories.map((signatory) => ({
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

  // Update document signatories count
  await supabase
    .from("documents")
    .update({ signatories_count: signatories.length })
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
  fields: { x: number; y: number; page?: number }[],
) {
  const fieldsToInsert = fields.map((field) => ({
    document_id: documentId,
    x_position: field.x,
    y_position: field.y,
    page: field.page || 1,
  }));

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
