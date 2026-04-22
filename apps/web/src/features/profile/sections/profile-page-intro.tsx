import { RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ProfileSessionStatus, ProfileViewState } from "../types";

function getStatusBadge(sessionStatus: ProfileSessionStatus, viewState: ProfileViewState) {
  if (sessionStatus === "loading" || viewState === "loading") {
    return {
      tone: "info" as const,
      label: "正在恢复画像状态",
    };
  }

  if (sessionStatus !== "authenticated") {
    return {
      tone: "warning" as const,
      label: "当前为游客状态",
    };
  }

  return {
    tone: "info" as const,
    label: "当前登录中",
  };
}

export function ProfilePageIntro({
  sessionStatus,
  viewState,
  displayUserLabel,
  loading,
  onSync,
}: {
  sessionStatus: ProfileSessionStatus;
  viewState: ProfileViewState;
  displayUserLabel: string;
  loading: boolean;
  onSync: () => Promise<void>;
}) {
  const badge = getStatusBadge(sessionStatus, viewState);

  return (
    <div className="page-header">
      <div>
        <h1>用户画像</h1>
        <p>这里是后续所有个性化能力的核心输入层。先把你想去哪里、想投什么、会什么写清楚，推荐结果才会稳定。</p>
      </div>
      <div className="page-header__actions">
        <Badge tone={badge.tone}>
          {badge.label}
          {sessionStatus === "authenticated" ? `：${displayUserLabel}` : ""}
        </Badge>
        {sessionStatus === "authenticated" ? (
          <Button variant="secondary" loading={loading} onClick={() => void onSync()}>
            <RefreshCcw size={16} />
            重新同步画像
          </Button>
        ) : null}
      </div>
    </div>
  );
}
