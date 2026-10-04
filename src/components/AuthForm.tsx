import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AuthFormProps {
  onSuccess: () => void;
  defaultToSignUp?: boolean;
}

type AuthMode = "login" | "signup" | "forgot";

export const AuthForm = ({ onSuccess, defaultToSignUp = false }: AuthFormProps) => {
  const [mode, setMode] = useState<AuthMode>(defaultToSignUp ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! You can now play.");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <div className="space-y-4">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => setMode("login")}
            className="text-primary hover:underline font-medium"
          >
            Back to log in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : mode === "login" ? "Log in" : "Create account"}
        </Button>
        {mode === "login" && (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            disabled={loading}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot your password?
          </button>
        )}
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms and Conditions
            </Link>
            .
          </p>
        )}
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-primary hover:underline font-medium"
        >
          {mode === "login" ? "Create one" : "Log in"}
        </button>
      </p>
    </div>
  );
};
