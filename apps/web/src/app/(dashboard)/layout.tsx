import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LeftRailNav } from "@/components/layout/left-rail-nav";
import { RightRailUser } from "@/components/layout/right-rail-user";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      leftRail={<LeftRailNav />}
      rightRail={<RightRailUser />}
    >
      {children}
    </DashboardShell>
  );
}
