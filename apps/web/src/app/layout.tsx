import type { ReactNode } from "react";

export const metadata = {
  title: "就业辅助智能体",
  description: "V1 backend scaffold for a job-first guidance assistant.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

