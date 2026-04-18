import type { JobResumeRewriteSuggestionsResult } from "@job-assistant/contracts/jobs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { AdoptedRewriteSuggestion, JobDrawerSourceMode } from "../types";
import { getSuggestionKey, rewriteSectionLabels } from "../utils";

export function JobAnalysisRewriteSection({
  rewrite,
  rewriteMode,
  adoptedSuggestions,
  copiedTarget,
  onAdoptSuggestion,
  onCopySuggestion,
  onCopyStandaloneText,
}: {
  rewrite: JobResumeRewriteSuggestionsResult;
  rewriteMode: JobDrawerSourceMode;
  adoptedSuggestions: AdoptedRewriteSuggestion[];
  copiedTarget: string | null;
  onAdoptSuggestion: (key: string) => void;
  onCopySuggestion: (key: string, text: string) => Promise<void>;
  onCopyStandaloneText: (target: "headline" | "summary", text: string) => Promise<void>;
}) {
  const adoptedKeys = new Set(adoptedSuggestions.map((item) => item.key));

  return (
    <Card className="analysis-panel">
      <div className="section-heading">
        <div>
          <h2>AI 原文改写</h2>
          <p>改写建议分成策略摘要、关键词和 diff 级分句建议，保持和后端 contract 一致。</p>
        </div>
        <Badge tone={rewriteMode === "live" ? "success" : "info"}>{rewriteMode === "live" ? "改写建议 live" : "改写建议 demo"}</Badge>
      </div>

      <p className="analysis-panel__copy">{rewrite.rewriteSuggestions.summary}</p>

      <div className="signal-grid">
        <Card className="signal-panel">
          <h3>标题建议</h3>
          <p>{rewrite.rewriteSuggestions.headlineSuggestion}</p>
          <div className="catalog-actions">
            <Button
              size="sm"
              variant={copiedTarget === "headline" ? "secondary" : "primary"}
              onClick={() => void onCopyStandaloneText("headline", rewrite.rewriteSuggestions.headlineSuggestion)}
            >
              {copiedTarget === "headline" ? "已复制标题建议" : "复制标题建议"}
            </Button>
          </div>
        </Card>

        <Card className="signal-panel">
          <h3>摘要建议</h3>
          <p>{rewrite.rewriteSuggestions.summarySuggestion}</p>
          <div className="catalog-actions">
            <Button
              size="sm"
              variant={copiedTarget === "summary" ? "secondary" : "primary"}
              onClick={() => void onCopyStandaloneText("summary", rewrite.rewriteSuggestions.summarySuggestion)}
            >
              {copiedTarget === "summary" ? "已复制摘要建议" : "复制摘要建议"}
            </Button>
          </div>
        </Card>

        <Card className="signal-panel">
          <h3>关键词建议</h3>
          <p>这些词更适合放进标题、摘要和项目结果句里，而不是单独堆在技能区。</p>
          <div className="badge-wall">
            {rewrite.rewriteSuggestions.keywordSuggestions.map((keyword) => (
              <Badge key={keyword} tone="info">
                {keyword}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <div className="diff-stack">
        {rewrite.rewriteSuggestions.sectionSuggestions.map((item) => {
          const key = getSuggestionKey(item);
          const adopted = adoptedKeys.has(key);

          return (
            <div className="diff-card" key={key}>
              <div className="catalog-card__top">
                <Badge tone="info">{rewriteSectionLabels[item.section]}</Badge>
                <span className="diff-card__goal">{item.rewriteGoal}</span>
              </div>

              <div className="diff-line diff-line--remove">
                <span className="diff-line__marker">-</span>
                <span>{item.currentIssue}</span>
              </div>
              <div className="diff-line diff-line--add">
                <span className="diff-line__marker">+</span>
                <span>{item.suggestedText}</span>
              </div>

              <div className="diff-card__actions">
                <Button size="sm" variant={adopted ? "secondary" : "primary"} onClick={() => onAdoptSuggestion(key)} disabled={adopted}>
                  {adopted ? "已加入采纳预览" : "一键采纳"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void onCopySuggestion(key, item.suggestedText)}>
                  {copiedTarget === `suggestion:${key}` ? "已复制建议句" : "复制建议句"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
