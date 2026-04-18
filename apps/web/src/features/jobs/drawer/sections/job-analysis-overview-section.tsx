import type { JobResumeAnalyzeResult } from "@job-assistant/contracts/jobs";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

import type { JobDrawerSkillRow, JobDrawerSourceMode } from "../types";
import { getVerdictLabel, verdictTone } from "../utils";

export function JobAnalysisOverviewSection({
  analysis,
  analysisMode,
  skillRows,
}: {
  analysis: JobResumeAnalyzeResult;
  analysisMode: JobDrawerSourceMode;
  skillRows: JobDrawerSkillRow[];
}) {
  return (
    <>
      <div className="drawer-score">
        <div className="drawer-score__number">{analysis.analysis.overallScore}</div>
        <div className="drawer-score__meta">
          <Badge tone={verdictTone(analysis.analysis.verdict)}>{getVerdictLabel(analysis.analysis.verdict)}</Badge>
          <span className="drawer-copy">{analysis.analysis.summary}</span>
        </div>
      </div>

      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>能力雷达墙</h2>
            <p>用横向进度条直接对齐岗位技能要求和简历信号，不再只停留在视觉示意层。</p>
          </div>
          <Badge tone={analysisMode === "live" ? "success" : "info"}>{analysisMode === "live" ? "分析结果 live" : "分析结果 demo"}</Badge>
        </div>

        <div className="progress-stack">
          {skillRows.map((row) => (
            <div key={row.skill} className="progress-row">
              <div className="progress-row__top">
                <span>{row.skill}</span>
                <span>{row.copy}</span>
              </div>
              <ProgressBar value={row.score} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>匹配亮点、缺口与风险</h2>
            <p>把岗位分析结果按“亮点 / 缺口 / 风险”拆开，避免后续维护时继续塞进同一堆文案里。</p>
          </div>
        </div>

        <div className="signal-grid">
          <Card className="signal-panel">
            <h3>匹配亮点</h3>
            <p>这些是当前简历已经比较容易被岗位读到的信号。</p>
            <div className="badge-wall">
              {analysis.analysis.matchedRequirements.length > 0 ? (
                analysis.analysis.matchedRequirements.map((item) => (
                  <Badge key={item} tone="success">
                    {item}
                  </Badge>
                ))
              ) : (
                <span className="drawer-copy">当前没有提取到明确的匹配亮点。</span>
              )}
            </div>
          </Card>

          <Card className="signal-panel">
            <h3>能力缺口</h3>
            <p>这些缺口更适合在项目表述里补齐，而不是只往技能区追加关键词。</p>
            <div className="badge-wall">
              {analysis.analysis.gaps.length > 0 ? (
                analysis.analysis.gaps.map((item) => (
                  <Badge key={item} tone="warning">
                    {item}
                  </Badge>
                ))
              ) : (
                <span className="drawer-copy">当前没有识别出显著缺口。</span>
              )}
            </div>
          </Card>

          <Card className="signal-panel">
            <h3>简历风险</h3>
            <p>这些问题更多是表达与结构风险，修掉后通常比盲目加内容更有效。</p>
            <div className="bullet-stack">
              {analysis.analysis.resumeRisks.length > 0 ? (
                analysis.analysis.resumeRisks.map((item) => (
                  <div className="list-item" key={item}>
                    <div className="bullet-dot" />
                    <div>
                      <span>{item}</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="drawer-copy">当前没有识别出额外的简历风险。</span>
              )}
            </div>
          </Card>
        </div>
      </Card>
    </>
  );
}
