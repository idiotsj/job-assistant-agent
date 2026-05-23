"use client";

import Link from "next/link";
import { CalendarDays, Building2, FileText, ChevronRight, RefreshCw, Star, MapPin, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";

import type { HomeDashboardData } from "../types";
import { formatCompactDate } from "../utils";

interface HomeBottomSectionProps {
  featuredEvents: HomeDashboardData["featuredEvents"];
  featuredCompany: HomeDashboardData["featuredCompany"];
  insightHighlights: HomeDashboardData["insightHighlights"];
  spotlightJobs: HomeDashboardData["spotlightJobs"];
}

const DEMO_JOBS = [
  { id: "j1", title: "前端开发工程师", companyName: "字节跳动", workLocation: "上海", salary: "25-40K", tags: ["React", "TypeScript"] },
  { id: "j2", title: "产品经理", companyName: "腾讯", workLocation: "深圳", salary: "20-35K", tags: ["B端", "数据驱动"] },
  { id: "j3", title: "算法工程师", companyName: "阿里巴巴", workLocation: "杭州", salary: "30-50K", tags: ["NLP", "推荐系统"] },
];

const DEMO_COMPANIES = [
  { id: "c1", name: "字节跳动", industry: "互联网 / 科技", city: "北京", description: "2026 春招补录中，大量算法和产品岗位开放。", tags: ["算法", "产品", "运营"] },
  { id: "c2", name: "腾讯", industry: "互联网 / 社交", city: "深圳", description: "微信事业群持续招聘前端和后端工程师。", tags: ["前端", "后端", "设计"] },
  { id: "c3", name: "华为", industry: "通信 / 科技", city: "深圳", description: "校招开放中，芯片和云计算方向需求旺盛。", tags: ["芯片", "云计算", "5G"] },
];

const DEMO_EVENTS = [
  { id: "e1", title: "字节跳动 2026 春招宣讲会", companyName: "字节跳动", startAt: "2026-05-25T14:00:00", location: "A302 教学楼" },
  { id: "e2", title: "腾讯技术沙龙：AI 工程实践", companyName: "腾讯", startAt: "2026-05-27T10:00:00", location: "B201 报告厅" },
];

const DEMO_POLICIES = [
  { id: "p1", title: "2026 年应届生就业补贴政策解读", body: "多省市出台新一轮应届生就业补贴，涵盖租房、社保、创业等多个方面。", href: "/insights", actionLabel: "查看详情" },
  { id: "p2", title: "教育部：推进高校毕业生精准就业帮扶", body: "教育部发布通知，要求各高校建立'一生一策'就业帮扶台账。", href: "/insights", actionLabel: "查看详情" },
];

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function HomeBottomSection({
  spotlightJobs,
  featuredEvents,
  featuredCompany,
  insightHighlights,
}: HomeBottomSectionProps) {
  const jobs = [...spotlightJobs, ...DEMO_JOBS].slice(0, 3);
  const companies = DEMO_COMPANIES;
  const events = featuredEvents.length > 0 ? featuredEvents : DEMO_EVENTS;
  const policies = insightHighlights.length > 0 ? insightHighlights : DEMO_POLICIES;

  return (
    <section className="home-bottom-section">
      <Card className="home-push-card" padded={false}>
        <div className="home-push-card__header">
          <div className="home-push-card__title-row">
            <ZapIcon />
            <h3>为您精准推送</h3>
          </div>
          <button type="button" className="home-push-card__refresh">
            <RefreshCw size={14} />
            换一批
          </button>
        </div>
        <div className="home-push-card__jobs-row">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="home-push-card__job"
            >
              <div className="home-push-card__job-logo">
                {job.companyName?.slice(0, 1) || "?"}
              </div>
              <div className="home-push-card__job-info">
                <div className="home-push-card__job-top">
                  <strong>{job.title}</strong>
                  <span className="home-push-card__job-salary">
                    {"salary" in job ? String((job as Record<string, unknown>).salary) : job.tags?.[0] || "薪资面议"}
                  </span>
                </div>
                <span className="home-push-card__job-meta">
                  {job.companyName} · {job.workLocation}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="home-company-card" padded={false}>
        <div className="home-company-card__header">
          <div className="home-company-card__title-row">
            <Building2 size={16} />
            <h3>推荐企业</h3>
          </div>
          <button type="button" className="home-company-card__refresh">
            <RefreshCw size={14} />
            换一换
          </button>
        </div>
        <div className="home-company-card__row">
          {companies.map((company) => (
            <div key={company.id} className="home-company-card__item">
              <div className="home-company-card__top">
                <div className="home-company-card__logo">
                  {company.name.slice(0, 1)}
                </div>
                <div>
                  <strong>{company.name}</strong>
                  <span>{company.industry} · {company.city}</span>
                </div>
              </div>
              <p className="home-company-card__desc">{company.description}</p>
              <div className="home-company-card__tags">
                {company.tags.map((tag) => (
                  <span key={tag} className="home-company-card__tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="home-bottom-pair">
        <Card className="home-events-card" padded={false}>
          <div className="home-events-card__header">
            <div className="home-events-card__title-row">
              <CalendarDays size={16} />
              <h3>宣讲会信息</h3>
            </div>
            <Link href="/events" className="home-events-card__more">
              全部 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="home-events-card__list">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="home-events-card__item">
                <div className="home-events-card__logo">
                  {event.companyName?.slice(0, 1) || "讲"}
                </div>
                <div className="home-events-card__info">
                  <strong>{event.title}</strong>
                  <span>
                    <Clock size={11} style={{ verticalAlign: -1 }} /> {formatCompactDate(event.startAt)}
                    {"location" in event ? (
                      <>
                        {" · "}
                        <MapPin size={11} style={{ verticalAlign: -1 }} /> {(event as Record<string, unknown>).location as string}
                      </>
                    ) : (
                      ` · ${event.companyName}`
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="home-policy-card" padded={false}>
          <div className="home-policy-card__header">
            <div className="home-policy-card__title-row">
              <FileText size={16} />
              <h3>行业政策</h3>
            </div>
            <Link href="/insights" className="home-policy-card__more">
              全部 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="home-policy-card__list">
            {policies.map((item) => (
              <div key={item.id} className="home-policy-card__item">
                <div className="home-policy-card__dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  {item.href && item.actionLabel ? (
                    <Link href={item.href} className="home-policy-card__action">
                      {item.actionLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
