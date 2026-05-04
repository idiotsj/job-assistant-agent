"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { GuidedTaskCard } from "@/components/blocks/guided-task-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { HomeDashboardData, HomeDashboardStatus } from "../types";

interface HomeStageSectionProps {
  stageTask: HomeDashboardData["stageTask"];
  quickLinks: HomeDashboardData["quickLinks"];
  spotlightJobs: HomeDashboardData["spotlightJobs"];
  recommendationMode: HomeDashboardStatus["modes"]["recommendation"];
}

export function HomeStageSection({
  stageTask,
  quickLinks,
  spotlightJobs,
  recommendationMode,
}: HomeStageSectionProps) {
  const router = useRouter();

  return (
    <section className="home-stage-layout">
      <GuidedTaskCard
        className="home-stage-layout__task-card"
        stageLabel={stageTask.stageLabel}
        title={stageTask.title}
        explanation={stageTask.explanation}
        benefitTips={stageTask.benefitTips}
        primaryAction={{
          label: stageTask.primaryActionLabel,
          onClick: () => router.push(stageTask.primaryActionHref),
        }}
        secondaryAction={{
          label: stageTask.secondaryActionLabel,
          onClick: () => router.push(stageTask.secondaryActionHref),
        }}
      />

      <div className="page-stack">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>快捷入口</h2>
              <p>把高频模块收拢到首页主舞台，维持和右侧知识树一致的产品入口语义。</p>
            </div>
          </div>
          <div className="home-quick-links">
            {quickLinks.map((link) => (
              <Link key={link.id} href={link.href} className="home-quick-links__item">
                <strong>{link.label}</strong>
                <span>{link.description}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>精准推送</h2>
              <p>优先把最值得判断的岗位摆在首页主舞台，而不是继续埋在推荐流深处。</p>
            </div>
            <Badge tone={recommendationMode === "live" ? "success" : "info"}>
              {recommendationMode === "live" ? "推荐：实时" : "推荐：演示"}
            </Badge>
          </div>

          {spotlightJobs.length > 0 ? (
            <div className="home-spotlight-jobs">
              {spotlightJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="home-spotlight-jobs__item">
                  <div className="home-spotlight-jobs__top">
                    <strong>{job.title}</strong>
                    <Badge tone="info">{job.score}%</Badge>
                  </div>
                  <span>
                    {job.companyName} · {job.workLocation}
                  </span>
                  <p>{job.reason}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>当前没有可展示的精准推送岗位</strong>
              <p>如果你已经登录但这里仍为空，建议先去画像页补全偏好，再回来刷新首页。</p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
