"use client";

import { ArrowLeft, Building2, MapPin, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoCompanies } from "@/features/shared/demo-data";
import { getCompany } from "@/lib/api/companies";
import { ApiError } from "@/lib/api/client";
import { formatUserFacingError } from "@/lib/errors";

function formatUpdatedAt(value?: string) {
  if (!value) {
    return "暂无更新时间";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CompanyDetailPage({ companyId }: { companyId: string }) {
  const demoCompany = demoCompanies.find((item) => item.id === companyId) ?? null;
  const [company, setCompany] = useState(demoCompany);
  const [mode, setMode] = useState<"demo" | "live">(demoCompany ? "demo" : "live");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  const loadLiveCompany = useEffectEvent(async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");
    setNotFound(false);

    try {
      const nextCompany = await getCompany(companyId);
      startTransition(() => {
        setCompany(nextCompany);
        setMode("live");
        setMessage("企业详情已经切换为真实接口结果。");
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
        setCompany(null);
        setErrorMessage("这个企业不存在，或当前已经下线。");
      } else {
        setErrorMessage(formatUserFacingError(error, "企业详情读取失败，请稍后再试。"));
      }
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!demoCompany) {
      void loadLiveCompany();
    }
  }, [demoCompany]);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>企业详情</h1>
          <p>如果企业来自演示数据，会先展示蓝白系详情骨架；点击同步后即可切换到真实企业信息。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实企业详情" : "当前展示演示详情"}
          </Badge>
          <Button variant="secondary" loading={loading} onClick={() => void loadLiveCompany()}>
            <RefreshCcw size={16} />
            同步真实详情
          </Button>
          <Link href="/companies" className="wa-button wa-button--ghost wa-button--md">
            <ArrowLeft size={16} />
            返回列表
          </Link>
        </div>
      </div>

      {message ? <div className="message-strip message-strip--success">{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

      {!company ? (
        <Card className="feature-panel">
          <div className="empty-state">
            <strong>{notFound ? "企业不存在或已下线" : "当前没有可展示的企业详情"}</strong>
            <p>
              {notFound
                ? "后端返回了 404，这种情况应该作为正式空态处理，而不是笼统显示成接口异常。"
                : "如果这是一个真实企业 ID，可以点击右上角按钮再次尝试同步。"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="detail-view-layout">
          <Card className="wa-card--hero" padded={false}>
            <div className="detail-hero">
              <div className="detail-hero__body">
                <Badge tone={company.isFeatured ? "info" : "neutral"}>
                  {company.isFeatured ? "精选企业位" : "企业档案"}
                </Badge>
                <h2>{company.name}</h2>
                <p>{company.description}</p>
                <div className="tag-row">
                  <span className="tag-pill">{company.industry}</span>
                  <span className="tag-pill">{company.city}</span>
                </div>
              </div>
              <div className="detail-hero__aside">
                <div className="channel-metric">
                  <span>所在城市</span>
                  <strong>{company.city}</strong>
                </div>
                <div className="channel-metric">
                  <span>行业方向</span>
                  <strong>{company.industry}</strong>
                </div>
              </div>
            </div>
          </Card>

          <div className="detail-view-grid">
            <Card className="feature-panel">
              <div className="section-heading">
                <div>
                  <h2>企业简介</h2>
                  <p>当前 contract 只提供核心介绍字段，后续若后端补充更多信息，可在这里扩展板块。</p>
                </div>
                <Building2 size={18} color="hsl(var(--primary))" />
              </div>

              <p className="feature-panel__copy">{company.description}</p>

              <div className="bullet-stack">
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>城市</strong>
                    <span>{company.city}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>行业</strong>
                    <span>{company.industry}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>更新时间</strong>
                    <span>{formatUpdatedAt(company.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="page-stack">
              <Card className="feature-panel">
                <div className="section-heading">
                  <div>
                    <h2>对齐提示</h2>
                    <p>企业详情与首页精选企业使用同一数据模型，前端不要拆成两套结构。</p>
                  </div>
                </div>

                <div className="panel-note">
                  <MapPin size={16} />
                  <div>如果后端未来补充官网、规模或岗位列表，建议继续以卡片分区形式渐进扩展，而不是推翻当前骨架。</div>
                </div>
              </Card>

              <Card className="feature-panel">
                <div className="section-heading">
                  <div>
                    <h2>继续浏览</h2>
                    <p>把企业、活动和岗位之间的浏览关系逐步串起来，避免首页成为唯一入口。</p>
                  </div>
                </div>

                <div className="catalog-actions">
                  <Link href="/companies" className="wa-button wa-button--secondary wa-button--md">
                    回企业列表
                  </Link>
                  <Link href="/events" className="wa-button wa-button--secondary wa-button--md">
                    看近期活动
                  </Link>
                  <Link href="/jobs" className="wa-button wa-button--primary wa-button--md">
                    回岗位页
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
