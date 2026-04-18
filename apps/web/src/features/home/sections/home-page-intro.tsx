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
        <h1>首页控制中心</h1>
        <p>
          首页现在按“推荐 / 今日内容 / 画像 / 时间线”四个模块分区同步。页面层只负责编排，数据同步、状态计算和
          demo/live 处理统一收口到 feature hook 里。
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
