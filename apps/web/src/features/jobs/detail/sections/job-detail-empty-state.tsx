import Link from "next/link";

import { Card } from "@/components/ui/card";

import type { JobDetailViewState } from "../types";

export function JobDetailEmptyState({
  viewState,
}: {
  viewState: JobDetailViewState;
}) {
  const title =
    viewState === "loading"
      ? "正在同步岗位详情"
      : viewState === "not-found"
        ? "岗位不存在或已下线"
        : "当前没有可展示的岗位详情";

  const copy =
    viewState === "loading"
      ? "如果这是一个非演示岗位，页面会先等待真实详情返回，再决定是否进入空态。"
      : viewState === "not-found"
        ? "后端已经明确返回 `404`，所以这里作为详情空态承载，而不是包装成普通接口异常。"
        : "真实岗位详情暂时没有成功返回，可以稍后再尝试同步。";

  return (
    <Card className="feature-panel">
      <div className="empty-state">
        <strong>{title}</strong>
        <p>{copy}</p>
        <div className="catalog-actions">
          <Link href="/jobs" className="wa-button wa-button--secondary wa-button--md">
            回岗位列表
          </Link>
        </div>
      </div>
    </Card>
  );
}
