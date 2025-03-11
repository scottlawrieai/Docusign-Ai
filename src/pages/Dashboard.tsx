import { useState } from "react";
import Header from "@/components/layout/Header";
import StatusDashboard from "@/components/dashboard/StatusDashboard";
import DocumentGrid from "@/components/dashboard/DocumentGrid";
import UploadDialog from "@/components/document/UploadDialog";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleDocumentClick = (id: string) => {
    navigate(`/document/${id}`);
  };

  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file);
    // In a real app, you would upload the file to your backend here
    // Then navigate to the document editor
    navigate(`/document/new`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-8">
          <StatusDashboard
            pendingCount={5}
            completedCount={12}
            expiredCount={2}
          />

          <DocumentGrid
            onUploadClick={handleUploadClick}
            onDocumentClick={handleDocumentClick}
          />
        </div>
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
