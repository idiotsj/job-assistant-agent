import { BriefcaseBusiness } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CatalogPagination } from "@/features/catalog/catalog-pagination";
import { formatCompactDate } from "@/features/catalog/catalog-helpers";

import type { JobsPageResponse, JobsSourceMode, JobsViewState } from "../types";
import { createJobInsight, getCompanyInitials } from "../utils";

function getEmptyStateCopy(viewState: JobsViewState, mode: JobsSourceMode) {
  if (viewState === "error") {
    return {
      title: "岗位列表暂时没有同步成功",
      description: "当前没有可展示的结果。可以稍后再次同步真实列表，或先回到默认筛选检查演示结构。",
    };
  }

  return {
    title: mode === "live" ? "当前筛选下没有真实岗位结果" : "当前筛选下没有岗位结果",
    description: "这是正式的筛选空态，不是接口异常。可以放宽城市、行业或关键词后继续浏览。",
  };
}

export function JobsResultsSection({
  response,
  mode,
  viewState,
  onPageChange,
}: {
  response: JobsPageResponse;
  mode: JobsSourceMode;
  viewState: JobsViewState;
  onPageChange: (page: number) => void;
}) {
  const emptyState = getEmptyStateCopy(viewState, mode);

  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>岗位结果</h2>
          <p>点击任一岗位后会进入正式详情页，再从详情页进入简历分析抽屉。当前页只负责列表浏览、筛选和分页。</p>
        </div>
        <BriefcaseBusiness size={18} color="hsl(var(--primary))" />
      </div>

      {response.data.length === 0 ? (
        <div className="empty-state">
          <strong>{emptyState.title}</strong>
          <p>{emptyState.description}</p>
        </div>
      ) : (
        <div className="catalog-grid catalog-grid--companies">
          {response.data.map((job) => (
            <article className="catalog-card" key={job.id}>
              <div className="catalog-card__top">
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="logo-chip">{getCompanyInitials(job.companyName)}</div>
                  <div className="recommend-card__company">
                    <strong>{job.companyName}</strong>
                    <span>
                      {job.companyIndustry} · {job.workLocation}
                    </span>
                  </div>
                </div>
                {job.isFeatured ? <Badge tone="info">精选岗位</Badge> : null}
              </div>

              <h3>{job.title}</h3>
              <p className="catalog-card__copy">{job.description}</p>

              <div className="tag-row">
                {job.tags.map((tag) => (
                  <span className="tag-pill" key={`${job.id}-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="bullet-stack">
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>要求技能</strong>
                    <span>{job.requiredSkills.slice(0, 3).join(" / ") || "当前未提供要求技能"}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>截止时间</strong>
                    <span>{job.deadline ? formatCompactDate(job.deadline) : "长期开放"}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>投递提示</strong>
                    <span>{createJobInsight(job)}</span>
                  </div>
                </div>
              </div>

              <div className="catalog-card__footer">
                <span className="small-copy">热度 {job.popularity}</span>
                <Link href={`/jobs/${job.id}`} className="wa-button wa-button--secondary wa-button--sm">
                  查看详情
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <CatalogPagination
        page={response.pagination.page}
        totalPages={response.pagination.totalPages}
        total={response.pagination.total}
        onPageChange={onPageChange}
      />
    </Card>
  );
}
