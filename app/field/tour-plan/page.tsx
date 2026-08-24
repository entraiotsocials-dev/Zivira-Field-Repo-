import { PageHeader } from "@/components/page-components";
import { TourPlanForm } from "@/components/tour-plan-form";
import { ExpenseClaims } from "@/components/expense-claims";

export default function TourPlanPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tour Plan"
        title="Monthly Tour Plan"
        description="Submit your planned locations for manager approval. Voided/reassigned plans stay visible with full history."
      />
      <TourPlanForm />
      <ExpenseClaims />
    </>
  );
}
