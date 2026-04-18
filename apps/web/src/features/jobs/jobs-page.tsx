"use client";

import type { Job, JobListQuery } from "@job-assistant/contracts/jobs";
import { BriefcaseBusiness, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffectEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CatalogPagination } from "@/features/catalog/catalog-pagination";
import { buildDemoPaginatedResponse, formatCompactDate, includesText } from "@/features/catalog/catalog-helpers";
import { demoJobs } from "@/features/shared/demo-data";
import { listJobs } from "@/lib/api/jobs";
import { formatUserFacingError } from "@/lib/errors";

const cityOptions = ["全部", "上海", "杭州", "深圳", "北京", "广州"];
const industryOptions = ["全部", "AI 产品", "企业服务", "互联网平台", "教育科技", "新消费", "数据智能"];

const defaultFilters: JobListQuery = {
  page: 1,
  limit: 6,
  city: "",
  industry: "",
  keyword: "",
  featuredOnly: false,
};

type JobsResponse = Awaited<ReturnType<typeof listJobs>>;

function getJobCity(job: Job) {
  return job.workLocation.split(/[·\-]/)[0] ?? job.workLocation;
}

function getDemoJobsResponse(filters: JobListQuery) {
  const filtered = demoJobs.filter((job) => {
    if (filters.city && getJobCity(job) !== filters.city) {
      return false;
    }

    if (filters.industry && job.companyIndustry !== filters.industry) {
      return false;
    }

    if (filters.featuredOnly && !job.isFeatured) {
      return false;
    }

    const keyword = filters.keyword ?? "";
    return (
      includesText(job.title, keyword) ||
      includesText(job.companyName, keyword) ||
      includesText(job.companyIndustry, keyword) ||
      includesText(job.description, keyword) ||
      job.tags.some((tag) => includesText(tag, keyword)) ||
      job.requiredSkills.some((skill) => includesText(skill, keyword))
    );
  });

  return buildDemoPaginatedResponse(filtered, filters.page, filters.limit);
}

function createInsight(job: Job) {
  if (job.requiredSkills.length > 0) {
    return `优先围绕 ${job.requiredSkills.slice(0, 2).join(" / ")} 组织你的简历亮点，会更贴近这条岗位。`;
  }

  return "建议先把岗位关键词、项目结果和目标岗位标题统一起来，再进入详细分析。";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("")
    .toUpperCase();
}

