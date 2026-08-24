"use client";

import type { PayrollStatusRecord } from "@zivira/types";
import { AlertTriangle, CheckCircle2, Clock, IndianRupee, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const STATUS_META: Record<string, { label: string; className: string }> = {
  RELEASED:              { label: "Released", className: "badge badge-success" },
  HOLD:                  { label: "On Hold", className: "badge badge-danger" },
  EXPLANATION_SUBMITTED: { label: "Awaiting Manager Approval", className: "badge badge-warning" }
};

// Zivira_Project_Basic.docx Topic 3 — Salary Integration Engine.
// Workflow: Employee → No DCR → HR Notification → Employee Explanation →
// Manager Approval → Payroll Released.
export function PayrollStatusCard() {
  const [record, setRecord] = useState<PayrollStatusRecord | null>(null);
  const [month, setMonth] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await apiClient.payrollStatus();
      setRecord(r.data);
      setMonth(r.month);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load payroll status"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submitExplanation(event: React.FormEvent) {
    event.preventDefault();
    if (!record) return;
    setSubmitting(true); setError(""); setMessage("");
    try {
      const updated = await apiClient.submitPayrollExplanation(record.id, explanation);
      setRecord(updated.data);
      setExplanation("");
      setMessage("Explanation submitted — your manager will review it.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit explanation"); }
    finally { setSubmitting(false); }
  }

  const meta = record ? STATUS_META[record.status] ?? STATUS_META.RELEASED : null;

  return (
    <article className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <IndianRupee size={18} color="var(--brand)" /> Payroll Status — {month || "this month"}
        </h2>
        <button className="button button-secondary" onClick={load} type="button" style={{ padding: "4px 10px", fontSize: 12 }}>
          <RefreshCw size={13} />{loading ? "Loading" : "Refresh"}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="badge badge-success" style={{ marginTop: 8 }}>{message}</p> : null}

      {loading ? (
        <p className="muted" style={{ marginTop: 10 }}>Loading…</p>
      ) : !record ? (
        <p className="muted" style={{ marginTop: 10 }}>No payroll record yet for this month.</p>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <span className={meta?.className} style={{ width: "fit-content" }}>
            {record.status === "RELEASED" && <CheckCircle2 size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />}
            {record.status === "HOLD" && <AlertTriangle size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />}
            {record.status === "EXPLANATION_SUBMITTED" && <Clock size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />}
            {meta?.label}
          </span>

          {record.status !== "RELEASED" && record.holdReason && (
            <p className="muted" style={{ margin: 0 }}>{record.holdReason}</p>
          )}

          {record.status === "HOLD" && (
            <form onSubmit={submitExplanation} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Your Explanation</label>
                <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={3} placeholder="Explain why DCRs were missed — leave, network issue, territory transition, etc." />
              </div>
              <button className="button" disabled={submitting || explanation.trim().length < 5} type="submit">
                {submitting ? "Submitting…" : "Submit Explanation"}
              </button>
            </form>
          )}

          {record.status === "EXPLANATION_SUBMITTED" && record.employeeExplanation && (
            <p className="muted" style={{ margin: 0 }}>Your explanation: “{record.employeeExplanation}”</p>
          )}

          {record.status === "RELEASED" && record.managerApprovedByName && (
            <p className="muted" style={{ margin: 0 }}>Approved by {record.managerApprovedByName}</p>
          )}
        </div>
      )}
    </article>
  );
}
