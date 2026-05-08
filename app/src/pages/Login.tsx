import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { authApi } from "@/services/api";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLight = resolvedTheme === "light";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem("access_token", res.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <Card
        className="w-full max-w-sm border"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}
      >
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome to FinQuest
          </CardTitle>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Your gamified financial journey starts here
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label style={{ color: "var(--text-secondary)" }}>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="mt-1"
                style={{
                  backgroundColor: isLight ? "#ffffff" : "#0f172a",
                  borderColor: isLight ? "#e2e8f0" : "#475569",
                  color: isLight ? "#0f172a" : "#f8fafc",
                }}
              />
            </div>
            <div>
              <Label style={{ color: "var(--text-secondary)" }}>Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    backgroundColor: isLight ? "#ffffff" : "#0f172a",
                    borderColor: isLight ? "#e2e8f0" : "#475569",
                    color: isLight ? "#0f172a" : "#f8fafc",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm mt-4" style={{ color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
