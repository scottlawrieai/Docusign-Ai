import { Button } from "@/components/ui/button";
import { Upload, Home, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="w-full h-16 border-b bg-background flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <Link to="/" className="font-semibold text-xl mr-6">
          DocuSign Clone
        </Link>
        <nav className="hidden md:flex space-x-4">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Dashboard
          </Link>
          <Link
            to="/documents"
            className="text-sm font-medium hover:text-primary"
          >
            Documents
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" className="hidden md:flex">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
