// src/pages/AuthPage.tsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [error, setError] = useState<string | null>(null);
  const { loginWithEmail, signup, handleOAuthCallback, isAuthenticated } =
    useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting to /");
      navigate("/");
    }

    const code = searchParams.get("code");
    const provider = searchParams.get("provider") as "google" | "github" | null;

    if (code && provider) {
      console.log(`Processing OAuth callback for ${provider} with code:`, code);
      handleOAuthCallback(code, provider)
        .then(() => {
          console.log(`${provider} OAuth successful, redirecting to /`);
          navigate("/");
        })
        .catch((err) => {
          console.error(`${provider} callback error:`, err);
          setError(err.message || `${provider} authentication failed`);
        });
    }
  }, [searchParams, handleOAuthCallback, isAuthenticated, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log("AuthPage: Initiating login:", { email });
      await loginWithEmail({ email, password });
      console.log("Login successful, redirecting to /");
      navigate("/");
    } catch (e: any) {
      console.error("AuthPage: Login error:", e);
      setError(e.message || "Login failed");
    }
  };

  const handleSignup = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      console.log("AuthPage: Initiating signup:", { email, name });
      await signup(name, email, password);
      console.log("Signup successful, redirecting to /");
      navigate("/");
    } catch (e: any) {
      console.error("AuthPage: Signup error:", e);
      setError(e.message || "Signup failed");
    }
  };

  const handleTabChange = (value: string) => {
    console.log("Switching to tab:", value);
    setError(null);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="w-full max-w-md mx-auto">
        <Tabs
          defaultValue="login"
          className="w-full"
          onValueChange={handleTabChange}
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            <LoginForm
              onToggleMode={() => handleTabChange("signup")}
              onLogin={handleLogin}
            />
          </TabsContent>
          <TabsContent value="signup">
            {error && <Alert variant="destructive">{error}</Alert>}
            <SignupForm
              onToggleMode={() => handleTabChange("login")}
              onSignup={handleSignup}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
