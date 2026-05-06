import Link from "next/link";

import { GuidedTaskCard } from "@/components/blocks/guided-task-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { ProfilePageData } from "../types";

export function ProfileStageSection({
  displayUserLabel,
  profileReadinessLabel,
  profileTags,
  stageTask,
  focusCards,
}: Pick<
  ProfilePageData,
  "displayUserLabel" | "profileReadinessLabel" | "profileTags" | "stageTask" | "focusCards"
>) {
  if (!stageTask) {
    return null;
  }

  return (
    <section className="profile-dashboard-grid">
      <div className="page-stack">
        <Card className="feature-panel profile-identity-card">
          <div className="section-heading">
            <div>
              <h2>个人中心</h2>
              <p>把身份、目标方向和当前阶段放到同一个工作台里，不再让画像只像一张配置表单。</p>
            </div>
            <Badge tone="info">{profileReadinessLabel}</Badge>
          </div>

          <div className="profile-identity-card__headline">
            <strong>{displayUserLabel}</strong>
            <span>当前画像将继续驱动首页、岗位推荐、频道建议和日程提醒。</span>
          </div>

          {profileTags.length > 0 ? (
            <div className="tag-wall">
              {profileTags.map((tag) => (
                <span key={tag} className="suggestion-chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="message-strip">当前还没有足够的画像标签，建议先补齐基础方向字段。</div>
          )}
        </Card>

        <GuidedTaskCard
          stageLabel={stageTask.stageLabel}
          title={stageTask.title}
          explanation={stageTask.explanation}
          benefitTips={stageTask.benefitTips}
          primaryAction={{
            label: stageTask.primaryActionLabel,
            onClick: () => {
              window.location.href = stageTask.primaryActionHref;
            },
          }}
          secondaryAction={{
            label: stageTask.secondaryActionLabel,
            onClick: () => {
              window.location.href = stageTask.secondaryActionHref;
            },
          }}
        />
      </div>

      <div className="profile-focus-grid">
        {focusCards.map((card) => (
          <Card key={card.label} className="feature-panel summary-card">
            <span className="summary-card__label">{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </Card>
        ))}

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>跨页入口</h2>
              <p>个人中心要能把用户顺势带去简历、岗位和首页，而不是把人困在资料维护页。</p>
            </div>
          </div>
          <div className="catalog-actions">
            <Link href="/" className="wa-button wa-button--secondary wa-button--sm">
              返回首页
            </Link>
            <Link href="/resume" className="wa-button wa-button--secondary wa-button--sm">
              去简历体检
            </Link>
            <Link href="/jobs" className="wa-button wa-button--primary wa-button--sm">
              去看岗位
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
