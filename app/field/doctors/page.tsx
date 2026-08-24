import { DoctorList } from "@/components/doctor-list";
import { PageHeader } from "@/components/page-components";

export default function DoctorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="My Doctors"
        title="Assigned doctors"
        description="Doctor list assigned to your territory and mapped employee code."
      />
      <DoctorList />
    </>
  );
}
