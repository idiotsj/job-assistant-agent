"use client";

import type { EventListQuery } from "@job-assistant/contracts/events";
import { CalendarDays, Clock3, MapPin, RefreshCcw } from "lucide-react";
import { startTransition, useEffectEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CatalogPagination } from "@/features/catalog/catalog-pagination";
import { buildDemoPaginatedResponse, formatDateTime } from "@/features/catalog/catalog-helpers";
import { demoCareerEvents } from "@/features/shared/demo-data";
import { listEvents } from "@/lib/api/events";
import { formatUserFacingError } from "@/lib/errors";

const cityOptions = ["全部", "上海", "杭州", "深圳", "北京", "广州"];

const defaultFilters: EventListQuery = {
  page: 1,
  limit: 4,
  city: "",
  upcomingOnly: true,
};

type EventsResponse = Awaited<ReturnType<typeof listEvents>>;

function getDemoEventsResponse(filters: EventListQuery) {
  const now = Date.now();
  const filtered = demoCareerEvents.filter((item) => {
    if (filters.city && item.city !== filters.city) {
      return false;
    }

    if (filters.upcomingOnly && new Date(item.startAt).getTime() < now) {
      return false;
    }

    return true;
  });

  return buildDemoPaginatedResponse(filtered, filters.page, filters.limit);
}

function formatTimeRange(startAt: string, endAt: string | null) {
  if (!endAt) {
    return formatDateTime(startAt);
  }

  return `${formatDateTime(startAt)} - ${formatDateTime(endAt)}`;
}

export function EventsPage() {
  const [filters, setFilters] = useState<EventListQuery>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<EventListQuery>(defaultFilters);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [liveResponse, setLiveResponse] = useState<EventsResponse | null>(null);

  const demoResponse = getDemoEventsResponse(appliedFilters);
  const response = mode === "live" && liveResponse ? liveResponse : demoResponse;
  const deadlineCount = response.data.filter((item) => item.registrationDeadline).length;
  const featuredCount = response.data.filter((item) => item.isFeatured).length;

  const syncLive = useEffectEvent(async (nextFilters: EventListQuery = appliedFilters) => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const nextResponse = await listEvents(nextFilters);
      startTransition(() => {
        setLiveResponse(nextResponse);
        setAppliedFilters(nextFilters);
        setMode("live");
        setMessage("活动列表已经切换到真实接口结果。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "活动列表同步失败，暂时先保留演示内容。"));
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
          <h1>活动 / 宣讲会</h1>
          <p>活动页保持“时间与地点优先”的浏览逻辑，适合作为列表页，也为后续日历式展示保留升级空间。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实活动数据" : "当前展示演示活动"}
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
          <span className="summary-card__label">当前活动数</span>
          <strong>{response.pagination.total}</strong>
          <p>符合当前筛选条件的活动数量。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">带报名截止</span>
          <strong>{deadlineCount}</strong>
          <p>这部分活动更适合进入首页提醒或时间线聚合。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">精选活动</span>
          <strong>{featuredCount}</strong>
          <p>适合作为首页活动分区的稳定曝光位。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">城市筛选</span>
          <strong>{(appliedFilters.city as string) || "全部"}</strong>
          <p>当前活动页保留城市和 upcoming 两个核心筛选入口。</p>
        </Card>
      </div>

      <div className="catalog-layout">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>筛选器</h2>
              <p>优先保留城市和“仅看未来活动”两个后端已稳定的 query 字段。</p>
            </div>
            <CalendarDays size={18} color="hsl(var(--primary))" />
          </div>

          <div className="catalog-filter-stack">
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

            <div className="choice-row">
              <button
                type="button"
                className={`choice-toggle${filters.upcomingOnly ? " choice-toggle--active" : ""}`}
                onClick={() => setFilters((current) => ({ ...current, upcomingOnly: !current.upcomingOnly }))}
              >
                仅看未来活动
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
              <h2>活动结果</h2>
              <p>这一版先提供清晰的时间卡片流，后续如果要做时间轴或日历视图，可以在这层之上继续扩展。</p>
            </div>
          </div>

          {response.data.length === 0 ? (
            <div className="empty-state">
              <strong>当前筛选下没有活动</strong>
              <p>说明暂时没有匹配的未来活动或城市结果，这属于正常空态。</p>
            </div>
          ) : (
            <div className="event-feed">
              {response.data.map((item) => (
                <article className="catalog-card catalog-card--event" key={item.id}>
                  <div className="catalog-card__top">
                    <div>
                      <h3>{item.title}</h3>
                      <p className="catalog-card__copy">{item.description}</p>
                    </div>
                    <Badge tone={item.isFeatured ? "info" : "neutral"}>
                      {item.isFeatured ? "精选活动" : item.companyIndustry}
                    </Badge>
                  </div>

                  <div className="tag-row">
                    <span className="tag-pill">{item.companyName}</span>
                    <span className="tag-pill">{item.companyIndustry}</span>
                    <span className="tag-pill">{item.city}</span>
                  </div>

                  <div className="event-meta-grid">
                    <div className="event-meta-item">
                      <Clock3 size={16} />
                      <div>
                        <strong>活动时间</strong>
                        <span>{formatTimeRange(item.startAt, item.endAt)}</span>
                      </div>
                    </div>
                    <div className="event-meta-item">
                      <MapPin size={16} />
                      <div>
                        <strong>活动城市</strong>
                        <span>{item.city}</span>
                      </div>
                    </div>
                    <div className="event-meta-item">
                      <CalendarDays size={16} />
                      <div>
                        <strong>报名截止</strong>
                        <span>{item.registrationDeadline ? formatDateTime(item.registrationDeadline) : "当前未提供截止时间"}</span>
                      </div>
                    </div>
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
