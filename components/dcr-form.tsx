"use client";

import type { Doctor, DoctorExceptionReason, Product, VisitSummaryRow } from "@zivira/types";
import { AlertTriangle, Plus, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type Sample = { productName: string; productCode: string; qty: number; batchNumber: string; priority: "" | "HIGH" | "MEDIUM" | "LOW" };
type Input  = { inputName: string; itemType: string; qty: number; valueRs: string };

const SESSION_OPTIONS = ["MORNING", "AFTERNOON", "EVENING"] as const;
const JOINT_WORK_TYPES = ["FIELD_WORK", "ON_JOB_TRAINING", "PERFORMANCE_REVIEW"] as const;
const PRESCRIPTION_INTEREST_OPTIONS = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
const PROMO_MATERIAL_OPTIONS = ["Visual Aid", "Brochure", "Product Sample Card", "Clinical Study", "Leave-behind Literature"];

function badgeClass(badge: "GREEN" | "YELLOW" | "RED" | undefined) {
  if (badge === "RED") return "badge badge-danger";
  if (badge === "YELLOW") return "badge badge-warning";
  if (badge === "GREEN") return "badge badge-success";
  return "badge";
}

export function DcrForm() {
  const [doctors, setDoctors]               = useState<Doctor[]>([]);
  const [visitSummary, setVisitSummary]     = useState<VisitSummaryRow[]>([]);
  const [unvisited, setUnvisited]           = useState<Doctor[]>([]);
  const [products, setProducts]             = useState<Product[]>([]);
  const [giftItemTypes, setGiftItemTypes]   = useState<string[]>([]);
  const [doctorId, setDoctorId]             = useState("");
  const [productsDetailed, setProductsDetailed] = useState("Zivacard 10");
  const [notes, setNotes]                   = useState("");
  const [callSession, setCallSession]       = useState<"MORNING"|"AFTERNOON"|"EVENING">("MORNING");
  const [callTime, setCallTime]             = useState("");
  const [samplesGiven, setSamplesGiven]     = useState<Sample[]>([{ productName: "", productCode: "", qty: 1, batchNumber: "", priority: "" }]);
  const [inputsGiven, setInputsGiven]       = useState<Input[]>([{ inputName: "", itemType: "", qty: 1, valueRs: "" }]);
  const [hasJointWork, setHasJointWork]     = useState(false);
  const [jointManager, setJointManager]     = useState("");
  const [jointType, setJointType]           = useState<typeof JOINT_WORK_TYPES[number]>("FIELD_WORK");
  const [jointObs, setJointObs]             = useState("");

  // ── Zivira_Project_Basic.docx Topic 1 — Visit Information ──────────────
  const [checkInTime, setCheckInTime]       = useState("");
  const [checkOutTime, setCheckOutTime]     = useState("");
  const [hospitalClinic, setHospitalClinic] = useState("");
  const [gpsLabel, setGpsLabel]             = useState("");
  const [gpsCoords, setGpsCoords]           = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus]           = useState("");
  // Product Promotion
  const [promoMaterials, setPromoMaterials] = useState<string[]>([]);
  const [visualAidUsed, setVisualAidUsed]   = useState(false);
  // Doctor Feedback
  const [prescriptionInterest, setPrescriptionInterest] = useState<"" | typeof PRESCRIPTION_INTEREST_OPTIONS[number]>("");
  const [productFeedback, setProductFeedback] = useState("");
  const [competitorMentioned, setCompetitorMentioned] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate]     = useState("");

  const [message, setMessage]               = useState("");
  const [error, setError]                   = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [showOverVisitModal, setShowOverVisitModal] = useState(false);
  const [showUnvisitedList, setShowUnvisitedList]   = useState(false);

  // Zivira_Project_Basic.docx Topic 8 — Doctor Exception Management
  const [exceptionReasons, setExceptionReasons] = useState<DoctorExceptionReason[]>([]);
  const [exceptionFormDoctorId, setExceptionFormDoctorId] = useState<string | null>(null);
  const [exceptionReason, setExceptionReason] = useState<DoctorExceptionReason | "">("");
  const [exceptionNotes, setExceptionNotes] = useState("");
  const [loggingException, setLoggingException] = useState(false);

  useEffect(() => {
    apiClient.doctors().then(r => { setDoctors(r.data); setDoctorId(r.data[0]?.id ?? ""); }).catch(() => {});
    apiClient.visitSummary().then(r => setVisitSummary(r.data)).catch(() => {});
    apiClient.unvisitedDoctors().then(r => setUnvisited(r.data)).catch(() => {});
    apiClient.products().then(r => setProducts(r.data)).catch(() => {});
    apiClient.giftItems().then(r => setGiftItemTypes(r.data)).catch(() => {});
    apiClient.exceptionReasons().then(r => setExceptionReasons(r.data)).catch(() => {});
  }, []);

  // Zivira_Project_Basic.docx Topic 8 — Doctor Exception Management
  async function submitException(doctorId: string) {
    if (!exceptionReason) return;
    setLoggingException(true);
    try {
      await apiClient.logDoctorException({ doctorId, reason: exceptionReason, notes: exceptionNotes || undefined });
      setUnvisited(list => list.map(d => d.id === doctorId ? { ...d, exceptionReason, exceptionNotes: exceptionNotes || null } : d));
      setExceptionFormDoctorId(null); setExceptionReason(""); setExceptionNotes("");
    } catch {
      // Non-critical UI affordance — the doctor stays in the unvisited list, MR can retry.
    } finally {
      setLoggingException(false);
    }
  }

  const badgeByDoctorId = useMemo(() => {
    const map = new Map<string, VisitSummaryRow>();
    for (const row of visitSummary) map.set(row.doctorId, row);
    return map;
  }, [visitSummary]);

  const selectedDoctorBadge = doctorId ? badgeByDoctorId.get(doctorId) : undefined;

  // Sample helpers — product picker only, no free-text entry (PRD 12.3A)
  function addSample()  { setSamplesGiven(s => [...s, { productName: "", productCode: "", qty: 1, batchNumber: "", priority: "" }]); }
  function removeSample(i: number) { setSamplesGiven(s => s.filter((_, idx) => idx !== i)); }
  function updateSampleProduct(i: number, productCode: string) {
    const product = products.find(p => p.code === productCode);
    setSamplesGiven(s => s.map((item, idx) => idx === i ? { ...item, productCode, productName: product?.name ?? "" } : item));
  }
  function updateSampleField(i: number, field: "qty" | "batchNumber" | "priority", val: string | number) {
    setSamplesGiven(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  // Zivira_Project_Basic.docx Topic 1 — "GPS Location" capture via browser geolocation.
  function useCurrentLocation() {
    if (!navigator.geolocation) { setGpsStatus("Geolocation not available on this device."); return; }
    setGpsStatus("Fetching location…");
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setGpsStatus("Location captured."); },
      () => setGpsStatus("Unable to fetch location — enter manually or skip."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function toggleMaterial(name: string) {
    setPromoMaterials(m => m.includes(name) ? m.filter(x => x !== name) : [...m, name]);
  }

  const visitDurationMinutes = useMemo(() => {
    if (!checkInTime || !checkOutTime) return undefined;
    const [inH, inM] = checkInTime.split(":").map(Number);
    const [outH, outM] = checkOutTime.split(":").map(Number);
    if ([inH, inM, outH, outM].some(n => Number.isNaN(n))) return undefined;
    const minutes = (outH * 60 + outM) - (inH * 60 + inM);
    return minutes >= 0 ? minutes : undefined;
  }, [checkInTime, checkOutTime]);

  // Gift/input helpers — itemType picker (PRD 12.3B)
  function addInput()  { setInputsGiven(s => [...s, { inputName: "", itemType: "", qty: 1, valueRs: "" }]); }
  function removeInput(i: number) { setInputsGiven(s => s.filter((_, idx) => idx !== i)); }
  function updateInputType(i: number, itemType: string) {
    setInputsGiven(s => s.map((item, idx) => idx === i ? { ...item, itemType, inputName: itemType } : item));
  }
  function updateInputField(i: number, field: "qty" | "valueRs", val: string | number) {
    setInputsGiven(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  const totalSampleUnits = samplesGiven.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const totalGiftUnits = inputsGiven.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const distinctProducts = new Set(samplesGiven.filter(s => s.productCode).map(s => s.productCode)).size;

  function onDoctorChange(id: string) {
    setDoctorId(id);
    const badge = badgeByDoctorId.get(id);
    if (badge?.badge === "RED") {
      setShowOverVisitModal(true);
    }
  }

  async function doSubmit(overrideOverVisitWarning: boolean) {
    setSubmitting(true); setError(""); setMessage("");
    try {
      const result = await apiClient.submitDcr({
        doctorId: doctorId || undefined,
        productsDetailed: productsDetailed.split(",").map(s => s.trim()).filter(Boolean),
        notes,
        callSession,
        callTime: callTime || undefined,
        samplesGiven: samplesGiven.filter(s => s.productCode).map(s => ({
          productName: s.productName, productCode: s.productCode, qty: Number(s.qty) || 0, batchNumber: s.batchNumber || undefined,
          priority: s.priority || undefined
        })),
        inputsGiven: inputsGiven.filter(s => s.itemType).map(s => ({
          inputName: s.inputName, itemType: s.itemType, qty: Number(s.qty) || 0, valueRs: s.valueRs ? Number(s.valueRs) : undefined
        })),
        jointWork: hasJointWork ? { accompanyingManager: jointManager, jointWorkType: jointType, managerObservations: jointObs } : undefined,
        overrideOverVisitWarning,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        gpsLocation: (gpsCoords || gpsLabel) ? { ...(gpsCoords ?? {}), label: gpsLabel || undefined } : undefined,
        hospitalClinic: hospitalClinic || undefined,
        visitDurationMinutes,
        promotionalMaterialsShared: promoMaterials.length ? promoMaterials : undefined,
        visualAidUsed,
        prescriptionInterest: prescriptionInterest || undefined,
        productFeedback: productFeedback || undefined,
        competitorMentioned: competitorMentioned || undefined,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? followUpDate : undefined
      });
      setMessage(result.overVisitFlag ? "DCR submitted — override logged for your manager to review." : "DCR submitted successfully.");
      setNotes("");
      setSamplesGiven([{ productName: "", productCode: "", qty: 1, batchNumber: "", priority: "" }]);
      setInputsGiven([{ inputName: "", itemType: "", qty: 1, valueRs: "" }]);
      setHasJointWork(false); setJointManager(""); setJointObs("");
      setCheckInTime(""); setCheckOutTime(""); setHospitalClinic("");
      setGpsLabel(""); setGpsCoords(null); setGpsStatus("");
      setPromoMaterials([]); setVisualAidUsed(false);
      setPrescriptionInterest(""); setProductFeedback(""); setCompetitorMentioned("");
      setFollowUpRequired(false); setFollowUpDate("");
      apiClient.visitSummary().then(r => setVisitSummary(r.data)).catch(() => {});
      apiClient.unvisitedDoctors().then(r => setUnvisited(r.data)).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit DCR");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDcr(event: React.FormEvent) {
    event.preventDefault();
    if (selectedDoctorBadge?.badge === "RED") {
      setShowOverVisitModal(true);
      return;
    }
    await doSubmit(false);
  }

  return (
    <>
      {unvisited.length > 0 && (
        <div className="banner-warning" style={{ marginBottom: 16 }}>
          <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} /> {unvisited.length} doctor{unvisited.length > 1 ? "s" : ""} in your territory not visited yet this month
          </strong>
          <button type="button" className="button button-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setShowUnvisitedList(v => !v)}>
            {showUnvisitedList ? "Hide list" : "Visit them first?"}
          </button>
          {showUnvisitedList && (
            <ul className="list" style={{ marginTop: 4 }}>
              {unvisited.map(d => (
                <li key={d.id} className="list-item">
                  <strong>{d.name}</strong>
                  <span className="muted"> · {d.specialty}</span>
                  {d.exceptionReason ? (
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                      Reason logged: <strong>{d.exceptionReason}</strong>{d.exceptionNotes ? ` — ${d.exceptionNotes}` : ""}
                    </p>
                  ) : exceptionFormDoctorId === d.id ? (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      <select value={exceptionReason} onChange={e => setExceptionReason(e.target.value as DoctorExceptionReason)}>
                        <option value="">Select reason…</option>
                        {exceptionReasons.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input placeholder="Notes (optional)" value={exceptionNotes} onChange={e => setExceptionNotes(e.target.value)} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="button" disabled={!exceptionReason || loggingException} onClick={() => submitException(d.id)} style={{ padding: "4px 10px", fontSize: 12 }}>
                          {loggingException ? "Saving…" : "Save reason"}
                        </button>
                        <button type="button" className="button button-secondary" onClick={() => { setExceptionFormDoctorId(null); setExceptionReason(""); setExceptionNotes(""); }} style={{ padding: "4px 10px", fontSize: 12 }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="button button-secondary" onClick={() => setExceptionFormDoctorId(d.id)} style={{ padding: "3px 9px", fontSize: 11, marginTop: 4 }}>
                      Log reason for not visiting
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="card" onSubmit={submitDcr} style={{ display:"flex", flexDirection:"column", gap:18 }}>

        {/* Doctor */}
        <div className="field">
          <label>Doctor</label>
          <select value={doctorId} onChange={e => onDoctorChange(e.target.value)}>
            {doctors.map(d => {
              const badge = badgeByDoctorId.get(d.id);
              return (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.specialty} {badge ? `— ${badge.visitCount} visit${badge.visitCount === 1 ? "" : "s"} this month` : ""}
                </option>
              );
            })}
          </select>
          {selectedDoctorBadge && (
            <span className={badgeClass(selectedDoctorBadge.badge)} style={{ width: "fit-content" }}>
              {selectedDoctorBadge.visitCount} visit{selectedDoctorBadge.visitCount === 1 ? "" : "s"} this month
            </span>
          )}
        </div>

        {/* Zivira_Project_Basic.docx Topic 1 — Visit Information */}
        <div className="field">
          <label style={{ margin: 0 }}>Visit Information</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:8 }}>
            <div className="field" style={{ margin:0 }}>
              <label>Check-in Time</label>
              <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
            </div>
            <div className="field" style={{ margin:0 }}>
              <label>Check-out Time</label>
              <input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
            </div>
          </div>
          {visitDurationMinutes !== undefined && (
            <p className="muted" style={{ margin:"4px 0 0" }}>Visit duration: {visitDurationMinutes} min</p>
          )}
          <div className="field" style={{ margin:"10px 0 0" }}>
            <label>Hospital / Clinic</label>
            <input value={hospitalClinic} onChange={e => setHospitalClinic(e.target.value)} placeholder="Hospital or clinic name" />
          </div>
          <div className="field" style={{ margin:"10px 0 0" }}>
            <label>GPS Location</label>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ flex:1 }} value={gpsLabel} onChange={e => setGpsLabel(e.target.value)} placeholder="Location label (optional)" />
              <button type="button" className="button button-secondary" style={{ padding:"6px 12px", fontSize:12, whiteSpace:"nowrap" }} onClick={useCurrentLocation}>
                Use current location
              </button>
            </div>
            {(gpsStatus || gpsCoords) && (
              <p className="muted" style={{ margin:"4px 0 0" }}>
                {gpsCoords ? `${gpsCoords.latitude.toFixed(5)}, ${gpsCoords.longitude.toFixed(5)}` : gpsStatus}
              </p>
            )}
          </div>
        </div>

        {/* Call Session & Time */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div className="field">
            <label>Call Session</label>
            <select value={callSession} onChange={e => setCallSession(e.target.value as typeof callSession)}>
              {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Call Time</label>
            <input type="time" value={callTime} onChange={e => setCallTime(e.target.value)} />
          </div>
        </div>

        {/* Products Detailed */}
        <div className="field">
          <label>Products Detailed</label>
          <input value={productsDetailed} onChange={e => setProductsDetailed(e.target.value)} placeholder="Comma separated product names" />
        </div>

        {/* Samples Given — product picker only, no free text (PRD 12.3A) */}
        <div className="field">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <label style={{ margin:0 }}>Samples Distributed</label>
            <button className="button button-secondary" onClick={addSample} type="button" style={{ padding:"4px 10px", fontSize:12 }}>
              <Plus size={13} /> Add
            </button>
          </div>
          {samplesGiven.map((s, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1.2fr 60px 0.9fr 100px 32px", gap:8, marginBottom:6 }}>
              <select value={s.productCode} onChange={e => updateSampleProduct(i, e.target.value)}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
              </select>
              <input type="number" min={0} placeholder="Qty" value={s.qty} onChange={e => updateSampleField(i, "qty", Number(e.target.value))} />
              <input placeholder="Batch no. (optional)" value={s.batchNumber} onChange={e => updateSampleField(i, "batchNumber", e.target.value)} />
              <select value={s.priority} onChange={e => updateSampleField(i, "priority", e.target.value)}>
                <option value="">Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <button type="button" aria-label="Remove sample" onClick={() => removeSample(i)} style={{ background:"none", border:"1px solid var(--line)", borderRadius:6, cursor:"pointer", color:"var(--muted)" }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Inputs Given — gift item-type picker (PRD 12.3B) */}
        <div className="field">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <label style={{ margin:0 }}>Inputs / Gifts Given</label>
            <button className="button button-secondary" onClick={addInput} type="button" style={{ padding:"4px 10px", fontSize:12 }}>
              <Plus size={13} /> Add
            </button>
          </div>
          {inputsGiven.map((inp, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1.2fr 60px 90px 32px", gap:8, marginBottom:6 }}>
              <select value={inp.itemType} onChange={e => updateInputType(i, e.target.value)}>
                <option value="">Select item…</option>
                {giftItemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" min={0} placeholder="Qty" value={inp.qty} onChange={e => updateInputField(i, "qty", Number(e.target.value))} />
              <input type="number" min={0} placeholder="Value ₹" value={inp.valueRs} onChange={e => updateInputField(i, "valueRs", e.target.value)} />
              <button type="button" aria-label="Remove input" onClick={() => removeInput(i)} style={{ background:"none", border:"1px solid var(--line)", borderRadius:6, cursor:"pointer", color:"var(--muted)" }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>

        <p className="muted" style={{ margin: 0 }}>
          This visit: {totalSampleUnits} unit{totalSampleUnits === 1 ? "" : "s"} of {distinctProducts} product{distinctProducts === 1 ? "" : "s"}, {totalGiftUnits} gift item{totalGiftUnits === 1 ? "" : "s"}.
        </p>

        {/* Zivira_Project_Basic.docx Topic 1 — Product Promotion */}
        <div className="field">
          <label style={{ margin: 0 }}>Promotional Materials Shared</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6, marginTop:8 }}>
            {PROMO_MATERIAL_OPTIONS.map(m => (
              <label
                key={m}
                className={promoMaterials.includes(m) ? "badge badge-success" : "badge"}
                style={{ cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"5px 6px", height:"auto", minHeight:0, fontSize:10.5, lineHeight:1.15, whiteSpace:"normal", wordBreak:"break-word" }}
              >
                <input type="checkbox" checked={promoMaterials.includes(m)} onChange={() => toggleMaterial(m)} style={{ marginRight:4, flexShrink:0, width:12, height:12 }} />
                {m}
              </label>
            ))}
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <input type="checkbox" checked={visualAidUsed} onChange={e => setVisualAidUsed(e.target.checked)} />
            Visual aid used during this call
          </label>
        </div>

        {/* Notes */}
        <div className="field">
          <label>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visit outcome, next follow-up, objections" rows={3} />
        </div>

        {/* Zivira_Project_Basic.docx Topic 1 — Doctor Feedback */}
        <div className="field">
          <label style={{ margin: 0 }}>Doctor Feedback</label>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
            <div className="field" style={{ margin:0 }}>
              <label>Prescription Interest</label>
              <select value={prescriptionInterest} onChange={e => setPrescriptionInterest(e.target.value as typeof prescriptionInterest)}>
                <option value="">Not assessed</option>
                {PRESCRIPTION_INTEREST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin:0 }}>
              <label>Product Feedback</label>
              <textarea value={productFeedback} onChange={e => setProductFeedback(e.target.value)} placeholder="What the doctor said about the product" rows={2} />
            </div>
            <div className="field" style={{ margin:0 }}>
              <label>Competitor Mentioned</label>
              <input value={competitorMentioned} onChange={e => setCompetitorMentioned(e.target.value)} placeholder="Competitor product/brand (optional)" />
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input type="checkbox" checked={followUpRequired} onChange={e => setFollowUpRequired(e.target.checked)} />
              Follow-up required
            </label>
            {followUpRequired && (
              <div className="field" style={{ margin:0 }}>
                <label>Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Joint Work */}
        <div className="field">
          <label style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input type="checkbox" checked={hasJointWork} onChange={e => setHasJointWork(e.target.checked)} />
            Joint Work
          </label>
          {hasJointWork && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:10, padding:12, background:"var(--panel-strong)", borderRadius:8 }}>
              <div className="field">
                <label>Accompanying Manager</label>
                <input value={jointManager} onChange={e => setJointManager(e.target.value)} placeholder="Manager name or code" />
              </div>
              <div className="field">
                <label>Joint Work Type</label>
                <select value={jointType} onChange={e => setJointType(e.target.value as typeof jointType)}>
                  {JOINT_WORK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Manager Observations</label>
                <textarea value={jointObs} onChange={e => setJointObs(e.target.value)} placeholder="Manager's field observations" rows={2} />
              </div>
            </div>
          )}
        </div>

        {message ? <p className="badge">{message}</p> : null}
        {error   ? <p className="form-error">{error}</p> : null}

        <button className="button button-full" disabled={submitting} type="submit">
          {submitting ? "Submitting…" : "Submit DCR"}
          <Send size={17} />
        </button>
      </form>

      {showOverVisitModal && (
        <div className="modal-overlay" onClick={() => setShowOverVisitModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={18} color="var(--red)" /> This doctor has already been visited {selectedDoctorBadge?.visitCount ?? 3} times this month
            </strong>
            <p className="muted" style={{ margin: 0 }}>
              You can still log this visit — it will be flagged for your manager. Or switch to an unvisited doctor first.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="button button-warning"
                style={{ flex: 1 }}
                onClick={async () => { setShowOverVisitModal(false); await doSubmit(true); }}
              >
                Confirm
              </button>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowOverVisitModal(false); setShowUnvisitedList(true); }}
              >
                Show unvisited doctors
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
