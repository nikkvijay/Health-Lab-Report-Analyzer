import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const callbackProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (callbackProcessed.current) return;

      const code = searchParams.get("code");
      const provider = searchParams.get("provider") as "google" | "github";

      if (!code || !provider) {
        console.error("Missing code or provider");
        navigate("/auth");
        return;
      }

      try {
        callbackProcessed.current = true;
        await handleOAuthCallback(code, provider);
        // Clear URL parameters and navigate
        window.history.replaceState({}, document.title, "/");
        navigate("/");
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth");
      }
    };

    handleCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <p className="text-gray-600">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
