"use client";

import type { Job } from "@job-assistant/contracts/jobs";
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarClock, RefreshCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobAnalysisDrawer } from "@/features/jobs/job-analysis-drawer";
import { demoJobs } from "@/features/shared/demo-data";
import { getJob } from "@/lib/api/jobs";
import { ApiError } from "@/lib/api/client";
import { formatUserFacingError } from "@/lib/errors";

function formatDateTime(value: string | null) {
  if (!value) {
    return "长期开放";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function createInsight(job: Job) {
  if (job.requiredSkills.length > 0) {
    return `优先把 ${job.requiredSkills.slice(0, 2).join(" / ")} 这组关键词和对应项目结果显式放进简历摘要，会更容易让这条岗位的分析结果变稳。`;
  }

  return "建议先把岗位标题、摘要和最强项目做更强的一致化，再进入抽屉查看岗位分析。";
}

export function JobDetailPage({ jobId }: { jobId: string }) {
  const { status } = useAuthSession();
  const demoJob = demoJobs.find((item) => item.id === jobId) ?? null;
  const [job, setJob] = useState<Job | null>(demoJob);
  const [mode, setMode] = useState<"demo" | "live">(demoJob ? "demo" : "live");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadLiveJob = useEffectEvent(async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");
    setNotFound(false);

    try {
      const nextJob = await getJob(jobId);
      startTransition(() => {
        setJob(nextJob);
        setMode("live");
        setMessage("岗位详情已经切换为真实接口结果。");
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
        setJob(null);
        setErrorMessage("这个岗位不存在，或当前已经下线。");
      } else {
        setErrorMessage(formatUserFacingError(error, "岗位详情读取失败，请稍后再试。"));
      }
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!demoJob) {
      void loadLiveJob();
    }
  }, [demoJob]);

  if (!job) {
    return (
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>岗位详情</h1>
            <p>详情接口返回 `404` 时，会在这里展示正式空态，而不是把它包装成普通接口异常。</p>
          </div>
          <div className="page-header__actions">
            <Link href="/jobs" className="wa-button wa-button--ghost wa-button--md">
              <ArrowLeft size={16} />
              返回列表
            </Link>
          </div>
        </div>

        {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

        <Card className="feature-panel">
          <div className="empty-state">
            <strong>{notFound ? "岗位不存在或已下线" : "当前没有可展示的岗位详情"}</strong>
            <p>
              {notFound
                ? "后端已明确返回 `404`，所以这里应该作为详情空态处理。"
                : "如果这是一个真实岗位 ID，可以稍后再次尝试同步接口。"}
            </p>
            <div className="catalog-actions">
              <Link href="/jobs" className="wa-button wa-button--secondary wa-button--md">
                回岗位列表
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>岗位详情</h1>
          <p>岗位详情、简历分析和改写建议现在收在同一条正式链路里，不再停留在演示整合面板状态。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实岗位详情" : "当前展示演示详情"}
          </Badge>
          <Button variant="secondary" loading={loading} onClick={() => void loadLiveJob()}>
            <RefreshCcw size={16} />
            同步真实详情
          </Button>
          <Link href="/jobs" className="wa-button wa-button--ghost wa-button--md">
            <ArrowLeft size={16} />
            返回列表
          </Link>
        </div>
      </div>

      {message ? <div className="message-strip message-strip--success">{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

      <div className="detail-view-layout">
        <Card className="wa-card--hero" padded={false}>
          <div className="detail-hero">
            <div className="detail-hero__body">
              <Badge tone={job.isFeatured ? "info" : "neutral"}>{job.isFeatured ? "精选岗位" : job.companyName}</Badge>
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              <div className="tag-row">
                <span className="tag-pill">{job.workLocation}</span>
                {job.tags.map((tag) => (
                  <span className="tag-pill" key={`${job.id}-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="detail-hero__aside">
              <div className="channel-metric">
                <span>岗位热度</span>
                <strong>{job.popularity}</strong>
              </div>
              <div className="channel-metric">
                <span>截止时间</span>
                <strong>{job.deadline ? formatDate(job.deadline) : "长期"}</strong>
              </div>
            </div>
          </div>
        </Card>

        <div className="detail-view-grid">
          <Card className="job-detail">
            <div className="job-detail__hero">
              <div>
                <Badge tone="info">{job.companyName}</Badge>
                <h2>{job.title}</h2>
                <p className="job-detail__copy">{createInsight(job)}</p>
              </div>
              <Button size="lg" onClick={() => setDrawerOpen(true)}>
                <Sparkles size={16} />
                一键评估投递成功率
              </Button>
            </div>

            {status !== "authenticated" ? (
              <div className="panel-note panel-note--warning">
                <Sparkles size={16} />
                <span>未登录时可以先阅读岗位详情，但真实简历分析和改写建议需要登录后才能调用。</span>
              </div>
            ) : null}

            <div className="detail-grid">
              <Card className="analysis-panel">
                <div className="section-heading">
                  <div>
                    <h2>岗位要求</h2>
                    <p>把后端返回的关键要求收成清晰的可读块，方便用户先做自我判断。</p>
                  </div>
                  <BriefcaseBusiness size={18} color="hsl(var(--primary))" />
                </div>
                <div className="badge-wall">
                  {job.requiredSkills.map((skill) => (
                    <Badge key={skill} tone="info">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card className="analysis-panel">
                <div className="section-heading">
                  <div>
                    <h2>投递时间信息</h2>
                    <p>把最容易影响投递优先级的字段集中放在一个区域。</p>
                  </div>
                  <CalendarClock size={18} color="hsl(var(--primary))" />
                </div>
                <div className="bullet-stack">
                  <div className="list-item">
                    <div className="bullet-dot" />
                    <div>
                      <strong>发布时间</strong>
                      <span>{formatDate(job.publishedAt)}</span>
                    </div>
                  </div>
                  <div className="list-item">
                    <div className="bullet-dot" />
                    <div>
                      <strong>截止时间</strong>
                      <span>{formatDateTime(job.deadline)}</span>
                    </div>
                  </div>
                  <div className="list-item">
                    <div className="bullet-dot" />
                    <div>
                      <strong>工作地点</strong>
                      <span>{job.workLocation}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="analysis-panel">
              <div className="section-heading">
                <div>
                  <h2>投递提醒</h2>
                  <p>把岗位详情和后续动作连接起来，减少用户只看不动手的情况。</p>
                </div>
              </div>
              <ul className="checklist">
                <li>先保证简历标题、摘要与岗位方向一致。</li>
                <li>至少拿一个项目经历去映射这份岗位的核心技能要求。</li>
                <li>如果准备投递，建议先打开抽屉做一次岗位定向分析，再决定是否进一步改写简历。</li>
              </ul>
            </Card>
          </Card>

          <div className="page-stack">
            <Card className="feature-panel">
              <div className="section-heading">
                <div>
                  <h2>企业信息</h2>
                  <p>把岗位详情和企业详情串起来，避免用户在不同模块之间断层。</p>
                </div>
                <Building2 size={18} color="hsl(var(--primary))" />
              </div>
              <div className="tag-row">
                <span className="tag-pill">{job.companyName}</span>
                <span className="tag-pill">{job.companyIndustry}</span>
              </div>
              <div className="catalog-actions">
                <Link href={`/companies/${job.companyId}`} className="wa-button wa-button--secondary wa-button--md">
                  查看企业详情
                </Link>
              </div>
            </Card>

            <Card className="feature-panel">
              <div className="section-heading">
                <div>
                  <h2>继续浏览</h2>
                  <p>这块保留为后续串首页、活动和日程入口的稳定区位。</p>
                </div>
              </div>
              <div className="catalog-actions">
                <Link href="/jobs" className="wa-button wa-button--secondary wa-button--md">
                  回岗位列表
                </Link>
                <Link href="/events" className="wa-button wa-button--secondary wa-button--md">
                  看近期活动
                </Link>
                <Link href="/schedule" className="wa-button wa-button--primary wa-button--md">
                  去安排日程
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <JobAnalysisDrawer job={job} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
