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
import { Plus, X, Mail, Send, Copy, Check, AlertCircle } from "lucide-react";
import { sendSignatureRequest } from "@/lib/email";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

interface ShareDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  documentName?: string;
  documentId?: string;
  onSend?: (recipients: Recipient[]) => void;
}

const ShareDialog = ({
  open = true,
  onOpenChange,
  documentName = "Contract Agreement.pdf",
  documentId,
  onSend,
}: ShareDialogProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", email: "", name: "" },
  ]);
  const [emailMessage, setEmailMessage] = useState(
    `Please review and sign this document: ${documentName}`,
  );
  const [isSending, setIsSending] = useState(false);
  const [signingLinks, setSigningLinks] = useState<
    { email: string; link: string }[]
  >([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { id: Date.now().toString(), email: "", name: "" },
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((r) => r.id !== id));
    }
  };

  const updateRecipient = (
    id: string,
    field: "email" | "name",
    value: string,
  ) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleSend = async () => {
    if (!documentId) return;

    const validRecipients = recipients.filter((r) => isValidEmail(r.email));
    if (validRecipients.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      // Generate signing links and send emails
      const links = await sendSignatureRequest({
        documentId,
        documentName,
        signatories: validRecipients,
        message: emailMessage,
      });

      setSigningLinks(links);
      setSuccess(true);

      // Call the onSend callback
      if (onSend) {
        onSend(validRecipients);
      }
    } catch (err) {
      console.error("Error sending signature requests:", err);
      setError("Failed to send signature requests. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleClose = () => {
    setSigningLinks([]);
    setSuccess(false);
    setError(null);
    onOpenChange && onOpenChange(false);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canSend = recipients.some((r) => isValidEmail(r.email));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          // Show success message after sending
          <>
            <DialogHeader>
              <DialogTitle>Signature Requests Sent</DialogTitle>
              <DialogDescription>
                Email invitations have been sent to the signatories
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
                      <p>Signature requests have been sent successfully.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Recipients</h3>
                {signingLinks.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div className="text-sm">{item.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Email sent
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          // Show recipient form before sending
          <>
            <DialogHeader>
              <DialogTitle>Share for Signature</DialogTitle>
              <DialogDescription>
                Add recipients who need to sign "{documentName}"
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Recipients</h3>
                {recipients.map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Email address"
                        value={recipient.email}
                        onChange={(e) =>
                          updateRecipient(recipient.id, "email", e.target.value)
                        }
                        className={
                          !recipient.email || isValidEmail(recipient.email)
                            ? ""
                            : "border-red-500"
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Name (optional)"
                        value={recipient.name}
                        onChange={(e) =>
                          updateRecipient(recipient.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(recipient.id)}
                      disabled={recipients.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRecipient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Recipient
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Email Message</h3>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 pl-10 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                    placeholder="Add a message (optional)"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => onOpenChange && onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={!canSend || isSending}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send for Signature"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
