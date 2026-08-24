"use client";

import clsx from "clsx";
import { LogOut, MapPin, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fieldNav } from "@/lib/nav";
import { clearToken } from "@/lib/api-client";
import { fetchCurrentLocation, readSavedLocation, type FieldLocation } from "@/lib/location";

export function FieldShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(true);
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [locating, setLocating] = useState(false);

  function signOut() {
    clearToken();
    router.push("/field/login");
  }

  async function refreshLocation() {
    setLocating(true);
    try {
      setLocation(await fetchCurrentLocation());
    } catch {
      setLocation(null);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    setLocation(readSavedLocation());
    void refreshLocation();
  }, []);

  if (pathname === "/field/login") {
    return <>{children}</>;
  }

  return (
    <div className="field-shell">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="button button-secondary sidebar-toggle-btn"
            onClick={() => setNavOpen((o) => !o)}
            title={navOpen ? "Hide navigation" : "Show navigation"}
            type="button"
            aria-label={navOpen ? "Hide navigation" : "Show navigation"}
          >
            {navOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <Link className="brand" href="/field/today">
            <span className="brand-mark">Z</span>
            <span>
              <p className="brand-title">Zivira Field</p>
              <p className="brand-subtitle">MR workspace</p>
            </span>
          </Link>
        </div>
        <div className="topbar-actions">
          <button className="badge location-badge" onClick={refreshLocation} title="Refresh current location" type="button">
            <MapPin size={15} />
            {locating ? "Locating" : location?.label ?? "Location required"}
          </button>
          <button className="button button-secondary" onClick={signOut} title="Sign out" type="button">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
      {navOpen && (
        <nav className="bottom-nav" aria-label="Field navigation">
          {fieldNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link className={clsx("nav-link", active && "nav-link-active")} href={item.href} key={item.href}>
                <Icon size={19} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
