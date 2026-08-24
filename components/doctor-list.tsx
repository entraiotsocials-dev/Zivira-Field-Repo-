"use client";

import type { Doctor } from "@zivira/types";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "./page-components";

export function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState("");

  async function loadDoctors() {
    setError("");

    try {
      const response = await apiClient.doctors();
      setDoctors(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load doctors");
    }
  }

  useEffect(() => {
    void loadDoctors();
  }, []);

  return (
    <>
      <div className="toolbar">
        <button className="button button-secondary" onClick={loadDoctors} type="button">
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <ul className="list">
        {doctors.map((doctor) => (
          <li className="list-item" key={doctor.id}>
            <strong>{doctor.name}</strong>
            <p className="muted">{doctor.specialty} · {doctor.territory}</p>
            <p className="muted">{doctor.city}, {doctor.state}</p>
            <StatusBadge status={doctor.category} />
          </li>
        ))}
      </ul>
    </>
  );
}
