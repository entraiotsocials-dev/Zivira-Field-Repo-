import { PageHeader } from "@/components/page-components";
import { TodayPanel } from "@/components/today-panel";

export default function TodayPage() {
  return (
    <>
      <PageHeader
        eyebrow="Today's Plan"
        title="Field day"
        description="Scheduled visits, route queue, attendance, and DCR progress for the day."
      />
      <TodayPanel />
    </>
  );
}
