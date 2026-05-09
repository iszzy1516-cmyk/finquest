// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { goalApi } from "@/services/api";
import { Target, Plus, Trash2, TrendingUp, CheckCircle2, Flag } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function GoalsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [contributeId, setContributeId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: goalApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["goals"] }); setShowAdd(false); },
  });
  const contributeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: string }) => goalApi.contribute(id, amount),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["goals"] }); setContributeId(null); setContributeAmount(""); },
  });
  const deleteMutation = useMutation({
    mutationFn: goalApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>Goals</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Set financial goals and track your progress</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2"><Plus className="w-4 h-4" /> New Goal</Button></DialogTrigger>
          <DialogContent className="border max-w-md" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>Create Goal</DialogTitle></DialogHeader>
            <GoalForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowAdd(false)} isLoading={createMutation.isPending} isLight={isLight} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-surface)" }} />)}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const progress = Math.min(100, (parseFloat(String(g.current_amount)) / parseFloat(String(g.target_amount))) * 100);
            const isCompleted = progress >= 100;

            return (
              <Card key={g.id} className="border p-5 hover:scale-[1.02] transition-all" style={{ backgroundColor: "var(--bg-surface)", borderColor: isCompleted ? "var(--accent-emerald)" : "var(--border-color)", opacity: isCompleted ? 1 : 1 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? "bg-emerald-500/20" : ""}`} style={!isCompleted ? { backgroundColor: "var(--bg-badge)" } : {}}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Flag className="w-5 h-5 text-violet-500" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{g.name}</h3>
                      {g.deadline && <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Due: {new Date(g.deadline).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <button onClick={() => { if (confirm("Delete this goal?")) deleteMutation.mutate(g.id); }} className="p-1 rounded-md transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
                    <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-violet-500 to-blue-500"}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono" style={{ color: "var(--text-primary)" }}>{formatCurrency(parseFloat(String(g.current_amount)))}</span>
                    <span style={{ color: "var(--text-secondary)" }}>of {formatCurrency(parseFloat(String(g.target_amount)))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isCompleted ? "text-emerald-500" : "text-violet-500"}`}>{progress.toFixed(0)}%</span>
                    {!isCompleted && (
                      <Dialog open={contributeId === g.id} onOpenChange={(open) => { if (!open) setContributeId(null); }}>
                        <DialogTrigger asChild>
                          <button onClick={() => setContributeId(g.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-violet-500/20 text-violet-500 text-xs font-medium hover:bg-violet-500/30 transition-colors">
                            <TrendingUp className="w-3 h-3" /> Add
                          </button>
                        </DialogTrigger>
                        <DialogContent className="border max-w-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
                          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>Contribute to Goal</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{g.name}</p>
                            <div><Label style={{ color: "var(--text-secondary)" }}>Amount</Label>
                              <Input type="number" step="0.01" placeholder="0.00" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} className="mt-1" style={{ backgroundColor: isLight ? "#ffffff" : "#0f172a", borderColor: isLight ? "#e2e8f0" : "#475569", color: isLight ? "#0f172a" : "#f8fafc" }} />
                            </div>
                            <div className="flex gap-3">
                              <Button onClick={() => { if (!contributeAmount) return; contributeMutation.mutate({ id: g.id, amount: contributeAmount }); }} disabled={!contributeAmount || contributeMutation.isPending} className="flex-1 bg-violet-500 hover:bg-violet-600 text-white">{contributeMutation.isPending ? "Adding..." : "Contribute"}</Button>
                              <Button variant="outline" onClick={() => setContributeId(null)} className="border-[#475569] text-[#94a3b8] hover:bg-[#334155]">Cancel</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border p-12 text-center" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <Target className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No goals yet</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Set your first financial goal and start saving!</p>
          <Button onClick={() => setShowAdd(true)} className="bg-blue-500 hover:bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Create Goal</Button>
        </Card>
      )}
    </div>
  );
}

function GoalForm({ onSubmit, onCancel, isLoading, isLight }: {
  onSubmit: (data: { name: string; target_amount: string | number; deadline?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
  isLight: boolean;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const inputStyle = { backgroundColor: isLight ? "#ffffff" : "#0f172a", borderColor: isLight ? "#e2e8f0" : "#475569", color: isLight ? "#0f172a" : "#f8fafc" };

  return (
    <div className="space-y-4">
      <div><Label style={{ color: "var(--text-secondary)" }}>Goal Name</Label><Input placeholder="e.g., Emergency Fund" value={name} onChange={e => setName(e.target.value)} className="mt-1" style={inputStyle} /></div>
      <div><Label style={{ color: "var(--text-secondary)" }}>Target Amount</Label><Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" style={inputStyle} /></div>
      <div><Label style={{ color: "var(--text-secondary)" }}>Deadline (optional)</Label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1" style={inputStyle} /></div>
      <div className="flex gap-3 pt-2">
        <Button onClick={() => { if (!name || !amount) return; onSubmit({ name, target_amount: amount, deadline: deadline || undefined }); }} disabled={!name || !amount || isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">{isLoading ? "Creating..." : "Create Goal"}</Button>
        <Button variant="outline" onClick={onCancel} className="border-[#475569] text-[#94a3b8] hover:bg-[#334155]">Cancel</Button>
      </div>
    </div>
  );
}
