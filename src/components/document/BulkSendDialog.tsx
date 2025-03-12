import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, X, Users, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

interface BulkSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName?: string;
  documentId?: string;
  onSend?: (recipients: Recipient[]) => void;
}

const BulkSendDialog = ({
  open = true,
  onOpenChange,
  documentName = "Contract Agreement.pdf",
  documentId,
  onSend,
}: BulkSendDialogProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailMessage, setEmailMessage] = useState(
    `Please review and sign this document: ${documentName}`,
  );
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      readCSVFile(file);
    }
  };

  const readCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processCSVData(text);
      }
    };
    reader.readAsText(file);
  };

  const processCSVData = (csvText: string) => {
    const lines = csvText.split("\n");
    const newRecipients: Recipient[] = [];

    // Skip header row if it exists
    const startRow = lines[0].toLowerCase().includes("email") ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      const email = parts[0]?.trim();
      const name = parts[1]?.trim() || "";

      if (email && isValidEmail(email)) {
        newRecipients.push({
          id: `csv-${i}`,
          email,
          name,
        });
      }
    }

    setRecipients(newRecipients);
  };

  const handleBulkTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBulkText(text);
  };

  const processBulkText = () => {
    const emails = bulkText
      .split(/[\n,;]/) // Split by newline, comma, or semicolon
      .map((email) => email.trim())
      .filter((email) => email && isValidEmail(email));

    const newRecipients = emails.map((email, index) => ({
      id: `bulk-${index}`,
      email,
    }));

    setRecipients(newRecipients);
    setBulkText(""); // Clear the input after processing
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleSend = async () => {
    if (!documentId) return;

    if (recipients.length === 0) {
      setError("Please add at least one recipient");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Call the onSend callback
      if (onSend) {
        await onSend(recipients);
      }
      setSuccess(true);
    } catch (err: any) {
      console.error("Error sending signature requests:", err);
      setError(
        err.message || "Failed to send signature requests. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setRecipients([]);
    setCsvFile(null);
    setBulkText("");
    setSuccess(false);
    setError(null);
    onOpenChange && onOpenChange(false);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          // Show success message after sending
          <>
            <DialogHeader>
              <DialogTitle>Bulk Signature Requests Sent</DialogTitle>
              <DialogDescription>
                Email invitations have been sent to {recipients.length}{" "}
                recipients
              </DialogDescription>
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
                        Bulk signature requests have been sent successfully.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">
                    Recipients ({recipients.length})
                  </h3>
                  {recipients.map((recipient, index) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div className="text-sm">
                        {recipient.email}
                        {recipient.name && ` (${recipient.name})`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Email sent
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          // Show recipient form before sending
          <>
            <DialogHeader>
              <DialogTitle>Bulk Send for Signature</DialogTitle>
              <DialogDescription>
                Send "{documentName}" to multiple recipients at once
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Upload CSV File</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5"
                  onClick={() => document.getElementById("csv-upload")?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">
                    {csvFile
                      ? csvFile.name
                      : "Upload a CSV file with recipients"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Format: email,name (name is optional)
                  </p>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Or Enter Emails</Label>
                <Textarea
                  placeholder="Enter emails separated by commas, semicolons, or new lines"
                  value={bulkText}
                  onChange={handleBulkTextChange}
                  className="min-h-[100px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={processBulkText}
                  disabled={!bulkText.trim()}
                >
                  Add Emails
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="space-y-2">
                  <Label>Recipients ({recipients.length})</Label>
                  <ScrollArea className="h-[150px] border rounded-md p-2">
                    <div className="space-y-2">
                      {recipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className="flex items-center justify-between border-b pb-2"
                        >
                          <div className="text-sm">
                            {recipient.email}
                            {recipient.name && ` (${recipient.name})`}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRecipient(recipient.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email-message">Email Message</Label>
                <Textarea
                  id="email-message"
                  placeholder="Add a message to include in the email"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={recipients.length === 0 || isSending}
              >
                <Users className="h-4 w-4 mr-2" />
                {isSending
                  ? "Sending..."
                  : `Send to ${recipients.length} Recipients`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkSendDialog;
