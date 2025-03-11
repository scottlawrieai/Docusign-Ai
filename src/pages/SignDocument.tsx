import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getDocument, getDocumentFileUrl, markAsSigned } from "@/lib/documents";
import SignaturePad from "@/components/ui/signature-pad";
import { sendSignatureCompletionNotification } from "@/lib/email";

interface SignatureField {
  id: string;
  x_position: number;
  y_position: number;
  page: number;
  signatory_id: string | null;
}

interface Signatory {
  id: string;
  email: string;
  name: string | null;
  signed: boolean;
}

interface SigningToken {
  id: string;
  token: string;
  document_id: string;
  signatory_id: string;
  expires_at: string;
  used_at: string | null;
}

const SignDocument = () => {
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [signatory, setSignatory] = useState<Signatory | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState("");
  const [signatureType, setSignatureType] = useState<"draw" | "type">("type");
  const [signatureImage, setSignatureImage] = useState("");
  const [tokenData, setTokenData] = useState<SigningToken | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!id || !token) {
        setError("Invalid link");
        setIsLoading(false);
        return;
      }

      try {
        // Verify the token from the database
        const { data: tokenData, error: tokenError } = await supabase
          .from("signing_tokens")
          .select("*")
          .eq("token", token)
          .eq("document_id", id)
          .single();

        if (tokenError || !tokenData) {
          setError("Invalid or expired signing link");
          setIsLoading(false);
          return;
        }

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          setError("This signing link has expired");
          setIsLoading(false);
          return;
        }

        // Check if token has already been used
        if (tokenData.used_at) {
          setError("This document has already been signed with this link");
          setIsLoading(false);
          return;
        }

        setTokenData(tokenData);

        // Get document
        const document = await getDocument(id);
        setDocument(document);

        // Get document URL
        const url = getDocumentFileUrl(document.file_path);
        setDocumentUrl(url);

        // Get signatory information
        const { data: signatory, error: signatoryError } = await supabase
          .from("signatories")
          .select("*")
          .eq("id", tokenData.signatory_id)
          .single();

        if (signatoryError || !signatory) {
          setError("Could not find signatory information");
          setIsLoading(false);
          return;
        }

        setSignatory(signatory);

        if (signatory.signed) {
          setSuccess(true);
          setIsLoading(false);
          return;
        }

        // Get signature fields
        const { data: fields, error: fieldError } = await supabase
          .from("signature_fields")
          .select("*")
          .eq("document_id", id);

        if (fieldError) throw fieldError;
        setSignatureFields(fields || []);
      } catch (error) {
        console.error("Error verifying token:", error);
        setError(
          "Could not verify this signing link. It may have expired or been revoked.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [id, token]);

  const handleSign = async () => {
    if (!id || !signatory || !tokenData) return;

    try {
      setIsLoading(true);

      // Save the signature data
      const signatureData =
        signatureType === "draw" ? signatureImage : signature;
      if (!signatureData) {
        setError("Please provide a signature");
        setIsLoading(false);
        return;
      }

      // Store the signature in the database
      const { error: signatureError } = await supabase
        .from("signatures")
        .insert({
          signatory_id: signatory.id,
          document_id: id,
          signature_data: signatureData,
          signature_type: signatureType,
          created_at: new Date().toISOString(),
        });

      if (signatureError) throw signatureError;

      // Mark the document as signed by this signatory
      await markAsSigned(id, signatory.id);

      // Mark the token as used
      const { error: tokenUpdateError } = await supabase
        .from("signing_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      if (tokenUpdateError) throw tokenUpdateError;

      // Check if all signatories have signed
      const { data: document } = await supabase
        .from("documents")
        .select("*, user:user_id(email, id)")
        .eq("id", id)
        .single();

      if (document && document.signatories_count === document.signed_count) {
        // All signatories have signed, notify the document owner
        try {
          await sendSignatureCompletionNotification({
            documentId: id,
            documentName: document.title,
            ownerEmail: document.user.email,
            ownerName: document.user.email.split("@")[0], // Simple fallback name
          });
        } catch (notifyError) {
          console.error("Error sending completion notification:", notifyError);
          // Continue even if notification fails
        }
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error signing document:", error);
      setError("Failed to sign document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureChange = (dataUrl: string) => {
    setSignatureImage(dataUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.close()} className="w-full">
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Document Signed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Thank you! You have successfully signed this document.</p>
            <p className="text-sm text-muted-foreground mt-2">
              All parties will be notified when the document is fully signed.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.close()} className="w-full">
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full h-16 border-b bg-background flex items-center justify-between px-6 shadow-sm">
        <div className="font-semibold text-xl">DocuSign Clone</div>
        <div className="text-sm">{signatory?.name || signatory?.email}</div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{document?.title}</h1>
          <p className="text-muted-foreground">
            Please review and sign this document
          </p>
        </div>

        <div className="relative w-full border rounded-lg overflow-auto bg-white mb-6">
          <div
            className="flex items-center justify-center p-4"
            style={{ minHeight: "60vh" }}
          >
            <img
              src={
                documentUrl ||
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
              }
              alt="Document Preview"
              className="max-w-full max-h-full object-contain"
            />

            {signatureFields.map((field) => (
              <div
                key={field.id}
                className="absolute border-2 border-primary bg-primary/10 rounded p-2"
                style={{
                  left: `${field.x_position}%`,
                  top: `${field.y_position}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="text-xs font-medium">Sign here</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Your Signature</h2>

          <div className="mb-4">
            <div className="flex space-x-2 mb-4">
              <Button
                variant={signatureType === "type" ? "default" : "outline"}
                onClick={() => setSignatureType("type")}
                className="flex-1"
              >
                Type
              </Button>
              <Button
                variant={signatureType === "draw" ? "default" : "outline"}
                onClick={() => setSignatureType("draw")}
                className="flex-1"
              >
                Draw
              </Button>
            </div>

            {signatureType === "type" ? (
              <div className="border rounded-md p-4 bg-muted/20">
                <div className="flex items-center justify-center border-b border-dashed border-gray-300 pb-4 mb-4">
                  <input
                    type="text"
                    placeholder="Type your name"
                    className="w-full max-w-md p-2 text-center text-xl font-signature border-none bg-transparent focus:outline-none"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  By signing this document, you agree to be bound by its terms
                  and conditions.
                </p>
              </div>
            ) : (
              <div className="border rounded-md p-4 bg-muted/20">
                <div className="flex flex-col items-center justify-center mb-4">
                  <SignaturePad
                    onChange={handleSignatureChange}
                    width={400}
                    height={200}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  By signing this document, you agree to be bound by its terms
                  and conditions.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => window.close()}>
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={
              signatureType === "type" ? !signature.trim() : !signatureImage
            }
          >
            Complete Signing
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SignDocument;
