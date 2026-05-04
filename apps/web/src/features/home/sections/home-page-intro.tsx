import { RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { HomeDashboardStatus } from "../types";

interface HomePageIntroProps {
  status: Pick<
    HomeDashboardStatus,
    | "liveSectionCount"
    | "sessionStatus"
    | "syncStatus"
    | "totalSectionCount"
    | "viewState"
  >;
  onSync: () => void;
}

function getModeBadge(status: HomePageIntroProps["status"]) {
  switch (status.viewState) {
    case "ready-live":
      return { tone: "success" as const, label: "首页模块已全部实时同步" };
    case "partial-live":
      return { tone: "info" as const, label: "当前包含演示兜底" };
    case "loading":
      return { tone: "neutral" as const, label: "正在同步首页状态" };
    case "error":
      return { tone: "warning" as const, label: "实时同步失败，当前展示演示首页" };
    default:
      return { tone: "info" as const, label: "当前展示演示首页" };
  }
}

export function HomePageIntro({ status, onSync }: HomePageIntroProps) {
  const modeBadge = getModeBadge(status);

  return (
    <div className="page-header">
      <div>
        <h1>首页同步状态</h1>
        <p>
          当前首页已经按推荐、今日内容、画像和时间线四类真实能力重组。这里仅作为同步说明区，主任务舞台和快捷入口仍然是页面首屏重点。
        </p>
      </div>
      <div className="page-header__actions">
        <Badge tone={modeBadge.tone}>{modeBadge.label}</Badge>
        <Badge tone={status.liveSectionCount > 0 ? "info" : "neutral"}>
          {`实时模块 ${status.liveSectionCount}/${status.totalSectionCount}`}
        </Badge>
        <Badge
          tone={
            status.sessionStatus === "authenticated"
              ? "success"
              : status.sessionStatus === "loading"
                ? "neutral"
                : "warning"
          }
        >
          {status.sessionStatus === "authenticated"
            ? "当前已登录"
            : status.sessionStatus === "loading"
              ? "正在恢复会话"
              : "游客预览"}
        </Badge>
        <Button
          variant="secondary"
          loading={status.syncStatus === "loading" || status.sessionStatus === "loading"}
          onClick={onSync}
        >
          <RefreshCcw size={16} />
          {status.sessionStatus === "authenticated" ? "同步实时首页" : "重新检查登录态"}
        </Button>
      </div>
    </div>
  );
}
