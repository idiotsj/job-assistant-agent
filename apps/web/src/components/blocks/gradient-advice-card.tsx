"use client";

import { ChevronRight, Sparkles } from "lucide-react";

interface GradientAdviceCardProps {
  advice?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const DEFAULT_ADVICE = "每天花 15 分钟浏览岗位动态，保持对市场需求的敏感度。AI 会持续为你推荐匹配度最高的机会。";

export function GradientAdviceCard({
  advice = DEFAULT_ADVICE,
  actionLabel = "前往练习",
  onAction,
  className,
}: GradientAdviceCardProps) {
  return (
    <div className={`gradient-advice-card${className ? ` ${className}` : ""}`}>
      <div className="gradient-advice-card__header">
        <Sparkles size={16} className="gradient-advice-card__header-icon" />
        <span className="gradient-advice-card__header-label">每日建议</span>
      </div>
      <p className="gradient-advice-card__text">{advice}</p>
      <button type="button" className="gradient-advice-card__action" onClick={onAction}>
        {actionLabel}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
