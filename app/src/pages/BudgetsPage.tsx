// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { budgetApi, categoryApi } from "@/services/api";
import { Wallet, Plus, Trash2, Target, AlertTriangle, CheckCircle, Clock } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function BudgetsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetApi.list(),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: budgetApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); setShowAdd(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: budgetApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const surfaceBg = "var(--bg-surface)";
  const borderColor = "var(--border-color)";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>Budgets</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Set spending limits and track your progress</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2"><Plus className="w-4 h-4" /> Create Budget</Button>
          </DialogTrigger>
          <DialogContent className="border max-w-md" style={{ backgroundColor: surfaceBg, borderColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: "var(--text-primary)" }}>Create Budget</DialogTitle>
            </DialogHeader>
            <BudgetForm categories={categories || []} onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowAdd(false)} isLoading={createMutation.isPending} isLight={isLight} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-surface)" }} />)}
        </div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b.budget.id} budget={b} onDelete={() => { if (confirm("Delete this budget?")) deleteMutation.mutate(b.budget.id); }} isLight={isLight} />
          ))}
        </div>
      ) : (
        <Card className="border p-12 text-center" style={{ backgroundColor: surfaceBg, borderColor }}>
          <Target className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No budgets yet</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Create your first budget to start tracking spending limits</p>
          <Button onClick={() => setShowAdd(true)} className="bg-blue-500 hover:bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Create Budget</Button>
        </Card>
      )}
    </div>
  );
}

function BudgetCard({ budget, onDelete, isLight }: { budget: any; onDelete: () => void; isLight: boolean }) {
  const percentage = budget.percentage;
  const statusColor = percentage >= 100 ? "text-red-500" : percentage >= budget.budget.alert_threshold ? "text-amber-500" : "text-emerald-500";
  const StatusIcon = percentage >= 100 ? AlertTriangle : percentage >= budget.budget.alert_threshold ? Clock : CheckCircle;

  return (
    <Card className="border p-5 hover:scale-[1.02] transition-all" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--bg-badge)" }}>
            <Wallet className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{budget.budget.name}</h3>
            {budget.budget.category_name && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{budget.budget.category_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusColor}`} />
          <button onClick={onDelete} className="p-1 rounded-md transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
        <div className={`h-full rounded-full transition-all duration-700 ${percentage >= 100 ? "bg-red-500" : percentage >= budget.budget.alert_threshold ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs mt-2">
        <span className={statusColor}>{percentage.toFixed(0)}% used</span>
        <span style={{ color: "var(--text-secondary)" }}>{budget.days_remaining}d remaining</span>
      </div>

      <div className="mt-3 pt-3 flex items-center justify-between text-sm" style={{ borderTop: "1px solid var(--divider-color)" }}>
        <div><span className="text-xs" style={{ color: "var(--text-secondary)" }}>Spent: </span><span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(budget.spent)}</span></div>
        <div><span className="text-xs" style={{ color: "var(--text-secondary)" }}>Budget: </span><span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(parseFloat(String(budget.budget.amount)))}</span></div>
      </div>
    </Card>
  );
}

function BudgetForm({ categories, onSubmit, onCancel, isLoading, isLight }: {
  categories: Array<{ id: number; name: string; type: string }>;
  onSubmit: (data: { name: string; categoryId?: number; amount: string; periodStart: string; periodEnd: string; alertThreshold: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  isLight: boolean;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [threshold, setThreshold] = useState("80");
  const expenseCategories = categories.filter(c => c.type === "expense");
  const inputStyle = { backgroundColor: isLight ? "#ffffff" : "#0f172a", borderColor: isLight ? "#e2e8f0" : "#475569", color: isLight ? "#0f172a" : "#f8fafc" };

  return (
    <div className="space-y-4">
      <div><Label style={{ color: "var(--text-secondary)" }}>Budget Name</Label><Input placeholder="e.g., Food Budget" value={name} onChange={e => setName(e.target.value)} className="mt-1" style={inputStyle} /></div>
      <div>
        <Label style={{ color: "var(--text-secondary)" }}>Category (optional)</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="mt-1" style={inputStyle}><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent style={{ backgroundColor: isLight ? "#ffffff" : "#1e293b", borderColor: isLight ? "#e2e8f0" : "#475569" }}>
            <SelectItem value="none" className="cursor-pointer" style={{ color: inputStyle.color }}>All categories</SelectItem>
            {expenseCategories.map(c => <SelectItem key={c.id} value={String(c.id)} className="cursor-pointer" style={{ color: inputStyle.color }}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label style={{ color: "var(--text-secondary)" }}>Budget Amount</Label><Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label style={{ color: "var(--text-secondary)" }}>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" style={inputStyle} /></div>
        <div><Label style={{ color: "var(--text-secondary)" }}>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" style={inputStyle} /></div>
      </div>
      <div><Label style={{ color: "var(--text-secondary)" }}>Alert Threshold (%)</Label><Input type="number" min={1} max={100} value={threshold} onChange={e => setThreshold(e.target.value)} className="mt-1" style={inputStyle} /></div>
      <div className="flex gap-3 pt-2">
        <Button onClick={() => { if (!name || !amount || !endDate) return; onSubmit({ name, amount, categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId) : undefined, periodStart: startDate, periodEnd: endDate, alertThreshold: parseInt(threshold) || 80 }); }} disabled={!name || !amount || !endDate || isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">{isLoading ? "Creating..." : "Create Budget"}</Button>
        <Button variant="outline" onClick={onCancel} className="border-[#475569] text-[#94a3b8] hover:bg-[#334155]">Cancel</Button>
      </div>
    </div>
  );
}
