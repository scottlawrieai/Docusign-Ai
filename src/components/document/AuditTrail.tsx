import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDocumentAuditTrail } from "@/lib/documents";
import {
  ClipboardList,
  Download,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";

interface AuditEvent {
  event: string;
  timestamp: string;
  user: string;
  details: string;
}

interface AuditTrailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

const AuditTrail = ({ open, onOpenChange, documentId }: AuditTrailProps) => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      if (!documentId || !open) return;

      try {
        setIsLoading(true);
        const events = await getDocumentAuditTrail(documentId);
        setAuditEvents(events);
      } catch (error) {
        console.error("Error fetching audit trail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditTrail();
  }, [documentId, open]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case "Document Created":
        return <ClipboardList className="h-4 w-4 text-blue-500" />;
      case "Document Viewed":
        return <User className="h-4 w-4 text-gray-500" />;
      case "Document Signed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Document Sent":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownload = () => {
    // Generate a CSV of the audit trail
    const headers = ["Event", "Timestamp", "User", "Details"];
    const csvContent = [
      headers.join(","),
      ...auditEvents.map((event) =>
        [
          event.event,
          formatDate(event.timestamp),
          event.user,
          `"${event.details.replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-trail-${documentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Document Audit Trail
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {auditEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No audit events found for this document.
                  </p>
                ) : (
                  auditEvents.map((event, index) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          {getEventIcon(event.event)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.event}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.timestamp)}
                          </p>
                          <p className="text-sm mt-1">{event.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {event.user}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={auditEvents.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download Audit Trail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditTrail;
