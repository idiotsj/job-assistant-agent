import Link from "next/link";

import { CompanySpotlightCard, WeeklyScheduleBoard } from "@/components/blocks";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { HomeDashboardData, HomeDashboardStatus } from "../types";
import { formatCompactDate, formatTimelineDate, getScheduleSourceLabel } from "../utils";

interface HomeSecondaryGridSectionProps {
  featuredJobs: HomeDashboardData["featuredJobs"];
  featuredEvents: HomeDashboardData["featuredEvents"];
  featuredCompany: HomeDashboardData["featuredCompany"];
  timelinePreview: HomeDashboardData["timelinePreview"];
  profile: HomeDashboardData["profile"];
  profileNeedsAttention: HomeDashboardData["profileNeedsAttention"];
  actionChecklist: HomeDashboardData["actionChecklist"];
  insightHighlights: HomeDashboardData["insightHighlights"];
  modes: HomeDashboardStatus["modes"];
}

export function HomeSecondaryGridSection({
  featuredJobs,
  featuredEvents,
  featuredCompany,
  timelinePreview,
  profile,
  profileNeedsAttention,
  actionChecklist,
  insightHighlights,
  modes,
}: HomeSecondaryGridSectionProps) {
  return (
    <section className="home-secondary-grid">
      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>今日日程</h2>
            <p>先把最近时间节点摆出来，让首页先服务行动，而不是只服务浏览。</p>
          </div>
          <Badge tone={modes.schedule === "live" ? "success" : "info"}>
            {modes.schedule === "live" ? "日程：实时" : "日程：演示"}
          </Badge>
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
            <p>如果这里为空，说明暂时没有新的岗位、活动或自定义日程需要推进。</p>
          </div>
        )}

        <div className="catalog-actions">
          <Link href="/schedule" className="wa-button wa-button--secondary wa-button--sm">
            打开完整时间线
          </Link>
        </div>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>近期宣讲会</h2>
            <p>活动区优先展示离你最近、最值得投入时间判断的宣讲会或开放日。</p>
          </div>
          <Badge tone={modes.recommendation === "live" ? "success" : "info"}>
            {modes.recommendation === "live" ? "活动：实时" : "活动：演示"}
          </Badge>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="bullet-stack">
            {featuredEvents.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="bullet-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.companyName} · {item.city} · {formatCompactDate(item.startAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>当前没有宣讲会推荐</strong>
            <p>这属于正常空态，不代表异常。你仍然可以去活动页查看更多城市与时间条件。</p>
          </div>
        )}

        <div className="catalog-actions">
          <Link href="/events" className="wa-button wa-button--secondary wa-button--sm">
            去看活动页
          </Link>
        </div>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>每日企业推荐</h2>
            <p>优先展示首页已经拥有的精选企业，不在前端额外发明新的企业排序逻辑。</p>
          </div>
        </div>

        {featuredCompany ? (
          <>
            <CompanySpotlightCard
              companyName={featuredCompany.name}
              industry={`${featuredCompany.industry} · ${featuredCompany.city}`}
              highlight={featuredCompany.description}
              logoLetter={featuredCompany.name.slice(0, 1)}
              tags={[
                featuredCompany.industry,
                featuredCompany.city,
                featuredCompany.isFeatured ? "精选企业" : "企业推荐",
              ]}
            />
            <div className="catalog-actions">
              <Link href={`/companies/${featuredCompany.id}`} className="wa-button wa-button--secondary wa-button--sm">
                查看企业详情
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>当前没有企业推荐</strong>
            <p>可以先去企业页浏览完整档案，或等待首页实时同步拿到新的企业策展位。</p>
          </div>
        )}
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>画像摘要</h2>
            <p>先确认系统理解是否正确，再决定今天最值得推进的岗位或路径。</p>
          </div>
          <Badge tone={modes.profile === "live" ? "success" : "info"}>
            {modes.profile === "live" ? "画像：实时" : "画像：演示"}
          </Badge>
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
              <span>{profile.preferredJobTypes.join(" / ") || "请先补全目标岗位"}</span>
            </div>
          </div>
          <div className="list-item">
            <div className="bullet-dot" />
            <div>
              <strong>核心技能</strong>
              <span>{profile.skills.join(" · ") || "请先补全技能标签"}</span>
            </div>
          </div>
        </div>

        {profileNeedsAttention ? (
          <div className="panel-note panel-note--warning">
            <span>画像还不够完整，首页推荐仍可继续使用，但更适合作为演示参考。补齐后再刷新会更稳。</span>
          </div>
        ) : null}

        <div className="catalog-actions">
          <Link href="/profile" className="wa-button wa-button--primary wa-button--sm">
            去个人中心
          </Link>
        </div>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>每日建议</h2>
            <p>用统一来源的建议文案，把今天最值得推进的动作讲清楚。</p>
          </div>
        </div>
        <ul className="checklist">
          {actionChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>行业热点 / 政策解读</h2>
            <p>当前没有独立热点源时，这一块只做明确承载或空态，不伪造“实时资讯”。</p>
          </div>
        </div>

        <div className="home-insight-list">
          {insightHighlights.map((item) => (
            <div key={item.id} className="home-insight-list__item">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              {item.href && item.actionLabel ? (
                <Link href={item.href} className="wa-button wa-button--ghost wa-button--sm">
                  {item.actionLabel}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>周视图预览</h2>
            <p>组件已经就绪，先用轻量周视图把“近期节奏”建立起来。</p>
          </div>
        </div>
        <WeeklyScheduleBoard />
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>今日精选岗位</h2>
            <p>这里继续承接 `today-content` 的精选岗位，不在首页私自重算推荐结果。</p>
          </div>
          <Badge tone={modes.todayContent === "live" ? "success" : "info"}>
            {modes.todayContent === "live" ? "today-content：实时" : "today-content：演示"}
          </Badge>
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
            <p>同步成功后如果仍为空，可以把它理解为今天没有额外策展位，而不是接口异常。</p>
          </div>
        )}
      </Card>
    </section>
  );
}
