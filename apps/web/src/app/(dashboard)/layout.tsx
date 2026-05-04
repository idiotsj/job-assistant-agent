import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CountdownCard, GradientAdviceCard, KnowledgeTreeCard } from "@/components/blocks";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      leftRail={<CountdownCard />}
      rightRail={
        <>
          <KnowledgeTreeCard />
          <GradientAdviceCard />
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
