"use client";

import type { CompanyListQuery } from "@job-assistant/contracts/companies";
import { Building2, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffectEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CatalogPagination } from "@/features/catalog/catalog-pagination";
import { buildDemoPaginatedResponse, includesText } from "@/features/catalog/catalog-helpers";
import { demoCompanies } from "@/features/shared/demo-data";
import { listCompanies } from "@/lib/api/companies";
import { formatUserFacingError } from "@/lib/errors";

const cityOptions = ["全部", "上海", "杭州", "深圳", "北京", "广州"];
const industryOptions = ["全部", "AI 产品", "企业服务", "互联网平台", "教育科技", "新消费", "数据智能"];

const defaultFilters: CompanyListQuery = {
  page: 1,
  limit: 6,
  city: "",
  industry: "",
  keyword: "",
  featuredOnly: false,
};

type CompaniesResponse = Awaited<ReturnType<typeof listCompanies>>;

function getDemoCompaniesResponse(filters: CompanyListQuery) {
  const filtered = demoCompanies.filter((company) => {
    if (filters.city && company.city !== filters.city) {
      return false;
    }

    if (filters.industry && company.industry !== filters.industry) {
      return false;
    }

    if (filters.featuredOnly && !company.isFeatured) {
      return false;
    }

    return (
      includesText(company.name, filters.keyword ?? "") ||
      includesText(company.description, filters.keyword ?? "") ||
      includesText(company.industry, filters.keyword ?? "")
    );
  });

  return buildDemoPaginatedResponse(filtered, filters.page, filters.limit);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("")
    .toUpperCase();
}

export function CompaniesPage() {
  const [filters, setFilters] = useState<CompanyListQuery>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<CompanyListQuery>(defaultFilters);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [liveResponse, setLiveResponse] = useState<CompaniesResponse | null>(null);

  const demoResponse = getDemoCompaniesResponse(appliedFilters);
  const response = mode === "live" && liveResponse ? liveResponse : demoResponse;
  const activeCompanies = response.data;
  const featuredCount = response.data.filter((company) => company.isFeatured).length;

  const syncLive = useEffectEvent(async (nextFilters: CompanyListQuery = appliedFilters) => {
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextResponse = await listCompanies(nextFilters);
      startTransition(() => {
        setLiveResponse(nextResponse);
        setAppliedFilters(nextFilters);
        setMode("live");
        setMessage("企业列表已经切换到真实接口结果。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "企业列表同步失败，暂时先保留演示数据。"));
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
          <h1>企业列表</h1>
          <p>按城市、行业和关键词浏览企业画像。列表和详情都与后端 contract 保持一致，不在前端私自扩展新的核心字段。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实企业数据" : "当前展示演示企业"}
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
          <p>符合当前筛选条件的企业数量。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">本页精选</span>
          <strong>{featuredCount}</strong>
          <p>当前页中带精选标识的企业位，适合做稳定曝光。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">筛选城市</span>
          <strong>{(appliedFilters.city as string) || "全部"}</strong>
          <p>支持后端的城市筛选语义，但当前视觉上先提供单值快速切换。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">筛选行业</span>
          <strong>{(appliedFilters.industry as string) || "全部"}</strong>
          <p>保持行业筛选入口清晰可见，便于后续扩成多选。</p>
        </Card>
      </div>

      <div className="catalog-layout">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>筛选器</h2>
              <p>当前版本先用关键词 + 单值快捷筛选，后续如后端需要可平滑扩展为多选。</p>
            </div>
            <Search size={18} color="hsl(var(--primary))" />
          </div>

          <div className="catalog-filter-stack">
            <label className="field-group">
              <span className="field-label">关键词</span>
              <Input
                value={filters.keyword ?? ""}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                placeholder="搜索企业名、行业或描述关键词"
              />
            </label>

            <div className="field-group">
              <span className="field-label">目标城市</span>
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
              <span className="field-label">行业方向</span>
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
                仅看精选企业
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

        <div className="page-stack">
          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>企业结果</h2>
                <p>企业详情页已经补上，点击任一企业卡片即可进入完整信息页。</p>
              </div>
              <Building2 size={18} color="hsl(var(--primary))" />
            </div>

            {activeCompanies.length === 0 ? (
              <div className="empty-state">
                <strong>当前筛选下没有企业结果</strong>
                <p>这属于正常空态，不代表接口异常。可以放宽城市或行业条件后再试。</p>
              </div>
            ) : (
              <div className="catalog-grid catalog-grid--companies">
                {activeCompanies.map((company) => (
                  <article className="catalog-card" key={company.id}>
                    <div className="catalog-card__top">
                      <div style={{ display: "flex", gap: 12 }}>
                        <div className="logo-chip">{getInitials(company.name)}</div>
                        <div className="recommend-card__company">
                          <strong>{company.name}</strong>
                          <span>
                            {company.industry} · {company.city}
                          </span>
                        </div>
                      </div>
                      {company.isFeatured ? <Badge tone="info">精选企业</Badge> : null}
                    </div>
                    <p className="catalog-card__copy">{company.description}</p>
                    <div className="tag-row">
                      <span className="tag-pill">{company.industry}</span>
                      <span className="tag-pill">{company.city}</span>
                    </div>
                    <div className="catalog-card__footer">
                      <span className="small-copy">进入详情页查看完整企业介绍</span>
                      <Link href={`/companies/${company.id}`} className="wa-button wa-button--secondary wa-button--sm">
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
    </div>
  );
}
