import { RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ScheduleTimelineMode, ScheduleViewState } from "../types";

function getModeBadge(mode: ScheduleTimelineMode, viewState: ScheduleViewState) {
  if (viewState === "error") {
    return {
      tone: "warning" as const,
      label: "同步失败",
    };
  }

  return {
    tone: mode === "live" ? ("success" as const) : ("info" as const),
    label: mode === "live" ? "真实日程已同步" : "当前展示演示时间线",
  };
}

export function SchedulePageIntro({
  mode,
  viewState,
  sessionStatus,
  loading,
  onSync,
}: {
  mode: ScheduleTimelineMode;
  viewState: ScheduleViewState;
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  loading: boolean;
  onSync: () => Promise<void>;
}) {
  const badge = getModeBadge(mode, viewState);

  return (
    <div className="page-header">
      <div>
        <h1>日程时间线</h1>
        <p>
          把岗位截止时间、活动安排、考试提醒和你自己新增的事项放进同一条时间线上看，但编辑权限只开放给
          <code> user </code>
          来源。
        </p>
      </div>
      <div className="page-header__actions">
        <Badge tone={badge.tone}>{badge.label}</Badge>
        {sessionStatus === "authenticated" ? (
          <Button variant="secondary" loading={loading} onClick={() => void onSync()}>
            <RefreshCcw size={16} />
            同步真实日程
          </Button>
        ) : (
          <Link href="/login" className="wa-button wa-button--secondary wa-button--md">
            登录后同步
          </Link>
        )}
      </div>
    </div>
  );
}
