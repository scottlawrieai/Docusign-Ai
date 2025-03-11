import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import DocumentEditor from "@/components/document/DocumentEditor";
import ShareDialog from "@/components/document/ShareDialog";

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

const DocumentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // In a real app, you would fetch the document data based on the ID
  const documentName = id === "new" ? "New Document.pdf" : `Document ${id}.pdf`;

  const handleBack = () => {
    navigate("/");
  };

  const handleSave = () => {
    console.log("Document saved");
    // In a real app, you would save the document state here
  };

  const handleAddSignatory = () => {
    setShareDialogOpen(true);
  };

  const handleSend = () => {
    setShareDialogOpen(true);
  };

  const handleShareSend = (recipients: Recipient[]) => {
    console.log("Sending document to:", recipients);
    // In a real app, you would send the document to the recipients here
    navigate("/");
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DocumentEditor
          documentName={documentName}
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
        onSend={handleShareSend}
      />
    </div>
  );
};

export default DocumentView;
