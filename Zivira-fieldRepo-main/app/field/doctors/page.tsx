"use client";

import { useState } from "react";
import { DoctorList } from "@/components/doctor-list";
import { DoctorDcrReport } from "@/components/doctor-dcr-report";
import { PageHeader } from "@/components/page-components";

// Request C, item 2 — a "DCR report" tab lives alongside the existing
// doctor list here (in-page toggle, no new route) so it's a report inside
// the Doctor tab, exactly as asked, without touching the existing list.
export default function DoctorsPage() {
  const [tab, setTab] = useState<"list" | "dcr-report">("list");

  return (
    <>
      <PageHeader
        eyebrow="My Doctors"
        title="Assigned doctors"
        description="Doctor list assigned to your territory and mapped employee code."
      />
      <div className="toolbar" style={{ marginBottom: 4 }}>
        <button
          className={tab === "list" ? "button" : "button button-secondary"}
          onClick={() => setTab("list")}
          type="button"
        >
          Doctor List
        </button>
        <button
          className={tab === "dcr-report" ? "button" : "button button-secondary"}
          onClick={() => setTab("dcr-report")}
          type="button"
        >
          DCR Report
        </button>
      </div>
      {tab === "list" ? <DoctorList /> : <DoctorDcrReport />}
    </>
  );
}
