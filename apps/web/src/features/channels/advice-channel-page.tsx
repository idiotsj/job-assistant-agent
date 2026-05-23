"use client";

import type { CivilServiceAdvice } from "@job-assistant/contracts/civil-service";
import type { PostgraduateAdvice } from "@job-assistant/contracts/postgraduate";
import { Compass, RefreshCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffectEvent, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUserFacingError } from "@/lib/errors";

type AdviceItem = PostgraduateAdvice | CivilServiceAdvice;
type AdviceMode = "demo" | "live";

interface AdviceChannelPageProps<T extends AdviceItem> {
  title: string;
  description: string;
  demoItems: T[];
  emptyCopy: string;
  channelLabel: string;
  targetLabel: string;
  helperCopy: string;
  actionHint: string;
  loadLive: () => Promise<T[]>;
  getTargets: (item: T) => string[];
}

function formatUpdateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdviceChannelPage<T extends AdviceItem>({
  title,
  description,
  demoItems,
  emptyCopy,
  channelLabel,
  targetLabel,
  helperCopy,
  actionHint,
  loadLive,
  getTargets,
}: AdviceChannelPageProps<T>) {
  const { status } = useAuthSession();
  const [items, setItems] = useState<T[]>(demoItems);
  const [mode, setMode] = useState<AdviceMode>("demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const targetCount = new Set(items.flatMap((item) => getTargets(item))).size;

  const syncLive = useEffectEvent(async () => {
    if (status !== "authenticated") {
      setErrorMessage("登录后才能获取与你画像真实关联的频道建议；当前仍保留演示内容供预览。");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextItems = await loadLive();
      startTransition(() => {
        setItems(nextItems);
        setMode("live");
        setMessage("频道建议已经切换为真实接口结果。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "同步真实频道建议失败，暂时先保留演示内容。"));
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实建议已接入" : "当前展示演示建议"}
          </Badge>
          {status === "authenticated" ? (
            <Button variant="secondary" loading={loading} onClick={() => void syncLive()}>
              <RefreshCcw size={16} />
              同步真实建议
            </Button>
          ) : (
            <Link href="/login" className="wa-button wa-button--secondary wa-button--md">
              登录后同步
            </Link>
          )}
        </div>
      </div>

      {message ? <div className="message-strip message-strip--success">{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

      <div className="channel-layout">
        <Card className="channel-hero wa-card--hero" padded={false}>
          <div className="channel-hero__inner">
            <div className="channel-hero__content">
              <Badge tone="info">
                <Sparkles size={14} />
                {channelLabel}
              </Badge>
              <h2>{helperCopy}</h2>
              <p>{actionHint}</p>
              <div className="tag-wall">
                {Array.from(
                  new Set(items.slice(0, 3).flatMap((item) => getTargets(item)))
                )
                  .slice(0, 6)
                  .map((target) => (
                    <span className="suggestion-chip" key={`${channelLabel}-${target}`}>
                      {target}
                    </span>
                  ))}
              </div>
            </div>
            <div className="channel-hero__aside">
              <div className="channel-metric">
                <span>当前建议条数</span>
                <strong>{items.length}</strong>
              </div>
              <div className="channel-metric">
                <span>{targetLabel}覆盖</span>
                <strong>{targetCount}</strong>
              </div>
              <div className="panel-note">
                <Compass size={16} />
                <div>{status === "authenticated" ? "登录态下建议会结合画像过滤。" : "未登录时先展示演示态，不会误导成真实个人结果。"}</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="channel-grid">
          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>建议列表</h2>
                <p>频道结果保持独立，不混进首页主推荐流。</p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <strong>当前没有匹配建议</strong>
                <p>{emptyCopy}</p>
              </div>
            ) : (
              <div className="channel-card-list">
                {items.map((item) => (
                  <article className="channel-card" key={item.id}>
                    <div className="channel-card__top">
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                      </div>
                      <Badge tone="info">更新于 {formatUpdateTime(item.updatedAt)}</Badge>
                    </div>

                    <div className="channel-card__targets">
                      <span className="summary-card__label">{targetLabel}</span>
                      <div className="tag-wall">
                        {getTargets(item).map((target) => (
                          <span className="tag-pill" key={`${item.id}-${target}`}>
                            {target}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ul className="checklist">
                      {item.actionItems.map((actionItem) => (
                        <li key={actionItem}>{actionItem}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <div className="page-stack">
            <Card className="feature-panel">
              <div className="section-heading">
                <div>
                  <h2>频道边界</h2>
                  <p>AI 这里只做辅助决策，不把频道建议包装成必须执行的唯一答案。</p>
                </div>
              </div>

              <div className="bullet-stack">
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>独立频道展示</strong>
                    <span>这部分建议只在频道页里展开，不和岗位推荐混在一起。</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>画像决定过滤</strong>
                    <span>真实联调时，后端会根据画像偏好返回更贴近你的建议。</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="bullet-dot" />
                  <div>
                    <strong>空态可被接受</strong>
                    <span>当画像不匹配或后端暂时没有建议时，前端必须能优雅处理空数组。</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
