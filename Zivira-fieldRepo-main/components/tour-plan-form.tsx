"use client";

import type { CompanyBranch, TourPlan, TourPlanLocation } from "@zivira/types";
import { MapPinned, Plus, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/api-client";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function statusBadgeClass(status: TourPlan["status"]) {
  if (status === "VOIDED") return "badge badge-danger";
  if (status === "REJECTED") return "badge badge-danger";
  if (status === "APPROVED") return "badge badge-success";
  return "badge badge-warning";
}

export function TourPlanForm() {
  const [tourPlans, setTourPlans] = useState<TourPlan[]>([]);
  const [branches, setBranches]   = useState<CompanyBranch[]>([]);
  const [month, setMonth]         = useState(currentMonth());
  const [locations, setLocations] = useState<TourPlanLocation[]>([{ date: "", area: "", town: "", purpose: "Regular Coverage" }]);
  const [gstBranchCode, setGstBranchCode] = useState("");
  const [message, setMessage]     = useState("");
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Set when the submit-time guard blocks us because this month already has
  // an active Tour Plan — lets the form offer "add to it instead" rather
  // than being a dead end.
  const [conflictTpId, setConflictTpId] = useState<string | null>(null);
  const [addingToExisting, setAddingToExisting] = useState(false);

  function refresh() {
    apiClient.tourPlans().then(r => setTourPlans(r.data)).catch(() => {});
  }

  useEffect(() => {
    refresh();
    apiClient.branches().then(r => setBranches(r.data)).catch(() => {});
  }, []);

  function addLocation() { setLocations(l => [...l, { date: "", area: "", town: "", purpose: "Regular Coverage" }]); }
  function removeLocation(i: number) { setLocations(l => l.filter((_, idx) => idx !== i)); }
  function updateLocation(i: number, field: keyof TourPlanLocation, val: string) {
    setLocations(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError(""); setMessage(""); setConflictTpId(null);
    try {
      const valid = locations.filter(l => l.date && l.area && l.town);
      if (!valid.length) throw new Error("Add at least one location with date, area and town.");
      const created = await apiClient.submitTourPlan({ month, locations: valid, gstBranchCode: gstBranchCode || undefined });
      setMessage(`Tour Plan ${created.data.tpId} submitted for approval.`);
      setLocations([{ date: "", area: "", town: "", purpose: "Regular Coverage" }]);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit Tour Plan");
      if (e instanceof ApiError && typeof e.details?.existingTpId === "string") {
        setConflictTpId(e.details.existingTpId);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function addToExisting() {
    if (!conflictTpId) return;
    setAddingToExisting(true); setError(""); setMessage("");
    try {
      const valid = locations.filter(l => l.date && l.area && l.town);
      if (!valid.length) throw new Error("Add at least one location with date, area and town.");
      const updated = await apiClient.addTourPlanLocations(conflictTpId, valid);
      setMessage(`Added ${valid.length} location(s) to ${updated.data.tpId}.`);
      setLocations([{ date: "", area: "", town: "", purpose: "Regular Coverage" }]);
      setConflictTpId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add locations to the existing Tour Plan");
    } finally {
      setAddingToExisting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <form className="card" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>Month</label>
          <input type="month" value={month} onChange={e => { setMonth(e.target.value); setConflictTpId(null); }} required />
        </div>

        <div className="field">
          <label>GST Branch (optional — for expense/claims linkage)</label>
          <select value={gstBranchCode} onChange={e => setGstBranchCode(e.target.value)}>
            <option value="">No specific branch</option>
            {branches.map(b => <option key={b.id} value={b.gstNumber}>{b.branchName} — {b.gstNumber}</option>)}
          </select>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Planned Locations</strong>
            <button type="button" className="button button-secondary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={addLocation}>
              <Plus size={13} /> Add location
            </button>
          </div>
          {locations.map((loc, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12, marginBottom: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="muted" style={{ fontSize: 12, fontWeight: 900 }}>Location {i + 1}</span>
                {locations.length > 1 && (
                  <button type="button" aria-label="Remove location" onClick={() => removeLocation(i)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", color: "var(--muted)", padding: "3px 7px", display: "flex", alignItems: "center" }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Date</label>
                <input type="date" value={loc.date} onChange={e => updateLocation(i, "date", e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Area</label>
                <input placeholder="Area" value={loc.area} onChange={e => updateLocation(i, "area", e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Town</label>
                <input placeholder="Town" value={loc.town} onChange={e => updateLocation(i, "town", e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Purpose</label>
                <select value={loc.purpose} onChange={e => updateLocation(i, "purpose", e.target.value)}>
                  {["Regular Coverage", "New Launch", "Camp Visit", "Joint Work", "Conference"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>

        {message ? <p className="badge badge-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {conflictTpId ? (
          <button className="button button-full" disabled={addingToExisting} type="button" onClick={addToExisting}>
            {addingToExisting ? "Adding…" : `Add these locations to ${conflictTpId} instead`}
            <Plus size={17} />
          </button>
        ) : (
          <button className="button button-full" disabled={submitting} type="submit">
            {submitting ? "Submitting…" : "Submit Tour Plan"}
            <Send size={17} />
          </button>
        )}
      </form>

      <div>
        <p className="section-title">Your Tour Plans</p>
        <div className="grid">
          {tourPlans.length === 0 && <p className="muted">No Tour Plans submitted yet.</p>}
          {tourPlans.map(tp => (
            <article className="list-item" key={tp.id}>
              <strong>
                <MapPinned size={16} /> {tp.tpId} — {tp.month}
              </strong>
              <p className="muted" style={{ margin: "4px 0" }}>{tp.locations.length} location(s) · Manager: {tp.assignedManagerName ?? tp.assignedManager}{tp.assignedManagerName ? ` (${tp.assignedManager})` : ""}</p>
              <span className={statusBadgeClass(tp.status)}>{tp.status}</span>
              {tp.status === "VOIDED" && (
                <p className="muted" style={{ marginTop: 6 }}>
                  Voided by {tp.voidedByName ?? tp.voidedBy} — {tp.voidReason}
                  {tp.reassignedToTpId ? ` · Reassigned to ${tp.reassignedToTpId}` : ""}
                </p>
              )}
              {tp.parentTpId && <p className="muted" style={{ marginTop: 6 }}>Reassigned from: {tp.parentTpId}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
