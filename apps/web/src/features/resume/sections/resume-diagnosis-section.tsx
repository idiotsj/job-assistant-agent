import { animate, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { ResumeSourceMode, ResumeWorkbenchData } from "../types";

function ScoreGauge({ score }: { score: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 0.9,
      onUpdate(value) {
        setDisplayValue(Math.round(value));
      },
    });

    return () => controls.stop();
  }, [score]);

  return (
    <div className="score-gauge">
      <div className="score-gauge__figure">
        <svg width="240" height="142" viewBox="0 0 240 142" aria-hidden="true">
          <path
            d="M 24 118 A 96 96 0 0 1 216 118"
            fill="none"
            stroke="rgba(214, 221, 231, 0.92)"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength={100}
          />
          <motion.path
            d="M 24 118 A 96 96 0 0 1 216 118"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength={100}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: score / 100 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
        </svg>
        <div className="score-gauge__value">
          <strong>{displayValue}</strong>
          <span>超过同届 78% 的候选人</span>
        </div>
      </div>
    </div>
  );
}

interface ResumeDiagnosisSectionProps {
  diagnosisResult: ResumeWorkbenchData["diagnosisResult"];
  diagnosisMode: ResumeSourceMode;
}

export function ResumeDiagnosisSection({
  diagnosisResult,
  diagnosisMode,
}: ResumeDiagnosisSectionProps) {
  return (
    <>
      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>AI 洞察面板</h2>
            <p>{diagnosisResult.diagnosis.summary}</p>
          </div>
          <Badge tone={diagnosisMode === "live" ? "success" : "info"}>
            {diagnosisMode === "live" ? "实时体检" : "演示体检"}
          </Badge>
        </div>

        <ScoreGauge score={diagnosisResult.diagnosis.overallScore} />

        <div className={`panel-note${diagnosisMode === "live" ? "" : " panel-note--warning"}`}>
          <Sparkles size={16} />
          <span>
            {diagnosisMode === "live"
              ? "当前展示的是本次真实体检结果，结论应作为行动建议来参考。"
              : "当前仍是演示体检结果。登录后可以继续调用真实诊断，但页面结构与表达方式保持一致。"}
          </span>
        </div>
      </Card>

      <div className="dual-panel">
        <Card className="badge-card">
          <Badge tone="success">AI 捕捉到的优势</Badge>
          <p>{diagnosisResult.diagnosis.alignment.targetSummary}</p>
          <div className="badge-wall">
            {diagnosisResult.diagnosis.quality.strengths.map((item) => (
              <Badge key={item} tone="success">
                {item}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="badge-card">
          <Badge tone="warning">风险与不足</Badge>
          <p>先把这些问题补齐，再继续投递会更稳。</p>
          <div className="badge-wall">
            {diagnosisResult.diagnosis.quality.risks.map((item) => (
              <Badge key={item} tone="warning">
                {item}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="analysis-panel">
          <div className="section-heading">
            <div>
              <h2>方向与缺口信号</h2>
              <p>把方向匹配、缺口和缺失信息拆开看，更方便后续衔接画像页或岗位页。</p>
            </div>
          </div>

          <div className="dual-panel">
            <div className="page-stack">
              <strong>匹配信号</strong>
              <div className="badge-wall">
                {diagnosisResult.diagnosis.alignment.matchedSignals.map((item) => (
                  <Badge key={item} tone="success">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="page-stack">
              <strong>待补信号</strong>
              <div className="badge-wall">
                {diagnosisResult.diagnosis.alignment.gapSignals.map((item) => (
                  <Badge key={item} tone="warning">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="page-stack">
            <strong>缺失信息提醒</strong>
            <div className="badge-wall">
              {diagnosisResult.diagnosis.quality.missingInfo.map((item) => (
                <Badge key={item} tone="info">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
