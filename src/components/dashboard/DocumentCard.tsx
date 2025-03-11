import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Share2,
} from "lucide-react";

export type DocumentStatus = "pending" | "completed" | "expired";

interface DocumentCardProps {
  id?: string;
  title?: string;
  date?: string;
  status?: DocumentStatus;
  signatories?: number;
  signedCount?: number;
  onClick?: () => void;
}

const DocumentCard = ({
  id = "doc-123",
  title = "Contract Agreement",
  date = "2023-05-15",
  status = "pending",
  signatories = 3,
  signedCount = 1,
  onClick,
}: DocumentCardProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "expired":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return `${signedCount}/${signatories} signed`;
      case "completed":
        return "Completed";
      case "expired":
        return "Expired";
      default:
        return "Pending";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      className="w-full h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-base font-medium truncate">
              {title}
            </CardTitle>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-muted-foreground">
          <p>Created: {formatDate(date)}</p>
          <p className="mt-1">{getStatusText()}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="ghost" size="sm" className="px-2">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button variant="ghost" size="sm" className="px-2">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
