import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ResumeSourceMode, ResumeViewState } from "../types";

interface ResumePageIntroProps {
  parseSnapshotMode: ResumeSourceMode;
  diagnosisMode: ResumeSourceMode;
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  viewState: ResumeViewState;
  onReset: () => void;
}

export function ResumePageIntro({
  parseSnapshotMode,
  diagnosisMode,
  sessionStatus,
  viewState,
  onReset,
}: ResumePageIntroProps) {
  return (
    <div className="page-header">
      <div>
        <h1>简历 AI 体检舱</h1>
        <p>
          现在已经补成“先解析、再体检”的正式工作台。左侧负责原文输入、文本文件导入和步骤操作，右侧负责结构解析、
          画像补全和 AI 洞察的连续展示。
        </p>
      </div>
      <div className="page-header__actions">
        <Badge tone={parseSnapshotMode === "live" ? "success" : "info"}>
          {parseSnapshotMode === "live" ? "结构解析：实时结果" : "结构解析：演示预览"}
        </Badge>
        <Badge tone={diagnosisMode === "live" ? "success" : "info"}>
          {diagnosisMode === "live" ? "AI 体检：实时结果" : "AI 体检：演示预览"}
        </Badge>
        <Badge
          tone={
            sessionStatus === "authenticated"
              ? "success"
              : sessionStatus === "loading"
                ? "neutral"
                : "warning"
          }
        >
          {sessionStatus === "authenticated"
            ? "当前已登录"
            : sessionStatus === "loading"
              ? "正在恢复会话"
              : "当前未登录"}
        </Badge>
        {viewState === "stale-live" ? <Badge tone="warning">当前结果已过期</Badge> : null}
        {parseSnapshotMode === "live" || diagnosisMode === "live" ? (
          <Button variant="ghost" onClick={onReset}>
            回到演示预览
          </Button>
        ) : null}
      </div>
    </div>
  );
}
