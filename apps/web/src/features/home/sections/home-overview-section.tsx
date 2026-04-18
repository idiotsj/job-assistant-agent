import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { HomeDashboardData, HomeSourceMode } from "../types";
import { formatCompactDate, formatTimelineDate, getScheduleSourceLabel } from "../utils";

interface HomeOverviewSectionProps {
  recommendation: HomeDashboardData["recommendation"];
  recommendationMode: HomeSourceMode;
  featuredJobs: HomeDashboardData["featuredJobs"];
  todayContentMode: HomeSourceMode;
  featuredCompany: HomeDashboardData["featuredCompany"];
  profile: HomeDashboardData["profile"];
  profileMode: HomeSourceMode;
  profileNeedsAttention: boolean;
  timelinePreview: HomeDashboardData["timelinePreview"];
  scheduleMode: HomeSourceMode;
  actionChecklist: HomeDashboardData["actionChecklist"];
}

export function HomeOverviewSection({
  recommendation,
  recommendationMode,
  featuredJobs,
  todayContentMode,
  featuredCompany,
  profile,
  profileMode,
  profileNeedsAttention,
  timelinePreview,
  scheduleMode,
  actionChecklist,
}: HomeOverviewSectionProps) {
  return (
    <section className="spotlight-grid">
      <Card className="list-card">
        <div className="section-heading">
          <div>
            <h2>案例与活动侧写</h2>
            <p>把“别人怎么走通”与“你这周该去哪里”放在同一屏里看，并补上独立频道跳转。</p>
          </div>
          <Badge tone={recommendationMode === "live" ? "success" : "info"}>
            {recommendationMode === "live" ? "案例 / 活动：实时" : "案例 / 活动：演示"}
          </Badge>
        </div>

        <div className="list-stack">
          {recommendation.cases.length > 0 ? (
            recommendation.cases.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="bullet-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.reason}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>当前没有案例推荐</strong>
              <p>可以继续浏览全部案例，或先补画像让首页更容易召回相似路径。</p>
            </div>
          )}

          <hr className="divider" />

          {recommendation.events.length > 0 ? (
            recommendation.events.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="bullet-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.reason}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>当前没有活动推荐</strong>
              <p>如果活动区为空，可以去活动页查看更多城市与时间条件下的内容。</p>
            </div>
          )}
        </div>

        <div className="catalog-actions">
          <Link href="/cases" className="wa-button wa-button--secondary wa-button--sm">
            去看案例
          </Link>
          <Link href="/events" className="wa-button wa-button--secondary wa-button--sm">
            去看活动
          </Link>
        </div>
      </Card>

      <div className="page-stack">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>今日精选岗位</h2>
              <p>
                这里直接承接 <code>GET /api/daily-content/today</code> 的 <code>featuredJobs</code>，
                作为首页里的“今日内容块”。
              </p>
            </div>
            <div className="page-header__actions">
              <Badge tone={todayContentMode === "live" ? "success" : "info"}>
                {todayContentMode === "live" ? "today-content：实时" : "today-content：演示"}
              </Badge>
              <BriefcaseBusiness size={18} color="hsl(var(--primary))" />
            </div>
          </div>

          {featuredJobs.length > 0 ? (
            <div className="bullet-stack">
              {featuredJobs.map((job) => (
                <div className="list-item" key={job.id}>
                  <div className="bullet-dot" />
                  <div>
                    <strong>{job.title}</strong>
                    <span>
                      {job.companyName} · {job.workLocation} · 截止 {formatCompactDate(job.deadline)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>今天还没有精选岗位</strong>
              <p>如果同步成功后依然为空，可以把它理解为今天没有额外策展位，而不是接口异常。</p>
            </div>
          )}

          <div className="catalog-actions">
            <Link href="/jobs" className="wa-button wa-button--secondary wa-button--sm">
              去岗位列表
            </Link>
          </div>
        </Card>

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>精选企业</h2>
              <p>优先展示今日内容或首页推荐里带回来的精选企业，同时保留企业页跳转。</p>
            </div>
            <Building2 size={18} color="hsl(var(--primary))" />
          </div>

          {featuredCompany ? (
            <>
              <div className="tag-row">
                <Badge tone="info">{featuredCompany.name}</Badge>
                <span className="tag-pill">{featuredCompany.city}</span>
                <span className="tag-pill">{featuredCompany.industry}</span>
              </div>
              <p className="feature-panel__copy">{featuredCompany.description}</p>
              <div className="catalog-actions">
                <Link
                  href={`/companies/${featuredCompany.id}`}
                  className="wa-button wa-button--secondary wa-button--sm"
                >
                  查看企业详情
                </Link>
                <Link href="/companies" className="wa-button wa-button--ghost wa-button--sm">
                  浏览企业列表
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>当前没有精选企业</strong>
              <p>这通常意味着今天没有额外企业策展位，可以继续去企业页浏览完整档案。</p>
            </div>
          )}
        </Card>

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>画像摘要</h2>
              <p>让用户快速确认系统理解是否正确，也为首页空态提供“先去画像页”的自然跳转。</p>
            </div>
            <div className="page-header__actions">
              <Badge tone={profileMode === "live" ? "success" : "info"}>
                {profileMode === "live" ? "画像：实时" : "画像：演示"}
              </Badge>
              <GraduationCap size={18} color="hsl(var(--primary))" />
            </div>
          </div>

          <div className="bullet-stack">
            <div className="list-item">
              <div className="bullet-dot" />
              <div>
                <strong>{profile.university || "待补充院校"}</strong>
                <span>
                  {profile.major || "待补充专业"} · {profile.grade || "未填写年级"}
                </span>
              </div>
            </div>
            <div className="list-item">
              <div className="bullet-dot" />
              <div>
                <strong>目标岗位</strong>
                <span>{profile.preferredJobTypes.join(" / ") || "请在画像页补全意向岗位"}</span>
              </div>
            </div>
            <div className="list-item">
              <div className="bullet-dot" />
              <div>
                <strong>技能焦点</strong>
                <span>{profile.skills.join(" · ") || "尚未写入技能标签"}</span>
              </div>
            </div>
          </div>

          {profileNeedsAttention ? (
            <div className="panel-note panel-note--warning">
              <Sparkles size={16} />
              <span>
                画像还不够完整，首页推荐会继续可用，但更适合作为演示参考。补齐后再刷新会更接近真实投递偏好。
              </span>
            </div>
          ) : null}

          <div className="catalog-actions">
            <Link href="/profile" className="wa-button wa-button--primary wa-button--sm">
              去完善画像
            </Link>
          </div>
        </Card>

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>近期时间线</h2>
              <p>把日程能力嵌回首页，用更轻量的预览让用户立刻知道下一步时间节点。</p>
            </div>
            <div className="page-header__actions">
              <Badge tone={scheduleMode === "live" ? "success" : "info"}>
                {scheduleMode === "live" ? "时间线：实时" : "时间线：演示"}
              </Badge>
              <Clock3 size={18} color="hsl(var(--primary))" />
            </div>
          </div>

          {timelinePreview.length > 0 ? (
            <div className="timeline-list">
              {timelinePreview.map((item) => (
                <div className="list-item" key={item.id}>
                  <div className="bullet-dot" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {getScheduleSourceLabel(item.source)} · {formatTimelineDate(item.startAt)}
                      {item.city ? ` · ${item.city}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>当前没有时间线提醒</strong>
              <p>如果你已经登录但这里仍为空，说明当前还没有需要提醒的岗位、活动或自定义日程。</p>
            </div>
          )}

          <div className="catalog-actions">
            <Link href="/schedule" className="wa-button wa-button--primary wa-button--sm">
              去完整时间线
            </Link>
          </div>
        </Card>

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>近期建议动作</h2>
              <p>把首页里拿到的推荐、今日内容和时间线，直接转成真实下一步。</p>
            </div>
            <CalendarDays size={18} color="hsl(var(--primary))" />
          </div>

          <ul className="checklist">
            {actionChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
