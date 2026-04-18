import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function JobAnalysisInputSection({
  sessionStatus,
  rawText,
  actionStatus,
  resultStale,
  onRawTextChange,
  onAnalyze,
}: {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  rawText: string;
  actionStatus: "idle" | "analyzing" | "copying";
  resultStale: boolean;
  onRawTextChange: (nextValue: string) => void;
  onAnalyze: () => Promise<void>;
}) {
  return (
    <div className="resume-input">
      <div className="field-group">
        <span className="field-label">当前投递用简历原文</span>
        <p className="drawer-copy">这里仍然只接收纯文本内容；每次点击按钮都会把当前文本重新提交给岗位分析接口。</p>
        <Textarea value={rawText} onChange={(event) => onRawTextChange(event.target.value)} />
      </div>

      {resultStale ? (
        <div className="panel-note panel-note--warning">
          <Sparkles size={16} />
          <span>原文已经变更，建议重新运行一次岗位分析和改写建议，避免继续参考旧文本结果。</span>
        </div>
      ) : null}

      {sessionStatus === "unauthenticated" ? (
        <div className="catalog-actions">
          <Link href="/login" className="wa-button wa-button--primary wa-button--md">
            登录后分析
          </Link>
          <Link href="/register" className="wa-button wa-button--secondary wa-button--md">
            先注册
          </Link>
        </div>
      ) : null}

      <Button loading={actionStatus === "analyzing"} onClick={() => void onAnalyze()}>
        <Sparkles size={16} />
        一键评估投递成功率
      </Button>
    </div>
  );
}
