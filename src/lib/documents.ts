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

  // Get all view events
  const { data: views } = await supabase
    .from("document_views")
    .select("created_at, user_id, user_email")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  // Get all share events
  const { data: shares } = await supabase
    .from("document_shares")
    .select("created_at, shared_by, shared_with")
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
    ...(views || []).map((view) => ({
      event: "Document Viewed",
      timestamp: view.created_at,
      user: view.user_email || "Anonymous",
      details: `Document was viewed by ${view.user_email || "Anonymous"}`,
    })),
    ...(shares || []).map((share) => ({
      event: "Document Sent",
      timestamp: share.created_at,
      user: share.shared_by,
      details: `Document was shared with ${share.shared_with}`,
    })),
  ];

  return auditTrail.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

// Get user templates
export async function getUserTemplates() {
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Create template from document
export async function createTemplateFromDocument(documentId: string) {
  // Get document details
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (docError) throw docError;

  // Get signature fields
  const { data: fields, error: fieldsError } = await supabase
    .from("signature_fields")
    .select("*")
    .eq("document_id", documentId);

  if (fieldsError) throw fieldsError;

  // Create template record
  const { data: template, error: templateError } = await supabase
    .from("document_templates")
    .insert([
      {
        title: `Template from ${document.title}`,
        file_path: document.file_path,
        user_id: document.user_id,
        is_favorite: false,
      },
    ])
    .select()
    .single();

  if (templateError) throw templateError;

  // Create template fields
  if (fields && fields.length > 0) {
    const templateFields = fields.map((field) => ({
      template_id: template.id,
      x_position: field.x_position,
      y_position: field.y_position,
      page: field.page,
      field_type: field.field_type,
    }));

    const { error: fieldsInsertError } = await supabase
      .from("template_fields")
      .insert(templateFields);

    if (fieldsInsertError) throw fieldsInsertError;
  }

  return template;
}

// Set document expiration
export async function setDocumentExpiration({
  documentId,
  expirationDate,
}: {
  documentId: string;
  expirationDate: string | null;
}) {
  const { error } = await supabase
    .from("documents")
    .update({
      expires_at: expirationDate,
    })
    .eq("id", documentId);

  if (error) throw error;
  return true;
}

// Send reminder emails
export async function sendReminderEmails({
  documentId,
  documentName,
  signatoryIds,
  message,
}: {
  documentId: string;
  documentName: string;
  signatoryIds: string[];
  message: string;
}) {
  // Get signatories
  const { data: signatories, error: signatoryError } = await supabase
    .from("signatories")
    .select("*")
    .in("id", signatoryIds)
    .eq("document_id", documentId);

  if (signatoryError) throw signatoryError;

  // Get signing tokens
  const { data: tokens, error: tokenError } = await supabase
    .from("signing_tokens")
    .select("*")
    .in("signatory_id", signatoryIds)
    .eq("document_id", documentId);

  if (tokenError) throw tokenError;

  // Send emails
  for (const signatory of signatories || []) {
    const token = tokens?.find((t) => t.signatory_id === signatory.id);
    if (!token) continue;

    const signingLink = `${window.location.origin}/sign/${documentId}/${token.token}`;

    // Send email using the email function
    await fetch(
      "https://xssshlqkcnhixkmksgrh.supabase.co/functions/v1/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: signatory.email,
          subject: `Reminder: Please sign ${documentName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h2 style="color: #333;">Signature Reminder</h2>
              </div>
              <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
                <p>Hello ${signatory.name || "there"},</p>
                <p>${message}</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${signingLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Sign Document Now</a>
                </div>
              </div>
              <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
                <p>This is an automated reminder. Please do not reply to this email.</p>
              </div>
            </div>
          `,
        }),
      },
    );

    // Update last reminded timestamp
    await supabase
      .from("signatories")
      .update({ last_reminded_at: new Date().toISOString() })
      .eq("id", signatory.id);
  }

  return true;
}

// Get document access settings
export async function getDocumentAccessSettings(documentId: string) {
  // Get document access settings
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("password_protected, publicly_viewable")
    .eq("id", documentId)
    .single();

  if (docError) throw docError;

  // Get users with access
  const { data: users, error: usersError } = await supabase
    .from("document_access")
    .select("id, email, name, access_level")
    .eq("document_id", documentId);

  if (usersError) throw usersError;

  return {
    password_protected: document.password_protected,
    publicly_viewable: document.publicly_viewable,
    users: users || [],
  };
}