export function JobsPage() {
  const [filters, setFilters] = useState<JobListQuery>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<JobListQuery>(defaultFilters);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [liveResponse, setLiveResponse] = useState<JobsResponse | null>(null);

  const demoResponse = getDemoJobsResponse(appliedFilters);
  const response = mode === "live" && liveResponse ? liveResponse : demoResponse;
  const featuredCount = response.data.filter((job) => job.isFeatured).length;
  const averagePopularity =
    response.data.length > 0
      ? Math.round(response.data.reduce((total, job) => total + job.popularity, 0) / response.data.length)
      : 0;

  const syncLive = useEffectEvent(async (nextFilters: JobListQuery = appliedFilters) => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const nextResponse = await listJobs(nextFilters);
      startTransition(() => {
        setLiveResponse(nextResponse);
        setAppliedFilters(nextFilters);
        setMode("live");
        setMessage("岗位列表已经切换到真实接口结果。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "岗位列表同步失败，暂时先保留演示内容。"));
    } finally {
      setLoading(false);
    }
  });

  function applyFilters() {
    const nextFilters = {
      ...filters,
      page: 1,
    };

    setAppliedFilters(nextFilters);
    setMessage("");
    setErrorMessage("");

    if (mode === "live") {
      void syncLive(nextFilters);
    }
  }

  function resetToDemo() {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setLiveResponse(null);
    setMode("demo");
    setLoading(false);
    setMessage("");
    setErrorMessage("");
  }

  function goToPage(page: number) {
    const nextFilters = {
      ...appliedFilters,
      page,
    };

    setAppliedFilters(nextFilters);

    if (mode === "live") {
      void syncLive(nextFilters);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>岗位列表</h1>
          <p>这里已经从演示整合页切换成正式列表页。筛选、分页、空态和详情跳转都按后端契约收口，分析抽屉留到岗位详情页里展开。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实岗位数据" : "当前展示演示岗位"}
          </Badge>
          <Button variant="secondary" loading={loading} onClick={() => void syncLive()}>
            <RefreshCcw size={16} />
            同步真实列表
          </Button>
          {mode === "live" ? (
            <Button variant="ghost" onClick={resetToDemo}>
              回到演示态
            </Button>
          ) : null}
        </div>
      </div>

      {message ? <div className="message-strip message-strip--success">{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

      <div className="schedule-summary-grid">
        <Card className="summary-card">
          <span className="summary-card__label">当前结果</span>
          <strong>{response.pagination.total}</strong>
          <p>符合当前筛选条件的岗位总量。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">精选岗位</span>
          <strong>{featuredCount}</strong>
          <p>适合作为首页稳定曝光位或重点投递列表的岗位数量。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">平均热度</span>
          <strong>{averagePopularity}</strong>
          <p>基于本页岗位 `popularity` 的粗略均值，帮助用户快速判断窗口活跃度。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">当前城市</span>
          <strong>{(appliedFilters.city as string) || "全部"}</strong>
          <p>当前筛选仍保持与后端 query 语义一致，后续可平滑扩展为多选。</p>
        </Card>
      </div>

      <div className="catalog-layout">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>筛选器</h2>
              <p>岗位页现在支持城市、行业、关键词和精选态筛选，空结果会作为正式筛选空态处理。</p>
            </div>
            <Search size={18} color="hsl(var(--primary))" />
          </div>

          <div className="catalog-filter-stack">
            <label className="field-group">
              <span className="field-label">关键词</span>
              <Input
                value={filters.keyword ?? ""}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                placeholder="搜索岗位、公司、行业或技能"
              />
            </label>

            <div className="field-group">
              <span className="field-label">城市</span>
              <div className="choice-row">
                {cityOptions.map((city) => {
                  const active = (filters.city as string) === (city === "全部" ? "" : city);
                  return (
                    <button
                      key={city}
                      type="button"
                      className={`choice-toggle${active ? " choice-toggle--active" : ""}`}
                      onClick={() => setFilters((current) => ({ ...current, city: city === "全部" ? "" : city }))}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">行业</span>
              <div className="choice-row">
                {industryOptions.map((industry) => {
                  const active = (filters.industry as string) === (industry === "全部" ? "" : industry);
                  return (
                    <button
                      key={industry}
                      type="button"
                      className={`choice-toggle${active ? " choice-toggle--active" : ""}`}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          industry: industry === "全部" ? "" : industry,
                        }))
                      }
                    >
                      {industry}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="choice-row">
              <button
                type="button"
                className={`choice-toggle${filters.featuredOnly ? " choice-toggle--active" : ""}`}
                onClick={() => setFilters((current) => ({ ...current, featuredOnly: !current.featuredOnly }))}
              >
                仅看精选岗位
              </button>
            </div>

            <div className="catalog-actions">
              <Button onClick={applyFilters}>应用筛选</Button>
              <Button variant="secondary" onClick={resetToDemo}>
                重置到默认状态
              </Button>
            </div>
          </div>
        </Card>

        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>岗位结果</h2>
              <p>点击任一岗位后会进入正式详情页，再从详情页进入简历分析抽屉。</p>
            </div>
            <BriefcaseBusiness size={18} color="hsl(var(--primary))" />
          </div>

          {response.data.length === 0 ? (
            <div className="empty-state">
              <strong>当前筛选下没有岗位结果</strong>
              <p>这是正常筛选空态，不是接口异常。可以放宽城市、行业或关键词后继续浏览。</p>
            </div>
          ) : (
            <div className="catalog-grid catalog-grid--companies">
              {response.data.map((job) => (
                <article className="catalog-card" key={job.id}>
                  <div className="catalog-card__top">
                    <div style={{ display: "flex", gap: 12 }}>
                      <div className="logo-chip">{getInitials(job.companyName)}</div>
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
                        <span>{createInsight(job)}</span>
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
            onPageChange={goToPage}
          />
        </Card>
      </div>
    </div>
  );
}
