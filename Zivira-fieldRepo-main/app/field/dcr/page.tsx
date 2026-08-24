import { DcrForm } from "@/components/dcr-form";
import { PageHeader } from "@/components/page-components";

export default function DcrPage() {
  return (
    <>
      <PageHeader
        eyebrow="Submit DCR"
        title="Daily call report"
        description="Capture visit details, products detailed, notes, and sync into the tenant DCR pipeline."
      />
      <DcrForm />
    </>
  );
}
