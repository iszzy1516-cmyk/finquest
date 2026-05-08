// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userApi, notificationApi, exportImportApi } from "@/services/api";
import {
  User, Mail, Bell, Download, Upload, Shield,
  Save, Loader2, CheckCircle, FileText, FileJson,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: () => userApi.stats(),
  });

  const { data: prefs } = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => notificationApi.preferences(),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
  });

  const [exportLoading, setExportLoading] = useState(false);

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      const blob = await exportImportApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleExportJson() {
    setExportLoading(true);
    try {
      const blob = await exportImportApi.exportJson();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "finquest_export.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>Profile & Settings</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage your account, preferences, and data</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="data" className="gap-2"><Shield className="w-4 h-4" /> Data</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border p-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{user?.username}</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.email}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Level {user?.current_level} • {user?.total_xp_earned} XP</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBox label="Total Income" value={stats?.total_income || 0} />
              <StatBox label="Total Expenses" value={stats?.total_expense || 0} />
              <StatBox label="Net Savings" value={stats?.net_savings || 0} />
            </div>
          </Card>

          <Card className="border p-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Account Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: "var(--text-secondary)" }}>Username</Label>
                  <Input value={user?.username || ""} disabled className="mt-1" style={{ backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderColor: "var(--border-color)", color: "var(--text-secondary)" }} />
                </div>
                <div>
                  <Label style={{ color: "var(--text-secondary)" }}>Email</Label>
                  <Input value={user?.email || ""} disabled className="mt-1" style={{ backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderColor: "var(--border-color)", color: "var(--text-secondary)" }} />
                </div>
              </div>
              <div>
                <Label style={{ color: "var(--text-secondary)" }}>Full Name</Label>
                <Input value={user?.full_name || ""} disabled className="mt-1" style={{ backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderColor: "var(--border-color)", color: "var(--text-secondary)" }} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border p-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Notification Preferences</h3>
            {prefs && (
              <div className="space-y-4">
                {[
                  { key: "budget_alerts", label: "Budget Alerts", desc: "Get notified when approaching or exceeding budget limits" },
                  { key: "streak_reminders", label: "Streak Reminders", desc: "Daily reminders to maintain your login streak" },
                  { key: "achievement_notifications", label: "Achievement Unlocks", desc: "Notifications when you unlock new achievements" },
                  { key: "weekly_summary", label: "Weekly Summary", desc: "Weekly digest of your financial activity" },
                  { key: "security_alerts", label: "Security Alerts", desc: "Important security notifications" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--divider-color)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                    </div>
                    <Switch
                      checked={prefs[item.key as keyof typeof prefs] as boolean}
                      onCheckedChange={(checked) => updatePrefsMutation.mutate({ [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card className="border p-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Export Data</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Download your data in various formats</p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleExportCsv} disabled={exportLoading} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                <FileText className="w-4 h-4" /> Export CSV
              </Button>
              <Button onClick={handleExportJson} disabled={exportLoading} className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                <FileJson className="w-4 h-4" /> Export JSON
              </Button>
            </div>
          </Card>

          <Card className="border p-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Import Data</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Import transactions from CSV or JSON</p>
            <ImportSection />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-4 border" style={{ backgroundColor: "var(--bg-card-inner)", borderColor: "var(--border-color)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="text-lg font-bold font-mono" style={{ color: "var(--text-primary)" }}>
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)}
      </p>
    </div>
  );
}

function ImportSection() {
  const [csvText, setCsvText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleImportCsv() {
    setLoading(true);
    try {
      const res = await exportImportApi.importCsv(csvText);
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleImportJson() {
    setLoading(true);
    try {
      const data = JSON.parse(jsonText);
      const res = await exportImportApi.importJson(data);
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label style={{ color: "var(--text-secondary)" }}>CSV Import</Label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste CSV content here..."
          className="mt-1 w-full h-32 rounded-lg p-3 text-sm font-mono"
          style={{ backgroundColor: "var(--bg-card-inner)", borderColor: "var(--border-color)", color: "var(--text-primary)", border: "1px solid" }}
        />
        <Button onClick={handleImportCsv} disabled={!csvText || loading} className="mt-2 gap-2">
          <Upload className="w-4 h-4" /> Import CSV
        </Button>
      </div>

      <div>
        <Label style={{ color: "var(--text-secondary)" }}>JSON Import</Label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="Paste JSON content here..."
          className="mt-1 w-full h-32 rounded-lg p-3 text-sm font-mono"
          style={{ backgroundColor: "var(--bg-card-inner)", borderColor: "var(--border-color)", color: "var(--text-primary)", border: "1px solid" }}
        />
        <Button onClick={handleImportJson} disabled={!jsonText || loading} className="mt-2 gap-2">
          <Upload className="w-4 h-4" /> Import JSON
        </Button>
      </div>

      {result && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: result.error ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: result.error ? "#ef4444" : "#10b981" }}>
          {result.error ? result.error : JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
