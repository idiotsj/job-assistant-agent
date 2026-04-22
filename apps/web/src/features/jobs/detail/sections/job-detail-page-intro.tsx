import { ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { JobDetailSourceMode, JobDetailViewState } from "../types";

function getModeBadge(mode: JobDetailSourceMode, viewState: JobDetailViewState) {
  if (viewState === "loading") {
    return {
      tone: "info" as const,
      label: "正在同步详情",
    };
  }

  if (viewState === "not-found") {
    return {
      tone: "warning" as const,
      label: "真实岗位不可用",
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
    label: mode === "live" ? "真实岗位详情" : "当前展示演示详情",
  };
}

export function JobDetailPageIntro({
  mode,
  viewState,
  loading,
  onSync,
}: {
  mode: JobDetailSourceMode;
  viewState: JobDetailViewState;
  loading: boolean;
  onSync: () => Promise<void>;
}) {
  const badge = getModeBadge(mode, viewState);

  return (
    <div className="page-header">
      <div>
        <h1>岗位详情</h1>
        <p>岗位详情页开始按统一的 `page + hook + sections + types/utils` 结构收口，让详情内容、状态同步和分析抽屉联动各自有稳定归位。</p>
      </div>
      <div className="page-header__actions">
        <Badge tone={badge.tone}>{badge.label}</Badge>
        <Button variant="secondary" loading={loading} onClick={() => void onSync()}>
          <RefreshCcw size={16} />
          同步真实详情
        </Button>
        <Link href="/jobs" className="wa-button wa-button--ghost wa-button--md">
          <ArrowLeft size={16} />
          返回列表
        </Link>
      </div>
    </div>
  );
}
