// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGamification } from "@/contexts/GamificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transactionApi, categoryApi } from "@/services/api";
import {
  Receipt, Plus, Search, Trash2, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, Calendar, X,
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const queryClient = useQueryClient();
  const { triggerXpGain, triggerAchievement } = useGamification();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, typeFilter, categoryFilter],
    queryFn: () => transactionApi.list({
      page,
      limit: 20,
      type: typeFilter as "income" | "expense" | undefined,
      category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: transactionApi.create,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "progress"] });
      setShowAddDialog(false);
      if (result.gamification_delta.xp_gained > 0) {
        triggerXpGain(result.gamification_delta.xp_gained, "transaction");
      }
      result.gamification_delta.achievements_unlocked.forEach(triggerAchievement);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactionApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const filteredItems = data?.items?.filter(tx =>
    !search || (tx.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (tx.category_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const inputBg = isLight ? "#ffffff" : "#0f172a";
  const inputBorder = isLight ? "#e2e8f0" : "#475569";
  const inputText = isLight ? "#0f172a" : "#f8fafc";
  const selectBg = isLight ? "#ffffff" : "#1e293b";
  const selectBorder = isLight ? "#e2e8f0" : "#475569";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>Transactions</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage your income and expenses</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
              <Plus className="w-4 h-4" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="border max-w-md" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "var(--text-primary)" }}>Add Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm
              categories={categories || []}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowAddDialog(false)}
              isLoading={createMutation.isPending}
              isLight={isLight}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputText }}
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || undefined)}>
            <SelectTrigger className="w-[140px]" style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputText }}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: selectBg, borderColor: selectBorder }}>
              <SelectItem value="all" className="cursor-pointer" style={{ color: inputText }}>All Types</SelectItem>
              <SelectItem value="income" className="cursor-pointer" style={{ color: inputText }}>Income</SelectItem>
              <SelectItem value="expense" className="cursor-pointer" style={{ color: inputText }}>Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || undefined)}>
            <SelectTrigger className="w-[160px]" style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputText }}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: selectBg, borderColor: selectBorder }}>
              <SelectItem value="all" className="cursor-pointer" style={{ color: inputText }}>All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="cursor-pointer" style={{ color: inputText }}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(typeFilter || categoryFilter || search) && (
            <Button variant="ghost" size="sm" style={{ color: "var(--text-secondary)" }} onClick={() => {
              setTypeFilter(undefined);
              setCategoryFilter(undefined);
              setSearch("");
            }}>
              <X className="w-4 h-4" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--divider-color)" }}>
                {["Date", "Description", "Category", "Type", "Amount", "Actions"].map((h, i) => (
                  <th key={h} className={`text-left text-xs font-medium px-4 py-3 ${i === 4 || i === 5 ? "text-right" : ""}`} style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--divider-color)" }}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "var(--bg-surface-elevated)" }} />
                    </td>
                  </tr>
                ))
              ) : filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((tx) => (
                  <tr
                    key={tx.id}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid var(--divider-color)" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{tx.description || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: "var(--bg-badge)", color: "var(--text-secondary)" }}
                      >
                        {tx.category_name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        tx.type === "income" ? "text-emerald-500" : "text-red-500"
                      }`}>
                        {tx.type === "income" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold">
                      <span className={tx.type === "income" ? "text-emerald-500" : "text-red-500"}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(parseFloat(String(tx.amount)))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { if (confirm("Delete this transaction?")) deleteMutation.mutate(tx.id); }}
                          className="p-1.5 rounded-md transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--text-secondary)" }} />
                    <p style={{ color: "var(--text-secondary)" }}>No transactions found</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Add your first transaction to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--divider-color)" }}>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Showing {(data.page - 1) * 20 + 1}-{Math.min(data.page * 20, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Page {data.page} of {data.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function TransactionForm({ categories, onSubmit, onCancel, isLoading, isLight }: {
  categories: Array<{ id: number; name: string; type: string }>;
  onSubmit: (data: { type: "income" | "expense"; amount: string; categoryId: number; description: string; transactionDate: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
  isLight: boolean;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredCategories = categories.filter(c => c.type === type);

  const inputStyle = { backgroundColor: isLight ? "#ffffff" : "#0f172a", borderColor: isLight ? "#e2e8f0" : "#475569", color: isLight ? "#0f172a" : "#f8fafc" };
  const selectContentStyle = { backgroundColor: isLight ? "#ffffff" : "#1e293b", borderColor: isLight ? "#e2e8f0" : "#475569" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("income")}
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
            type === "income" ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/50" : "text-[#94a3b8] border-transparent"
          }`}
          style={type !== "income" ? { backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderColor: isLight ? "#e2e8f0" : "#475569" } : {}}
        >Income</button>
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
            type === "expense" ? "bg-red-500/20 text-red-500 border-red-500/50" : "text-[#94a3b8] border-transparent"
          }`}
          style={type !== "expense" ? { backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderColor: isLight ? "#e2e8f0" : "#475569" } : {}}
        >Expense</button>
      </div>

      <div>
        <Label style={{ color: "var(--text-secondary)" }}>Amount</Label>
        <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" style={inputStyle} />
      </div>

      <div>
        <Label style={{ color: "var(--text-secondary)" }}>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="mt-1" style={inputStyle}><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent style={selectContentStyle}>
            {filteredCategories.map(c => (
              <SelectItem key={c.id} value={String(c.id)} className="cursor-pointer" style={{ color: inputStyle.color }}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label style={{ color: "var(--text-secondary)" }}>Description</Label>
        <Input placeholder="Optional description..." value={description} onChange={e => setDescription(e.target.value)} className="mt-1" style={inputStyle} />
      </div>

      <div>
        <Label style={{ color: "var(--text-secondary)" }}>Date</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" style={inputStyle} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={() => { if (!amount || !categoryId) return; onSubmit({ type, amount, categoryId: parseInt(categoryId), description, transactionDate: date }); }} disabled={!amount || !categoryId || isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
          {isLoading ? "Saving..." : "Add Transaction"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="border-[#475569] text-[#94a3b8] hover:bg-[#334155]">Cancel</Button>
      </div>
    </div>
  );
}
