import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Work Agent",
  description: "面向求职场景的智能工作台前端演示版。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <div className="app-shell">
            <AppSidebar />
            <main className="main-panel">
              <div className="main-panel__content">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
