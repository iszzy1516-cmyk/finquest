import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "react-router";

export default function NotFound() {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <Card
        className="w-full max-w-sm text-center border"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}
      >
        <CardHeader>
          <CardTitle
            className="text-4xl font-bold"
            style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            404
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p style={{ color: "var(--text-secondary)" }}>Page not found</p>
          <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            <Link to="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
