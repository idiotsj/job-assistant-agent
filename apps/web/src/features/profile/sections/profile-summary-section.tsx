import { Card } from "@/components/ui/card";

import type { ProfileSummaryItem } from "../types";

export function ProfileSummarySection({
  completeness,
  total,
  summaryItems,
}: {
  completeness: number;
  total: number;
  summaryItems: ProfileSummaryItem[];
}) {
  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>当前画像摘要</h2>
          <p>这里保留为快速校验区，帮助用户确认系统理解是否正确，而不是重新读一遍所有字段。</p>
        </div>
      </div>

      <div className="profile-stat">
        <strong>{completeness}/{total}</strong>
        <span>核心画像字段已完成</span>
      </div>

      <div className="bullet-stack">
        {summaryItems.map((item) => (
          <div className="list-item" key={item.label}>
            <div className="bullet-dot" />
            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
