"use client";

import type { ReactNode } from "react";

import { BrandTopBar } from "./brand-top-bar";

interface DashboardShellProps {
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
}

export function DashboardShell({ children, leftRail, rightRail }: DashboardShellProps) {
  return (
    <div className="dashboard-shell">
      <BrandTopBar />
      <div className="dashboard-shell__body">
        <aside className="dashboard-shell__left-rail">{leftRail}</aside>
        <main className="dashboard-shell__main-stage">{children}</main>
        <aside className="dashboard-shell__right-rail">{rightRail}</aside>
      </div>
    </div>
  );
}
