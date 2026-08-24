import { BellRing } from "lucide-react";
import { PageHeader } from "@/components/page-components";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Alerts"
        description="DCR reminders, approval updates, route changes, and manager broadcasts."
      />
      <ul className="list">
        {["8 PM DCR reminder will appear here.", "Tour plan approval updates will sync here.", "Broadcast messages from HQ will be shown here."].map((item) => (
          <li className="list-item" key={item}>
            <strong><BellRing size={16} /> {item}</strong>
            <p className="muted">Notification engine placeholder ready for WebSocket and push integration.</p>
          </li>
        ))}
      </ul>
    </>
  );
}
