import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { AdoptedRewriteSuggestion } from "../types";
import { rewriteSectionLabels } from "../utils";

export function JobAnalysisActionSection({
  adoptedSuggestions,
  actionChecklist,
  copiedTarget,
  onCopyAdoptedSuggestions,
  onClearAdoptedSuggestions,
  onRemoveAdoptedSuggestion,
}: {
  adoptedSuggestions: AdoptedRewriteSuggestion[];
  actionChecklist: string[];
  copiedTarget: string | null;
  onCopyAdoptedSuggestions: () => Promise<void>;
  onClearAdoptedSuggestions: () => void;
  onRemoveAdoptedSuggestion: (key: string) => void;
}) {
  return (
    <>
      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>采纳预览</h2>
            <p>“一键采纳”只作用于当前抽屉预览，帮助你先整理要带走的句子，不会自动保存回简历正文。</p>
          </div>
          <Badge tone={adoptedSuggestions.length > 0 ? "success" : "neutral"}>
            {adoptedSuggestions.length > 0 ? `${adoptedSuggestions.length} 条已采纳` : "尚未采纳"}
          </Badge>
        </div>

        <div className="panel-note">
          <Sparkles size={16} />
          <span>推荐做法是先在这里筛出要带走的句子，再复制到你的简历编辑器里统一调整上下文。</span>
        </div>

        {adoptedSuggestions.length === 0 ? (
          <div className="empty-state">
            <strong>还没有采纳任何建议</strong>
            <p>你可以先从上面的 diff 建议里挑几条最贴近这次岗位的句子加入预览。</p>
          </div>
        ) : (
          <>
            <div className="catalog-actions">
              <Button size="sm" onClick={() => void onCopyAdoptedSuggestions()}>
                {copiedTarget === "adopted" ? "已复制已采纳文案" : "复制已采纳文案"}
              </Button>
              <Button size="sm" variant="secondary" onClick={onClearAdoptedSuggestions}>
                清空采纳预览
              </Button>
            </div>

            <div className="adopted-stack">
              {adoptedSuggestions.map((item) => (
                <div className="adopted-card" key={item.key}>
                  <div className="adopted-card__top">
                    <div>
                      <Badge tone="success">{rewriteSectionLabels[item.section]}</Badge>
                      <p className="adopted-card__goal">{item.rewriteGoal}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => onRemoveAdoptedSuggestion(item.key)}>
                      移除
                    </Button>
                  </div>
                  <p className="adopted-card__text">{item.suggestedText}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>行动清单</h2>
            <p>把岗位分析和改写建议合并成一份前置动作列表，方便真正动手改简历。</p>
          </div>
        </div>

        <ul className="checklist">
          {actionChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}
