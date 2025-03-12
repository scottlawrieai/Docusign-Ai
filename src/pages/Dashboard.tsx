import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import StatusDashboard from "@/components/dashboard/StatusDashboard";
import DocumentGrid from "@/components/dashboard/DocumentGrid";
import UploadDialog from "@/components/document/UploadDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  getUserDocuments,
  uploadDocumentFile,
  createDocument,
} from "@/lib/documents";
import { DocumentStatus } from "@/components/dashboard/DocumentCard";

interface Document {
  id: string;
  title: string;
  date: string;
  status: DocumentStatus;
  signatories: number;
  signedCount: number;
}

const Dashboard = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, completed: 0, expired: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const docs = await getUserDocuments(user.id);

        // Transform to the format our components expect
        const formattedDocs = docs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          date: doc.created_at,
          status: doc.status as DocumentStatus,
          signatories: doc.signatories_count,
          signedCount: doc.signed_count,
        }));

        setDocuments(formattedDocs);

        // Calculate stats
        const pending = docs.filter((doc) => doc.status === "pending").length;
        const completed = docs.filter(
          (doc) => doc.status === "completed",
        ).length;
        const expired = docs.filter((doc) => doc.status === "expired").length;

        setStats({ pending, completed, expired });
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleDocumentClick = (id: string) => {
    navigate(`/document/${id}`);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      console.log("Starting file upload process for:", file.name);

      // Upload file to Supabase storage
      const filePath = await uploadDocumentFile(file, user.id);
      console.log("File uploaded successfully, path:", filePath);

      // Create document record in database
      const document = await createDocument({
        title: file.name,
        user_id: user.id,
        file_path: filePath,
      });
      console.log("Document record created:", document.id);

      // Navigate to document editor
      navigate(`/document/${document.id}`);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <StatusDashboard
              pendingCount={stats.pending}
              completedCount={stats.completed}
              expiredCount={stats.expired}
            />

            <DocumentGrid
              documents={documents}
              onUploadClick={handleUploadClick}
              onDocumentClick={handleDocumentClick}
            />
          </div>
        )}
      </main>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleFileUpload}
      />
    </div>
  );
};

export default Dashboard;
