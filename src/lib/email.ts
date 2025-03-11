import { supabase } from "./supabase";
import { Signatory } from "./documents";
import { v4 as uuidv4 } from "uuid";

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

// Notify document owner when all signatures are complete
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
