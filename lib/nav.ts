import { CalendarDays, ClipboardPlus, MapPinned, Stethoscope, UserCheck, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FieldNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const fieldNav: FieldNavItem[] = [
  { title: "Today", href: "/field/today", icon: CalendarDays },
  { title: "DCR", href: "/field/dcr", icon: ClipboardPlus },
  { title: "Doctors", href: "/field/doctors", icon: Stethoscope },
  { title: "Tour", href: "/field/tour-plan", icon: MapPinned },
  { title: "Attend", href: "/field/attendance", icon: UserCheck },
  { title: "Profile", href: "/field/profile", icon: UserCircle }
];
