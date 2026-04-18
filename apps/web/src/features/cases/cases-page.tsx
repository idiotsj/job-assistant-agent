"use client";

import type { CaseListQuery } from "@job-assistant/contracts/cases";
import { BookOpen, RefreshCcw } from "lucide-react";
import { startTransition, useEffectEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CatalogPagination } from "@/features/catalog/catalog-pagination";
import { buildDemoPaginatedResponse, formatCompactDate, includesText } from "@/features/catalog/catalog-helpers";
import { demoStudentCases } from "@/features/shared/demo-data";
import { listCases } from "@/lib/api/cases";
import { formatUserFacingError } from "@/lib/errors";

const careerOptions = ["全部", "前端开发", "产品经理", "运营分析"];
const majorOptions = ["全部", "信息管理与信息系统", "工商管理", "统计学", "新闻传播学", "计算机科学与技术"];

const defaultFilters: CaseListQuery = {
  page: 1,
  limit: 4,
  careerPath: "",
  major: "",
};

type CasesResponse = Awaited<ReturnType<typeof listCases>>;

function getDemoCasesResponse(filters: CaseListQuery) {
  const filtered = demoStudentCases.filter((item) => {
    if (filters.careerPath && item.careerPath !== filters.careerPath) {
      return false;
    }

    if (filters.major && item.backgroundMajor !== filters.major) {
      return false;
    }

    return true;
  });

  return buildDemoPaginatedResponse(filtered, filters.page, filters.limit);
}

export function CasesPage() {
  const [filters, setFilters] = useState<CaseListQuery>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<CaseListQuery>(defaultFilters);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [liveResponse, setLiveResponse] = useState<CasesResponse | null>(null);

  const demoResponse = getDemoCasesResponse(appliedFilters);
  const response = mode === "live" && liveResponse ? liveResponse : demoResponse;
  const featuredCount = response.data.filter((item) => item.isFeatured).length;
  const majorCoverage = new Set(response.data.map((item) => item.backgroundMajor)).size;

  const syncLive = useEffectEvent(async (nextFilters: CaseListQuery = appliedFilters) => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const nextResponse = await listCases(nextFilters);
      startTransition(() => {
        setLiveResponse(nextResponse);
        setAppliedFilters(nextFilters);
        setMode("live");
        setMessage("案例列表已经切到真实接口结果。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "案例列表同步失败，暂时先保留演示内容。"));
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
          <h1>学生案例</h1>
          <p>案例页只消费纯 `StudentCase[]` 分页结果，不把首页推荐里额外附带的 `score / reason / source` 混进来。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实案例数据" : "当前展示演示案例"}
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
          <span className="summary-card__label">当前案例数</span>
          <strong>{response.pagination.total}</strong>
          <p>符合当前筛选条件的案例总量。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">精选案例</span>
          <strong>{featuredCount}</strong>
          <p>适合后续首页和频道页做稳定引用的案例内容。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">专业覆盖</span>
          <strong>{majorCoverage}</strong>
          <p>当前页案例涉及的背景专业种类。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">目标路径</span>
          <strong>{appliedFilters.careerPath || "全部"}</strong>
          <p>案例页适合帮助用户快速找到“和我像的人是怎么走通的”。</p>
        </Card>
      </div>

      <div className="catalog-layout">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>筛选器</h2>
              <p>当前版本优先保留和后端一致的职业路径、专业两个入口。</p>
            </div>
            <BookOpen size={18} color="hsl(var(--primary))" />
          </div>

          <div className="catalog-filter-stack">
            <div className="field-group">
              <span className="field-label">职业路径</span>
              <div className="choice-row">
                {careerOptions.map((career) => {
                  const active = filters.careerPath === (career === "全部" ? "" : career);
                  return (
                    <button
                      key={career}
                      type="button"
                      className={`choice-toggle${active ? " choice-toggle--active" : ""}`}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          careerPath: career === "全部" ? "" : career,
                        }))
                      }
                    >
                      {career}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">背景专业</span>
              <div className="choice-row">
                {majorOptions.map((major) => {
                  const active = filters.major === (major === "全部" ? "" : major);
                  return (
                    <button
                      key={major}
                      type="button"
                      className={`choice-toggle${active ? " choice-toggle--active" : ""}`}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          major: major === "全部" ? "" : major,
                        }))
                      }
                    >
                      {major}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="field-group">
              <span className="field-label">补充搜索</span>
              <Input
                placeholder="这一版保留给后续扩展关键词搜索"
                value=""
                readOnly
              />
              <span className="field-help">当前后端 contract 里案例页只支持职业路径和专业筛选，所以这里先保留视觉占位，不伪造额外请求参数。</span>
            </label>

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
              <h2>案例结果</h2>
              <p>把案例写成“背景 → 目标方向 → 做法 → 结果”的轻叙事卡片，阅读负担会更低。</p>
            </div>
          </div>

          {response.data.length === 0 ? (
            <div className="empty-state">
              <strong>当前筛选下没有案例</strong>
              <p>这是正常空态。说明暂时没有匹配的职业路径或背景专业，不需要把它解释成接口异常。</p>
            </div>
          ) : (
            <div className="catalog-grid">
              {response.data.map((item) => (
                <article className="catalog-card catalog-card--story" key={item.id}>
                  <div className="catalog-card__top">
                    <div>
                      <h3>{item.title}</h3>
                      <p className="catalog-card__copy">{item.summary}</p>
                    </div>
                    <Badge tone={item.isFeatured ? "info" : "neutral"}>
                      {item.isFeatured ? "精选案例" : "案例"}
                    </Badge>
                  </div>

                  <div className="tag-row">
                    <span className="tag-pill">{item.careerPath}</span>
                    <span className="tag-pill">{item.backgroundMajor}</span>
                    {item.city ? <span className="tag-pill">{item.city}</span> : null}
                  </div>

                  <div className="bullet-stack">
                    <div className="list-item">
                      <div className="bullet-dot" />
                      <div>
                        <strong>适配路径</strong>
                        <span>{item.careerPath}</span>
                      </div>
                    </div>
                    <div className="list-item">
                      <div className="bullet-dot" />
                      <div>
                        <strong>背景专业</strong>
                        <span>{item.backgroundMajor}</span>
                      </div>
                    </div>
                    <div className="list-item">
                      <div className="bullet-dot" />
                      <div>
                        <strong>发布时间</strong>
                        <span>{formatCompactDate(item.publishedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="tag-row">
                    {item.tags.map((tag) => (
                      <span className="tag-pill" key={`${item.id}-${tag}`}>
                        {tag}
                      </span>
                    ))}
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
