import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setDocumentExpiration } from "@/lib/documents";

interface DocumentExpirationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName?: string;
  currentExpiration?: string | null;
}

const DocumentExpiration = ({
  open,
  onOpenChange,
  documentId,
  documentName = "Document",
  currentExpiration = null,
}: DocumentExpirationProps) => {
  const [hasExpiration, setHasExpiration] = useState(!!currentExpiration);
  const [expirationDate, setExpirationDate] = useState(
    currentExpiration
      ? new Date(currentExpiration).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Default to 30 days from now
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggleExpiration = (checked: boolean) => {
    setHasExpiration(checked);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpirationDate(e.target.value);
  };

  const handleSave = async () => {
    if (hasExpiration && !expirationDate) {
      setError("Please select a valid expiration date");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await setDocumentExpiration({
        documentId,
        expirationDate: hasExpiration ? expirationDate : null,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error("Error setting document expiration:", err);
      setError(err.message || "Failed to set expiration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    onOpenChange(false);
  };

  const isValidDate = () => {
    if (!hasExpiration) return true;
    if (!expirationDate) return false;

    const selected = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected >= today;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          // Show success message after saving
          <>
            <DialogHeader>
              <DialogTitle>Expiration Settings Saved</DialogTitle>
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
                        {hasExpiration
                          ? `Document will expire on ${new Date(expirationDate).toLocaleDateString()}`
                          : "Document will not expire"}
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
          // Show expiration settings form
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Document Expiration
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Expiration</Label>
                    <p className="text-sm text-muted-foreground">
                      Set a date when this document will expire and no longer
                      accept signatures
                    </p>
                  </div>
                  <Switch
                    checked={hasExpiration}
                    onCheckedChange={handleToggleExpiration}
                  />
                </div>

                {hasExpiration && (
                  <div className="space-y-2">
                    <Label htmlFor="expiration-date">Expiration Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="expiration-date"
                        type="date"
                        className="pl-10"
                        value={expirationDate}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split("T")[0]} // Can't select dates in the past
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      After this date, the document will be marked as expired
                      and signatories will no longer be able to sign it.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValidDate() || isSaving}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentExpiration;
