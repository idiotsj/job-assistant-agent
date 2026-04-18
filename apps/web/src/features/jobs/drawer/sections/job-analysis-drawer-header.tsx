import type { Job } from "@job-assistant/contracts/jobs";
import { RefreshCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { JobDrawerSourceLabel, JobDrawerSourceMode, JobDrawerViewState } from "../types";

function getOverallBadge(sourceLabel: JobDrawerSourceLabel, viewState: JobDrawerViewState) {
  if (viewState === "stale-live") {
    return {
      tone: "warning" as const,
      label: "live 结果待刷新",
    };
  }

  if (sourceLabel === "live") {
    return {
      tone: "success" as const,
      label: "当前为 live",
    };
  }

  if (sourceLabel === "mixed") {
    return {
      tone: "warning" as const,
      label: "当前为 mixed",
    };
  }

  return {
    tone: "info" as const,
    label: "当前为 demo",
  };
}

function getModuleBadge(mode: JobDrawerSourceMode, label: string) {
  return {
    tone: mode === "live" ? ("success" as const) : ("info" as const),
    label: `${label} ${mode === "live" ? "live" : "demo"}`,
  };
}

export function JobAnalysisDrawerHeader({
  job,
  sourceLabel,
  analysisMode,
  rewriteMode,
  viewState,
  onReset,
  onClose,
}: {
  job: Job;
  sourceLabel: JobDrawerSourceLabel;
  analysisMode: JobDrawerSourceMode;
  rewriteMode: JobDrawerSourceMode;
  viewState: JobDrawerViewState;
  onReset: () => void;
  onClose: () => void;
}) {
  const overallBadge = getOverallBadge(sourceLabel, viewState);
  const analysisBadge = getModuleBadge(analysisMode, "分析");
  const rewriteBadge = getModuleBadge(rewriteMode, "改写");

  return (
    <div className="drawer-panel__header">
      <div className="drawer-panel__meta">
        <div className="drawer-panel__badges">
          <Badge tone={overallBadge.tone}>{overallBadge.label}</Badge>
          <Badge tone={analysisBadge.tone}>{analysisBadge.label}</Badge>
          <Badge tone={rewriteBadge.tone}>{rewriteBadge.label}</Badge>
        </div>
        <div>
          <h2>{job.title}</h2>
          <p>岗位分析与改写建议会分模块保留 demo / live 来源，避免把结构预览误认成你的真实投递结果。</p>
        </div>
      </div>

      <div className="drawer-panel__actions">
        {sourceLabel !== "demo" ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RefreshCcw size={14} />
            回到演示态
          </Button>
        ) : null}
        <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭抽屉">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
