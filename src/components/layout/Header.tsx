import { Button } from "@/components/ui/button";
import {
  Upload,
  Home,
  User,
  LogOut,
  Settings,
  UserCog,
  Shield,
  Key,
  CreditCard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import UploadDialog from "@/components/document/UploadDialog";
import { useState } from "react";
import UserProfileDialog from "@/components/user/UserProfileDialog";
import SecuritySettingsDialog from "@/components/user/SecuritySettingsDialog";
import BillingDialog from "@/components/user/BillingDialog";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      // Navigate to dashboard after upload
      navigate("/dashboard");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    }
  };

  const handleOpenProfile = () => {
    setProfileDialogOpen(true);
  };

  const handleOpenSecurity = () => {
    setSecurityDialogOpen(true);
  };

  const handleOpenBilling = () => {
    setBillingDialogOpen(true);
  };

  return (
    <header className="w-full h-16 border-b bg-background flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <Link to="/dashboard" className="font-semibold text-xl mr-6">
          DocuSign Clone
        </Link>
        <nav className="hidden md:flex space-x-4">
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:text-primary"
          >
            Dashboard
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex"
          onClick={handleUploadClick}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <div className="flex items-center">
          {user && (
            <span className="text-sm mr-4 hidden md:block">{user.email}</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload Document</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleOpenProfile}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenSecurity}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Security</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Key className="mr-2 h-4 w-4" />
                    <span>API Keys</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <span>View API Keys</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <span>Generate New Key</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={handleOpenBilling}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing & Plan</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleFileUpload}
      />

      {/* User Management Dialogs */}
      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />

      <SecuritySettingsDialog
        open={securityDialogOpen}
        onOpenChange={setSecurityDialogOpen}
      />

      <BillingDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
      />
    </header>
  );
};

export default Header;
