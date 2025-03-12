import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, Send, User, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDocumentSignatories, sendReminderEmails } from "@/lib/documents";

interface Signatory {
  id: string;
  email: string;
  name?: string;
  signed: boolean;
  signed_at?: string;
  last_reminded_at?: string;
}

interface DocumentRemindersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName?: string;
}

const DocumentReminders = ({
  open,
  onOpenChange,
  documentId,
  documentName = "Document",
}: DocumentRemindersProps) => {
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [selectedSignatories, setSelectedSignatories] = useState<string[]>([]);
  const [reminderMessage, setReminderMessage] = useState(
    `This is a friendly reminder to sign the document: ${documentName}`,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSignatories = async () => {
      if (!documentId || !open) return;

      try {
        setIsLoading(true);
        const data = await getDocumentSignatories(documentId);
        setSignatories(data);

        // Auto-select unsigned signatories
        setSelectedSignatories(data.filter((s) => !s.signed).map((s) => s.id));
      } catch (error) {
        console.error("Error fetching signatories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignatories();
  }, [documentId, open]);

  const handleToggleSignatory = (id: string) => {
    setSelectedSignatories((prev) =>
      prev.includes(id) ? prev.filter((sigId) => sigId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const unsignedIds = signatories.filter((s) => !s.signed).map((s) => s.id);
    setSelectedSignatories(unsignedIds);
  };

  const handleClearAll = () => {
    setSelectedSignatories([]);
  };

  const handleSendReminders = async () => {
    if (selectedSignatories.length === 0) {
      setError("Please select at least one recipient");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendReminderEmails({
        documentId,
        documentName,
        signatoryIds: selectedSignatories,
        message: reminderMessage,
      });
      setSuccess(true);

      // Update last reminded timestamp
      const now = new Date().toISOString();
      setSignatories((prev) =>
        prev.map((s) =>
          selectedSignatories.includes(s.id)
            ? { ...s, last_reminded_at: now }
            : s,
        ),
      );
    } catch (err: any) {
      console.error("Error sending reminders:", err);
      setError(err.message || "Failed to send reminders. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          // Show success message after sending
          <>
            <DialogHeader>
              <DialogTitle>Reminders Sent</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Success
                    </h3>
                    <div className="mt-1 text-sm text-green-700">
                      <p>
                        Reminder emails have been sent successfully to{" "}
                        {selectedSignatories.length} recipient(s).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          // Show reminder form
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Send Reminders
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Recipients</Label>
                      <div className="space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleSelectAll}
                          className="h-auto p-0"
                        >
                          Select All Pending
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleClearAll}
                          className="h-auto p-0"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      {signatories.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No signatories found for this document.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {signatories.map((signatory) => (
                            <div
                              key={signatory.id}
                              className={`flex items-center justify-between p-2 rounded-md ${signatory.signed ? "bg-green-50" : "hover:bg-muted/50"}`}
                            >
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedSignatories.includes(
                                    signatory.id,
                                  )}
                                  onCheckedChange={() =>
                                    handleToggleSignatory(signatory.id)
                                  }
                                  disabled={signatory.signed}
                                />
                                <div>
                                  <div className="flex items-center">
                                    <User className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {signatory.email}
                                      {signatory.name && ` (${signatory.name})`}
                                    </span>
                                    {signatory.signed && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        Signed
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {signatory.signed
                                      ? `Signed on: ${formatDate(signatory.signed_at)}`
                                      : signatory.last_reminded_at
                                        ? `Last reminded: ${formatDate(signatory.last_reminded_at)}`
                                        : "Not reminded yet"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder-message">Reminder Message</Label>
                    <textarea
                      id="reminder-message"
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                      placeholder="Add a message for the reminder email"
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSendReminders}
                disabled={
                  selectedSignatories.length === 0 || isSending || isLoading
                }
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending
                  ? "Sending..."
                  : `Send ${selectedSignatories.length} Reminder${selectedSignatories.length !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentReminders;
