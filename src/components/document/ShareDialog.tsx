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
import { Plus, X, Mail, Send } from "lucide-react";

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

interface ShareDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  documentName?: string;
  onSend?: (recipients: Recipient[]) => void;
}

const ShareDialog = ({
  open = true,
  onOpenChange,
  documentName = "Contract Agreement.pdf",
  onSend,
}: ShareDialogProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", email: "", name: "" },
  ]);

  const [emailMessage, setEmailMessage] = useState(
    `Please review and sign this document: ${documentName}`,
  );

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

  const handleSend = () => {
    if (onSend) {
      onSend(recipients.filter((r) => r.email.trim() !== ""));
    }
    onOpenChange && onOpenChange(false);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canSend = recipients.some((r) => isValidEmail(r.email));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share for Signature</DialogTitle>
          <DialogDescription>
            Add recipients who need to sign "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
          <Button onClick={handleSend} disabled={!canSend}>
            <Send className="h-4 w-4 mr-2" />
            Send for Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
