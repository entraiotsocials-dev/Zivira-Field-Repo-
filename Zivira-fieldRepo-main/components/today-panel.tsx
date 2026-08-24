"use client";

import type { Attendance, FieldDashboard } from "@zivira/types";
import { CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { fetchCurrentLocation, readSavedLocation, type FieldLocation } from "@/lib/location";
import { MetricCard, StatusBadge } from "./page-components";

export function TodayPanel() {
  const [dashboard, setDashboard] = useState<FieldDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  // Zivira_prompt.pdf item 11 — check-in/check-out is a real action against
  // the server, not a toggle. A confirmation dialog with an explicit OK
  // button (instead of silently reloading the dashboard) makes sure the
  // rep sees the action actually went through before moving on.
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.dashboard();
      setDashboard(response.data);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load today's plan");
    } finally {
      setLoading(false);
    }
  }

  async function checkIn() {
    setError("");
    setLocating(true);

    try {
      const currentLocation = await fetchCurrentLocation();
      setLocation(currentLocation);
      const response = await apiClient.checkIn(currentLocation);
      setAttendance(response.data);
      setConfirmMessage("You have checked in successfully.");
      await loadDashboard();
    } catch (checkInError) {
      setError(checkInError instanceof Error ? checkInError.message : "Location permission is mandatory to check in");
    } finally {
      setLocating(false);
    }
  }

  async function checkOut() {
    setError("");
    setLocating(true);

    try {
      const response = await apiClient.checkOut();
      setAttendance(response.data);
      setConfirmMessage("You have checked out successfully.");
      await loadDashboard();
    } catch (checkOutError) {
      setError(checkOutError instanceof Error ? checkOutError.message : "Unable to check out");
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    setLocation(readSavedLocation());
    void loadDashboard();
  }, []);

  const hasCheckedIn = Boolean(attendance?.checkInAt) || Boolean(dashboard?.today.attendanceMarked);
  const hasCheckedOut = Boolean(attendance?.checkOutAt);
  const showCheckOut = hasCheckedIn && !hasCheckedOut;

  return (
    <>
      <div className="toolbar">
        <button className="button button-secondary" onClick={loadDashboard} type="button">
          <RefreshCw size={17} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
        {showCheckOut ? (
          <button className="button" disabled={locating} onClick={checkOut} type="button">
            <LogOut size={17} />
            {locating ? "Getting location" : "Check out"}
          </button>
        ) : (
          <button className="button" disabled={locating} onClick={checkIn} type="button">
            <CheckCircle2 size={17} />
            {locating ? "Getting location" : "Check in"}
          </button>
        )}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {confirmMessage ? (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 360 }}>
            <p className="metric-label">Attendance</p>
            <strong>{confirmMessage}</strong>
            <div className="toolbar" style={{ marginTop: 14 }}>
              <button
                autoFocus
                className="button"
                onClick={() => setConfirmMessage(null)}
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="card location-card">
        <p className="metric-label">Current GPS location</p>
        <strong>{location?.label ?? "Required before check-in"}</strong>
        <p className="muted">
          {location
            ? `Accuracy ${Math.round(location.accuracy)}m · ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
            : "Allow location access on mobile to mark attendance."}
        </p>
      </section>
      <section className="grid grid-2">
        <MetricCard label="Planned" value={String(dashboard?.today.plannedVisits ?? 0)} trend="Assigned doctors" />
        <MetricCard label="DCR Done" value={String(dashboard?.today.completedDcrs ?? 0)} trend="Submitted today" />
        <MetricCard label="Attendance" value={dashboard?.today.attendanceMarked ? "Yes" : "No"} trend="Today's check-in" />
        <MetricCard label="Territory" value={dashboard?.profile.territory ?? "--"} trend={dashboard?.profile.division ?? "Field division"} />
      </section>
      <section style={{ marginTop: 14 }}>
        <h2 className="section-title">Scheduled Visits</h2>
        <ul className="list">
          {(dashboard?.doctors ?? []).map((doctor) => (
            <li className="list-item" key={doctor.id}>
              <strong>{doctor.name}</strong>
              <p className="muted">{doctor.specialty} · {doctor.city}</p>
              <StatusBadge status={doctor.category} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
