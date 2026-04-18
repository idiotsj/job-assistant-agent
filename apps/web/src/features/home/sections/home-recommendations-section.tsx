import { motion } from "framer-motion";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { HomeDashboardData, HomeSourceMode } from "../types";

interface HomeRecommendationsSectionProps {
  recommendation: HomeDashboardData["recommendation"];
  recommendationMode: HomeSourceMode;
}

export function HomeRecommendationsSection({
  recommendation,
  recommendationMode,
}: HomeRecommendationsSectionProps) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>三大推荐流</h2>
          <p>岗位、案例、活动继续按后端分区建模展示，不打平成单一信息流。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={recommendationMode === "live" ? "success" : "info"}>
            {recommendationMode === "live" ? "推荐结果：实时" : "推荐结果：演示"}
          </Badge>
          <Link href="/jobs" className="wa-button wa-button--secondary wa-button--sm">
            全部岗位
          </Link>
        </div>
      </div>

      {recommendation.jobs.length === 0 ? (
        <Card className="feature-panel">
          <div className="empty-state">
            <strong>当前没有岗位推荐</strong>
            <p>
              这不一定是接口异常，也可能是画像太空。可以先去画像页补全目标岗位和城市，再回来刷新首页。
            </p>
            <div className="catalog-actions">
              <Link href="/profile" className="wa-button wa-button--primary wa-button--md">
                去补画像
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="recommend-grid">
          {recommendation.jobs.map((job, index) => (
            <motion.div
              key={job.id}
              whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
              transition={{ duration: 0.2 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              <Card className="recommend-card">
                <div className="recommend-card__top">
                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="logo-chip">{job.companyName.slice(0, 2)}</div>
                    <div className="recommend-card__company">
                      <strong>{job.companyName}</strong>
                      <span>{job.companyIndustry}</span>
                    </div>
                  </div>
                  <Badge tone="info">AI 契合度 {job.score}%</Badge>
                </div>
                <h3>{job.title}</h3>
                <div className="tag-row">
                  {job.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                  <span className="tag-pill">{job.workLocation}</span>
                </div>
                <p className="recommend-card__reason">{job.reason}</p>
                <div className="catalog-actions">
                  <Link href={`/jobs/${job.id}`} className="wa-button wa-button--secondary wa-button--sm">
                    查看岗位详情
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
