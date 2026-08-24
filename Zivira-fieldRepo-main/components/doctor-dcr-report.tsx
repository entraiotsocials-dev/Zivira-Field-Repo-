"use client";

// Request C, item 2 — "a new report tab inside the doctor tab ... showcasing
// the details of the Mr dcr exactly." Groups this MR's own DCR history
// (GET /field/dcrs, same data already used by the DCR pages) by doctor, so
// each doctor on the Doctor tab shows every visit logged against them —
// date, status, products detailed and notes — without adding a new backend
// route. Read-only; does not touch DCR submission or approval.
import type { DcrExtended, Doctor } from "@zivira/types";
import { RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "./page-components";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function DoctorDcrReport() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dcrsByDoctor, setDcrsByDoctor] = useState<Record<string, DcrExtended[]>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [doctorsRes, dcrsRes] = await Promise.all([apiClient.doctors(), apiClient.dcrs()]);
      setDoctors(doctorsRes.data);

      const grouped: Record<string, DcrExtended[]> = {};
      for (const dcr of dcrsRes.data) {
        const doctorId = typeof dcr.doctorId === "string" ? dcr.doctorId : dcr.doctorId?.id;
        if (!doctorId) continue;
        if (!grouped[doctorId]) grouped[doctorId] = [];
        grouped[doctorId].push(dcr);
      }
      setDcrsByDoctor(grouped);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load DCR report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className="toolbar">
        <button className="button button-secondary" onClick={load} type="button">
          <RefreshCw size={17} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!loading && doctors.length === 0 ? <p className="muted">No doctors assigned yet.</p> : null}
      <div style={{ display: "grid", gap: 12 }}>
        {doctors.map((doctor) => {
          const visits = dcrsByDoctor[doctor.id] ?? [];
          return (
            <article className="card" key={doctor.id}>
              <p style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 4 }}>
                <Stethoscope size={16} /> {doctor.name}
                <span className="muted" style={{ fontWeight: 400 }}>· {doctor.specialty}</span>
              </p>
              {visits.length === 0 ? (
                <p className="muted">No DCR entries logged for this doctor yet.</p>
              ) : (
                <ul className="list">
                  {visits.map((visit) => (
                    <li className="list-item" key={visit.id}>
                      <strong>{formatDate(visit.visitDate)}</strong> <StatusBadge status={visit.status} />
                      {visit.productsDetailed?.length ? (
                        <p className="muted">Products: {visit.productsDetailed.join(", ")}</p>
                      ) : null}
                      {visit.notes ? <p className="muted">{visit.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
