"use client";

import type { ExpenseClaim, ExpenseClaimCategory, TourPlan } from "@zivira/types";
import { IndianRupee, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const CATEGORIES: ExpenseClaimCategory[] = ["Travel", "Lodging", "Food", "Local Conveyance", "Other"];

function statusBadgeClass(status: ExpenseClaim["status"]) {
  if (status === "REJECTED") return "badge badge-danger";
  if (status === "APPROVED") return "badge badge-success";
  return "badge badge-warning";
}

// PRD 12.5 follow-up — "they select the GST Branch ... so how it should be
// redirect to the admin, manager, to claim their expenses. create a linkage
// for this." A claim is always filed against one of the MR's own Tour Plans
// and inherits that Tour Plan's GST branch, so this panel only offers TPs
// that are still live (not voided/rejected) as options.
export function ExpenseClaims() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [eligibleTps, setEligibleTps] = useState<TourPlan[]>([]);
  const [tpId, setTpId] = useState("");
  const [category, setCategory] = useState<ExpenseClaimCategory>("Travel");
  const [expenseDate, setExpenseDate] = useState("");
  const [amountRs, setAmountRs] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    apiClient.expenseClaims().then((r) => setClaims(r.data)).catch(() => {});
    apiClient.tourPlans().then((r) => {
      const eligible = r.data.filter((tp) => tp.status !== "VOIDED" && tp.status !== "REJECTED");
      setEligibleTps(eligible);
      setTpId((current) => current || eligible[0]?.tpId || "");
    }).catch(() => {});
  }

  useEffect(() => { refresh(); }, []);

  const selectedTp = eligibleTps.find((tp) => tp.tpId === tpId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError(""); setMessage("");
    try {
      if (!tpId) throw new Error("Select a Tour Plan to claim against.");
      const amount = Number(amountRs);
      if (!expenseDate) throw new Error("Expense date is required.");
      if (!amount || amount <= 0) throw new Error("Enter a valid amount.");
      const created = await apiClient.submitExpenseClaim({ tpId, category, expenseDate, amountRs: amount, description: description || undefined });
      setMessage(`Claim ${created.data.claimId} submitted for approval.`);
      setExpenseDate(""); setAmountRs(""); setDescription("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit expense claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
      <div>
        <p className="section-title">Claim Expenses</p>
        <p className="muted" style={{ marginTop: -6, marginBottom: 12, fontSize: 13 }}>
          File a claim against a Tour Plan — it routes to your manager using the plan&apos;s GST branch.
        </p>
      </div>

      <form className="card" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>Tour Plan</label>
          <select value={tpId} onChange={(e) => setTpId(e.target.value)} required>
            <option value="" disabled>Select a Tour Plan</option>
            {eligibleTps.map((tp) => (
              <option key={tp.tpId} value={tp.tpId}>{tp.tpId} — {tp.month}</option>
            ))}
          </select>
        </div>

        {selectedTp && (
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            GST Branch: {selectedTp.gstBranchName ? `${selectedTp.gstBranchName} — ${selectedTp.gstBranchCode}` : "No specific branch"} · Routes to {selectedTp.assignedManagerName ?? selectedTp.assignedManager}
          </p>
        )}

        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseClaimCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Expense Date</label>
          <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
        </div>

        <div className="field">
          <label>Amount (₹)</label>
          <input type="number" min="1" step="0.01" placeholder="0.00" value={amountRs} onChange={(e) => setAmountRs(e.target.value)} required />
        </div>

        <div className="field">
          <label>Description (optional)</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this expense for?" />
        </div>

        {message ? <p className="badge badge-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <button className="button button-full" disabled={submitting || !eligibleTps.length} type="submit">
          {submitting ? "Submitting…" : "Submit Claim"}
          <IndianRupee size={17} />
        </button>
        {!eligibleTps.length && <p className="muted" style={{ fontSize: 12 }}>Submit a Tour Plan first — claims are filed against a Tour Plan.</p>}
      </form>

      <div>
        <p className="section-title">Your Claims</p>
        <div className="grid">
          {claims.length === 0 && <p className="muted">No expense claims submitted yet.</p>}
          {claims.map((c) => (
            <article className="list-item" key={c.id}>
              <strong>
                <Receipt size={16} /> {c.claimId} — ₹{c.amountRs.toLocaleString("en-IN")}
              </strong>
              <p className="muted" style={{ margin: "4px 0" }}>
                {c.category} · {c.expenseDate} · Tour Plan {c.tpId}
                {c.gstBranchName ? ` · ${c.gstBranchName}` : ""}
              </p>
              <span className={statusBadgeClass(c.status)}>{c.status}</span>
              {c.status === "REJECTED" && c.rejectReason && (
                <p className="muted" style={{ marginTop: 6 }}>Reason: {c.rejectReason}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
