"use client";

import type { FieldDashboard } from "@zivira/types";
import { Bell, RefreshCw, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-components";
import { PayrollStatusCard } from "@/components/payroll-status-card";
import { apiClient } from "@/lib/api-client";

export default function ProfilePage() {
  const [dashboard, setDashboard] = useState<FieldDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.dashboard();
      setDashboard(response.data);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  const profile = dashboard?.profile;

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title="MR profile"
        description="Identity, employee code, division, territory, device, and app settings."
      />
      {error ? <p className="form-error">{error}</p> : null}
      <article className="card">
        <UserCircle size={34} color="var(--brand)" />
        <h2 className="section-title" style={{ marginTop: 12 }}>
          {profile?.name ?? (loading ? "Loading profile" : "Field profile")}
        </h2>
        <p className="muted">Employee code: {profile?.employeeCode ?? "--"}</p>
        <p className="muted">Division: {profile?.division ?? "--"}</p>
        <p className="muted">Territory: {profile?.territory ?? "--"}</p>
        <span className="badge">{profile?.role ?? "FIELD_FORCE"}</span>
      </article>
      <button className="button button-secondary button-full" onClick={loadProfile} style={{ marginTop: 12 }} type="button">
        <RefreshCw size={17} />
        {loading ? "Loading" : "Refresh profile"}
      </button>
      <Link className="button button-full" href="/field/notifications" style={{ marginTop: 12 }}>
        <Bell size={17} />
        Notifications
      </Link>
      <div style={{ marginTop: 16 }}>
        <PayrollStatusCard />
      </div>
    </>
  );
}
