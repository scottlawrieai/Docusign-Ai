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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Eye, UserPlus, X, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getDocumentAccessSettings,
  updateDocumentAccess,
} from "@/lib/documents";

interface AccessUser {
  id: string;
  email: string;
  name?: string;
  access_level: "view" | "edit" | "owner";
}

interface DocumentAccessControlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName?: string;
}

const DocumentAccessControl = ({
  open,
  onOpenChange,
  documentId,
  documentName = "Document",
}: DocumentAccessControlProps) => {
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [isPubliclyViewable, setIsPubliclyViewable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAccessSettings = async () => {
      if (!documentId || !open) return;

      try {
        setIsLoading(true);
        const settings = await getDocumentAccessSettings(documentId);
        setAccessUsers(settings.users || []);
        setIsPasswordProtected(!!settings.password_protected);
        setIsPubliclyViewable(!!settings.publicly_viewable);
      } catch (error) {
        console.error("Error fetching access settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessSettings();
  }, [documentId, open]);

  const handleAddUser = () => {
    if (!newUserEmail.trim() || !isValidEmail(newUserEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if user already exists
    if (
      accessUsers.some(
        (user) => user.email.toLowerCase() === newUserEmail.toLowerCase(),
      )
    ) {
      setError("This user already has access to the document");
      return;
    }

    setAccessUsers((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        email: newUserEmail,
        access_level: "view",
      },
    ]);
    setNewUserEmail("");
    setError(null);
  };

  const handleRemoveUser = (id: string) => {
    setAccessUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const handleChangeAccessLevel = (
    id: string,
    level: "view" | "edit" | "owner",
  ) => {
    setAccessUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, access_level: level } : user,
      ),
    );
  };

  const handleTogglePasswordProtection = (checked: boolean) => {
    setIsPasswordProtected(checked);
    if (!checked) {
      setPassword("");
    }
  };

  const handleTogglePublicAccess = (checked: boolean) => {
    setIsPubliclyViewable(checked);
  };

  const handleSave = async () => {
    if (isPasswordProtected && !password && !isPasswordAlreadySet()) {
      setError("Please enter a password");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateDocumentAccess({
        documentId,
        users: accessUsers,
        passwordProtected: isPasswordProtected,
        password: isPasswordProtected ? password : null,
        publiclyViewable: isPubliclyViewable,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error("Error updating access settings:", err);
      setError(
        err.message || "Failed to update access settings. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    onOpenChange(false);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isPasswordAlreadySet = () => {
    // This would check if a password is already set in the database
    // For now, we'll just return false
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          // Show success message after saving
          <>
            <DialogHeader>
              <DialogTitle>Access Settings Saved</DialogTitle>
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
                        Document access settings have been updated successfully.
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
          // Show access control form
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Document Access Control
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Public Access</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow anyone with the link to view this document
                        </p>
                      </div>
                      <Switch
                        checked={isPubliclyViewable}
                        onCheckedChange={handleTogglePublicAccess}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Password Protection</Label>
                        <p className="text-sm text-muted-foreground">
                          Require a password to access this document
                        </p>
                      </div>
                      <Switch
                        checked={isPasswordProtected}
                        onCheckedChange={handleTogglePasswordProtection}
                      />
                    </div>

                    {isPasswordProtected && (
                      <div className="space-y-2">
                        <Label htmlFor="document-password">
                          Document Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="document-password"
                            type="password"
                            className="pl-10"
                            placeholder={
                              isPasswordAlreadySet()
                                ? "••••••••"
                                : "Enter password"
                            }
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        {isPasswordAlreadySet() && (
                          <p className="text-xs text-muted-foreground">
                            Leave blank to keep the current password
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Shared With</Label>
                      <div className="flex">
                        <Input
                          placeholder="Enter email address"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="rounded-r-none"
                        />
                        <Button
                          onClick={handleAddUser}
                          className="rounded-l-none"
                          disabled={
                            !newUserEmail.trim() || !isValidEmail(newUserEmail)
                          }
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>

                      <ScrollArea className="h-[200px] rounded-md border p-2">
                        {accessUsers.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            No users have been granted access yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {accessUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                              >
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {user.email}
                                    </p>
                                    {user.name && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {user.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={user.access_level}
                                    onChange={(e) =>
                                      handleChangeAccessLevel(
                                        user.id,
                                        e.target.value as
                                          | "view"
                                          | "edit"
                                          | "owner",
                                      )
                                    }
                                    className="text-xs rounded border-input bg-transparent px-2 py-1"
                                  >
                                    <option value="view">View</option>
                                    <option value="edit">Edit</option>
                                    <option value="owner">Owner</option>
                                  </select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveUser(user.id)}
                                    className="h-7 w-7"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentAccessControl;
