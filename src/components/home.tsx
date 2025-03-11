import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to dashboard if logged in, otherwise to login
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  }, [navigate, user, isLoading]);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default Home;
