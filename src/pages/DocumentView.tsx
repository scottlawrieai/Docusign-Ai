import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import DocumentEditor from "@/components/document/DocumentEditor";
import ShareDialog from "@/components/document/ShareDialog";
import BulkSendDialog from "@/components/document/BulkSendDialog";
import AuditTrail from "@/components/document/AuditTrail";
import TemplateLibrary from "@/components/document/TemplateLibrary";
import DocumentExpiration from "@/components/document/DocumentExpiration";
import DocumentReminders from "@/components/document/DocumentReminders";
import DocumentAccessControl from "@/components/document/DocumentAccessControl";
import { useAuth } from "@/context/AuthContext";
import {
  getDocument,
  getDocumentFileUrl,
  addSignatureFields,
  addSignatories,
  getDocumentSignatureFields,
} from "@/lib/documents";
import { toast } from "@/components/ui/use-toast";

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
  const [bulkSendDialogOpen, setBulkSendDialogOpen] = useState(false);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [expirationDialogOpen, setExpirationDialogOpen] = useState(false);
  const [remindersDialogOpen, setRemindersDialogOpen] = useState(false);
  const [accessControlDialogOpen, setAccessControlDialogOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fields, setFields] = useState<
    { id: string; x: number; y: number; type: string; value?: string }[]
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
        console.log("Document URL from storage:", url);

        // For PDF files, we might need to use a PDF viewer or convert to image
        // For now, we'll use the URL directly and handle display in the component
        setDocumentUrl(url);

        // For debugging - check if the URL is accessible via fetch
        fetch(url, { method: "HEAD" })
          .then((response) => {
            if (response.ok) {
              console.log("Document URL is accessible", response.status);
            } else {
              console.error("Document URL returned status:", response.status);
            }
          })
          .catch((err) => console.error("Error checking document URL:", err));

        // Preload the image to check if it's accessible
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => console.log("Document preload successful");
        img.onerror = (e) => console.error("Document preload failed:", e);
        img.src = url;

        // Fetch existing signature fields
        try {
          const fields = await getDocumentSignatureFields(id);
          if (fields && fields.length > 0) {
            setFields(
              fields.map((field) => ({
                id: field.id,
                x: field.x_position,
                y: field.y_position,
                type: field.field_type || "signature",
                value: field.field_value || field.signature_data, // Support both new and old data format
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
        fields.map((field) => ({
          x: field.x,
          y: field.y,
          page: 1,
          field_type: field.type,
          field_value: field.value,
        })),
      );

      toast({
        title: "Document saved",
        description: "Your signature fields have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Error saving document",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
    }
  };

  const handleAddSignatory = () => {
    setShareDialogOpen(true);
  };

  const handleSend = () => {
    // Check if there are signature fields before sending
    if (fields.length === 0) {
      toast({
        title: "No signature fields",
        description: "Please add at least one signature field before sending.",
        variant: "destructive",
      });
      return;
    }

    setShareDialogOpen(true);
  };

  const handleBulkSend = () => {
    // Check if there are signature fields before sending
    if (fields.length === 0) {
      toast({
        title: "No signature fields",
        description: "Please add at least one signature field before sending.",
        variant: "destructive",
      });
      return;
    }

    setBulkSendDialogOpen(true);
  };

  const handleViewAuditTrail = () => {
    setAuditTrailOpen(true);
  };

  const handleOpenTemplateLibrary = () => {
    setTemplateLibraryOpen(true);
  };

  const handleSaveAsTemplate = () => {
    setTemplateLibraryOpen(true);
  };

  const handleSetExpiration = () => {
    setExpirationDialogOpen(true);
  };

  const handleSendReminders = () => {
    setRemindersDialogOpen(true);
  };

  const handleAccessControl = () => {
    setAccessControlDialogOpen(true);
  };

  const handleShareSend = async (
    recipients: { email: string; name?: string }[],
  ) => {
    if (!id || !user) return;

    try {
      // Add signatories to database
      await addSignatories(id, recipients);

      toast({
        title: "Document sent",
        description: `Signature requests sent to ${recipients.length} recipient(s).`,
      });
    } catch (error) {
      console.error("Error sending document:", error);
      toast({
        title: "Error sending document",
        description: "There was a problem sending your document.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    // Logic to apply the selected template to the current document
    toast({
      title: "Template applied",
      description: "The selected template has been applied to your document.",
    });
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
          onBulkSend={handleBulkSend}
          onViewAuditTrail={handleViewAuditTrail}
          onOpenTemplateLibrary={handleOpenTemplateLibrary}
          onSaveAsTemplate={handleSaveAsTemplate}
          onSetExpiration={handleSetExpiration}
          onSendReminders={handleSendReminders}
          onAccessControl={handleAccessControl}
        />
      </main>

      {/* Feature Dialogs */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentName={documentName}
        documentId={id}
        onSend={handleShareSend}
      />

      <BulkSendDialog
        open={bulkSendDialogOpen}
        onOpenChange={setBulkSendDialogOpen}
        documentName={documentName}
        documentId={id}
        onSend={handleShareSend}
      />

      <AuditTrail
        open={auditTrailOpen}
        onOpenChange={setAuditTrailOpen}
        documentId={id || ""}
      />

      <TemplateLibrary
        open={templateLibraryOpen}
        onOpenChange={setTemplateLibraryOpen}
        onSelectTemplate={handleSelectTemplate}
        currentDocumentId={id}
      />

      <DocumentExpiration
        open={expirationDialogOpen}
        onOpenChange={setExpirationDialogOpen}
        documentId={id || ""}
        documentName={documentName}
      />

      <DocumentReminders
        open={remindersDialogOpen}
        onOpenChange={setRemindersDialogOpen}
        documentId={id || ""}
        documentName={documentName}
      />

      <DocumentAccessControl
        open={accessControlDialogOpen}
        onOpenChange={setAccessControlDialogOpen}
        documentId={id || ""}
        documentName={documentName}
      />
    </div>
  );
};

export default DocumentView;
