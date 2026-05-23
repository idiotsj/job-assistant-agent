"use client";

import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface GuidedTaskCardProps {
  stageLabel?: string;
  title?: string;
  explanation?: string;
  benefitTips?: string[];
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
  className?: string;
}

const DEFAULT_STAGE_LABEL = "当前阶段";
const DEFAULT_TITLE = "完善你的职业画像";
const DEFAULT_EXPLANATION =
  "AI 将根据你的学历、技能和偏好，为你匹配最合适的岗位和升学路径。完成画像后，首页推荐、岗位匹配和简历诊断都会更加精准。";
const DEFAULT_TIPS = [
  "获得更精准的岗位推荐",
  "解锁智能简历诊断",
  "接收个性化日程提醒",
];

export function GuidedTaskCard({
  stageLabel = DEFAULT_STAGE_LABEL,
  title = DEFAULT_TITLE,
  explanation = DEFAULT_EXPLANATION,
  benefitTips = DEFAULT_TIPS,
  primaryAction,
  secondaryAction,
  className,
}: GuidedTaskCardProps) {
  return (
    <div className={`guided-task-card${className ? ` ${className}` : ""}`}>
      <span className="guided-task-card__stage">{stageLabel}</span>
      <h2 className="guided-task-card__title">{title}</h2>
      <p className="guided-task-card__explanation">{explanation}</p>

      <div className="guided-task-card__tips">
        {benefitTips.map((tip) => (
          <div key={tip} className="guided-task-card__tip">
            <CheckCircle size={18} className="guided-task-card__tip-icon" />
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <div className="guided-task-card__actions">
        <Button
          variant="primary"
          size="lg"
          onClick={primaryAction?.onClick}
          style={{
            background: "hsl(var(--primary))",
            color: "white",
            boxShadow: "0 12px 28px rgba(62, 129, 229, 0.25)",
            border: "none",
          }}
        >
          {primaryAction?.label ?? "立即前往"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={secondaryAction?.onClick}
        >
          {secondaryAction?.label ?? "查看详情"}
        </Button>
      </div>
    </div>
  );
}
