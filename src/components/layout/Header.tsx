import { Button } from "@/components/ui/button";
import { Upload, Home, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
          onClick={() => navigate("/dashboard")}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <div className="flex items-center">
          {user && (
            <span className="text-sm mr-4 hidden md:block">{user.email}</span>
          )}
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
