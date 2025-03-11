import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import DocumentEditor from "@/components/document/DocumentEditor";
import ShareDialog from "@/components/document/ShareDialog";
import { useAuth } from "@/context/AuthContext";
import {
  getDocument,
  getDocumentFileUrl,
  addSignatureFields,
  addSignatories,
  getDocumentSignatureFields,
} from "@/lib/documents";

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

const DocumentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [signatureFields, setSignatureFields] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id || !user) return;

      try {
        setIsLoading(true);
        const document = await getDocument(id);
        setDocumentName(document.title);

        // Get document file URL from storage
        const url = getDocumentFileUrl(document.file_path);
        setDocumentUrl(url);

        // Fetch existing signature fields
        try {
          const fields = await getDocumentSignatureFields(id);
          if (fields && fields.length > 0) {
            setSignatureFields(
              fields.map((field) => ({
                id: field.id,
                x: field.x_position,
                y: field.y_position,
              })),
            );
          }
        } catch (fieldError) {
          console.error("Error fetching signature fields:", fieldError);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id, user, navigate]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleSave = async () => {
    if (!id || !user) return;

    try {
      // Save signature fields to database
      await addSignatureFields(
        id,
        signatureFields.map((field) => ({
          x: field.x,
          y: field.y,
          page: 1,
        })),
      );

      console.log("Document saved");
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  const handleAddSignatory = () => {
    setShareDialogOpen(true);
  };

  const handleSend = () => {
    setShareDialogOpen(true);
  };

  const handleShareSend = async (
    recipients: { email: string; name?: string }[],
  ) => {
    if (!id || !user) return;

    try {
      // Add signatories to database
      await addSignatories(id, recipients);
    } catch (error) {
      console.error("Error sending document:", error);
    }
  };

  const handleAddSignatureField = (newField: {
    id: string;
    x: number;
    y: number;
  }) => {
    setSignatureFields((prev) => [...prev, newField]);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DocumentEditor
          documentName={documentName}
          documentUrl={
            documentUrl ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
          }
          onBack={handleBack}
          onSave={handleSave}
          onAddSignatory={handleAddSignatory}
          onSend={handleSend}
        />
      </main>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentName={documentName}
        documentId={id}
        onSend={handleShareSend}
      />
    </div>
  );
};

export default DocumentView;
