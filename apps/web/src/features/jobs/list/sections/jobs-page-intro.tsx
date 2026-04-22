import { RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { JobsSourceMode, JobsViewState } from "../types";

function getModeBadge(mode: JobsSourceMode, viewState: JobsViewState) {
  if (viewState === "loading") {
    return {
      tone: "info" as const,
      label: "正在同步岗位",
    };
  }

  if (viewState === "error") {
    return {
      tone: "warning" as const,
      label: "同步失败",
    };
  }

  return {
    tone: mode === "live" ? ("success" as const) : ("info" as const),
    label: mode === "live" ? "真实岗位列表" : "当前展示演示岗位",
  };
}

export function JobsPageIntro({
  mode,
  viewState,
  loading,
  onSync,
  onResetToDemo,
}: {
  mode: JobsSourceMode;
  viewState: JobsViewState;
  loading: boolean;
  onSync: () => Promise<void>;
  onResetToDemo: () => void;
}) {
  const badge = getModeBadge(mode, viewState);

  return (
    <div className="page-header">
      <div>
        <h1>岗位列表</h1>
        <p>岗位列表页现在也按统一的 `page + hook + sections + types/utils` 结构收口，让筛选、分页、来源状态和卡片展示都能独立维护。</p>
      </div>
      <div className="page-header__actions">
        <Badge tone={badge.tone}>{badge.label}</Badge>
        <Button variant="secondary" loading={loading} onClick={() => void onSync()}>
          <RefreshCcw size={16} />
          同步真实列表
        </Button>
        {mode === "live" ? (
          <Button variant="ghost" onClick={onResetToDemo}>
            回到演示态
          </Button>
        ) : null}
      </div>
    </div>
  );
}