// Update document access
export async function updateDocumentAccess({
  documentId,
  users,
  passwordProtected,
  password,
  publiclyViewable,
}: {
  documentId: string;
  users: { id: string; email: string; name?: string; access_level: string }[];
  passwordProtected: boolean;
  password: string | null;
  publiclyViewable: boolean;
}) {
  // Update document settings
  const { error: docError } = await supabase
    .from("documents")
    .update({
      password_protected: passwordProtected,
      password: password,
      publicly_viewable: publiclyViewable,
    })
    .eq("id", documentId);

  if (docError) throw docError;

  // Delete existing access records
  const { error: deleteError } = await supabase
    .from("document_access")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) throw deleteError;

  // Insert new access records
  if (users.length > 0) {
    const accessRecords = users.map((user) => ({
      document_id: documentId,
      email: user.email,
      name: user.name || null,
      access_level: user.access_level,
    }));

    const { error: insertError } = await supabase
      .from("document_access")
      .insert(accessRecords);

    if (insertError) throw insertError;
  }

  return true;
}

export async function sendSignatureCompletionNotification({
  documentId,
  documentName,
  ownerEmail,
  ownerName,
}: {
  documentId: string;
  documentName: string;
  ownerEmail: string;
  ownerName?: string;
}) {
  try {
    const documentLink = `${window.location.origin}/document/${documentId}`;

    const emailHtml = generateCompletionEmail({
      documentName,
      ownerName,
      documentLink,
    });

    await sendEmail(
      ownerEmail,
      `Document Fully Signed: ${documentName}`,
      emailHtml,
    );

    return true;
  } catch (error) {
    console.error("Error sending completion notification:", error);
    throw error;
  }
}

// Generate HTML email template for completion notification
function generateCompletionEmail({
  documentName,
  ownerName,
  documentLink,
}: {
  documentName: string;
  ownerName?: string;
  documentLink: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Document Fully Signed</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
        <p>Hello ${ownerName || "there"},</p>
        <p>Great news! Your document <strong>${documentName}</strong> has been signed by all parties.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${documentLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Completed Document</a>
        </div>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Send an email using the Supabase Edge Functions
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch(
      "https://xssshlqkcnhixkmksgrh.supabase.co/functions/v1/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to,
          subject,
          html,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to send email: ${errorData.error || response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Create a secure token for document signing
async function createSigningToken(documentId: string, signatoryId: string) {
  // Generate a unique token
  const token = uuidv4();

  // Store the token in the database with an expiration
  const { error } = await supabase.from("signing_tokens").insert({
    token,
    document_id: documentId,
    signatory_id: signatoryId,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiration
  });

  if (error) throw error;
  return token;
}

// Send signature requests to signatories
export async function sendSignatureRequest({
  documentId,
  documentName,
  signatories,
  message,
}: {
  documentId: string;
  documentName: string;
  signatories: Signatory[];
  message?: string;
}) {
  const signingLinks = [];

  for (const signatory of signatories) {
    try {
      // Create a secure token for this signatory
      const token = await createSigningToken(documentId, signatory.id);

      // Generate the signing link
      const signingLink = `${window.location.origin}/sign/${documentId}/${token}`;

      // Generate email content
      const emailHtml = generateSignatureRequestEmail({
        documentName,
        signatoryName: signatory.name,
        message,
        signingLink,
      });

      // Send the email
      await sendEmail(
        signatory.email,
        `Signature Required: ${documentName}`,
        emailHtml,
      );

      // Add to the list of links (for UI display)
      signingLinks.push({
        email: signatory.email,
        name: signatory.name,
        link: signingLink,
      });
    } catch (error) {
      console.error(`Error sending request to ${signatory.email}:`, error);
      // Continue with other signatories even if one fails
    }
  }

  return signingLinks;
}

// Generate HTML email template for signature request
function generateSignatureRequestEmail({
  documentName,
  signatoryName,
  message,
  signingLink,
}: {
  documentName: string;
  signatoryName?: string | null;
  message?: string;
  signingLink: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Document Signature Request</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
        <p>Hello ${signatoryName || "there"},</p>
        <p>You have been requested to sign the document: <strong>${documentName}</strong></p>
        ${message ? `<p>Message: ${message}</p>` : ""}
        <div style="margin: 30px 0; text-align: center;">
          <a href="${signingLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review & Sign Document</a>
        </div>
        <p style="color: #6c757d; font-size: 14px;">This link will expire in 7 days.</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}
