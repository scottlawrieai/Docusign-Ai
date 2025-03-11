import { Button } from "@/components/ui/button";
import DocumentCard, { DocumentStatus } from "./DocumentCard";
import { Plus, Filter } from "lucide-react";

interface Document {
  id: string;
  title: string;
  date: string;
  status: DocumentStatus;
  signatories: number;
  signedCount: number;
}

interface DocumentGridProps {
  documents?: Document[];
  onUploadClick?: () => void;
  onDocumentClick?: (id: string) => void;
}

const DocumentGrid = ({
  documents = [
    {
      id: "doc1",
      title: "Employment Contract",
      date: "2023-06-10",
      status: "pending",
      signatories: 2,
      signedCount: 1,
    },
    {
      id: "doc2",
      title: "NDA Agreement",
      date: "2023-06-05",
      status: "completed",
      signatories: 2,
      signedCount: 2,
    },
    {
      id: "doc3",
      title: "Lease Agreement",
      date: "2023-05-28",
      status: "pending",
      signatories: 3,
      signedCount: 1,
    },
    {
      id: "doc4",
      title: "Service Contract",
      date: "2023-05-15",
      status: "expired",
      signatories: 2,
      signedCount: 0,
    },
    {
      id: "doc5",
      title: "Partnership Agreement",
      date: "2023-06-01",
      status: "pending",
      signatories: 4,
      signedCount: 2,
    },
    {
      id: "doc6",
      title: "Consulting Agreement",
      date: "2023-05-20",
      status: "completed",
      signatories: 2,
      signedCount: 2,
    },
  ],
  onUploadClick,
  onDocumentClick,
}: DocumentGridProps) => {
  return (
    <div className="w-full bg-background">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Your Documents</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={onUploadClick}>
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            date={doc.date}
            status={doc.status}
            signatories={doc.signatories}
            signedCount={doc.signedCount}
            onClick={() => onDocumentClick && onDocumentClick(doc.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentGrid;
