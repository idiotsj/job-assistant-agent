"use client";

import type { ScheduleItem } from "@job-assistant/contracts/schedule";
import { CalendarClock, CalendarPlus2, Clock3, MapPin, PencilLine, RefreshCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffectEvent, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createScheduleItem,
  deleteScheduleItem,
  getScheduleTimeline,
  updateScheduleItem,
} from "@/lib/api/schedule";
import { formatUserFacingError } from "@/lib/errors";
import { demoScheduleItems } from "@/features/shared/demo-data";

type TimelineMode = "demo" | "live";

interface ScheduleFormState {
  title: string;
  startAt: string;
  endAt: string;
  city: string;
  description: string;
}

const initialFormState: ScheduleFormState = {
  title: "",
  startAt: "",
  endAt: "",
  city: "",
  description: "",
};

function sortTimeline(items: ScheduleItem[]) {
  return [...items].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
}

function toLocalDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function formatTimeRange(item: ScheduleItem) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const start = formatter.format(new Date(item.startAt));

  if (!item.endAt) {
    return start;
  }

  return `${start} - ${formatter.format(new Date(item.endAt))}`;
}

function getSourceLabel(source: ScheduleItem["source"]) {
  switch (source) {
    case "job":
      return "岗位节点";
    case "event":
      return "活动日程";
    case "exam":
      return "考试提醒";
    case "user":
      return "我的安排";
    default:
      return "时间线";
  }
}

function getSourceTone(source: ScheduleItem["source"]) {
  switch (source) {
    case "job":
      return "info" as const;
    case "event":
      return "neutral" as const;
    case "exam":
      return "warning" as const;
    case "user":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

function groupTimeline(items: ScheduleItem[]) {
  const grouped = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    const key = new Date(item.startAt).toISOString().slice(0, 10);
    const currentItems = grouped.get(key) ?? [];
    currentItems.push(item);
    grouped.set(key, currentItems);
  }

  return [...grouped.entries()].map(([dateKey, dayItems]) => ({
    dateKey,
    label: formatDayLabel(dayItems[0]?.startAt ?? dateKey),
    items: dayItems,
  }));
}

function createDraftItem(id: string, form: ScheduleFormState): ScheduleItem {
  return {
    id,
    title: form.title.trim(),
    source: "user",
    startAt: toIsoDateTime(form.startAt) ?? new Date().toISOString(),
    endAt: toIsoDateTime(form.endAt),
    city: form.city.trim() || null,
    description: form.description.trim(),
  };
}

export function SchedulePage() {
  const { status } = useAuthSession();
  const [timeline, setTimeline] = useState(() => sortTimeline(demoScheduleItems));
  const [mode, setMode] = useState<TimelineMode>("demo");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(initialFormState);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const groupedTimeline = groupTimeline(timeline);
  const upcomingItem = timeline[0] ?? null;
  const sourceCount = {
    user: timeline.filter((item) => item.source === "user").length,
    job: timeline.filter((item) => item.source === "job").length,
    event: timeline.filter((item) => item.source === "event").length,
    exam: timeline.filter((item) => item.source === "exam").length,
  };

  const syncTimeline = useEffectEvent(async () => {
    if (status !== "authenticated") {
      setErrorMessage("登录后才能同步真实日程；当前仍保留演示态，方便先确认界面效果。");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextTimeline = await getScheduleTimeline();
      startTransition(() => {
        setTimeline(sortTimeline(nextTimeline));
        setMode("live");
        setMessage("真实日程已经同步完成，聚合来源会按岗位、活动、考试和自定义事项分开展示。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "真实日程同步失败，暂时先保留演示时间线。"));
    } finally {
      setLoading(false);
    }
  });

  function resetComposer() {
    setEditingId(null);
    setForm(initialFormState);
  }

  function handleEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      startAt: toLocalDateTimeInput(item.startAt),
      endAt: toLocalDateTimeInput(item.endAt),
      city: item.city ?? "",
      description: item.description,
    });
  }

  async function handleDelete(item: ScheduleItem) {
    if (item.source !== "user") {
      return;
    }

    setErrorMessage("");
    setMessage("");

    if (mode === "live" && status === "authenticated") {
      try {
        await deleteScheduleItem(item.id);
        startTransition(() => {
          setTimeline((current) => current.filter((entry) => entry.id !== item.id));
          setMessage("这条自定义日程已经删除。");
        });
      } catch (error) {
        setErrorMessage(formatUserFacingError(error, "删除日程失败，请稍后再试。"));
      }

      return;
    }

    startTransition(() => {
      setTimeline((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("演示态下已删除这条日程，仅影响当前预览效果。");
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setMessage("");

    const startAt = toIsoDateTime(form.startAt);
    const endAt = toIsoDateTime(form.endAt);

    if (!form.title.trim() || !startAt) {
      setErrorMessage("标题和开始时间都需要先填写。");
      setSubmitting(false);
      return;
    }

    if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
      setErrorMessage("结束时间不能早于开始时间。");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      startAt,
      endAt,
      city: form.city.trim() || null,
      description: form.description.trim(),
    };

    try {
      if (mode === "live" && status === "authenticated") {
        const nextItem = editingId
          ? await updateScheduleItem(editingId, payload)
          : await createScheduleItem(payload);

        startTransition(() => {
          setTimeline((current) => {
            const nextTimeline = editingId
              ? current.map((item) => (item.id === nextItem.id ? nextItem : item))
              : [...current, nextItem];
            return sortTimeline(nextTimeline);
          });
          setMessage(editingId ? "日程已更新。" : "新的自定义日程已经加入时间线。");
        });
      } else {
        const draftItem = createDraftItem(editingId ?? `demo-user-${Date.now()}`, form);

        startTransition(() => {
          setTimeline((current) => {
            const nextTimeline = editingId
              ? current.map((item) => (item.id === editingId ? draftItem : item))
              : [...current, draftItem];
            return sortTimeline(nextTimeline);
          });
          setMessage(editingId ? "演示态下已更新日程预览。" : "演示态下已新增一条自定义日程。");
        });
      }

      resetComposer();
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "日程保存失败，请稍后再试。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>日程时间线</h1>
          <p>
            把岗位截止时间、活动安排、考试提醒和你自己新增的事项放进同一条时间线上看，但编辑权限只开放给
            <code> user </code>
            来源。
          </p>
        </div>
        <div className="page-header__actions">
          <Badge tone={mode === "live" ? "success" : "info"}>
            {mode === "live" ? "真实日程已同步" : "当前展示演示时间线"}
          </Badge>
          {status === "authenticated" ? (
            <Button variant="secondary" loading={loading} onClick={() => void syncTimeline()}>
              <RefreshCcw size={16} />
              同步真实日程
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

      <div className="schedule-summary-grid">
        <Card className="summary-card">
          <span className="summary-card__label">下一条节点</span>
          <strong>{upcomingItem ? upcomingItem.title : "暂无时间线内容"}</strong>
          <p>
            {upcomingItem
              ? `${formatDayLabel(upcomingItem.startAt)} · ${formatTimeRange(upcomingItem)}`
              : "新用户或空画像下，时间线可能为空。"}
          </p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">可编辑事项</span>
          <strong>{sourceCount.user}</strong>
          <p>仅自定义日程允许编辑和删除，聚合项只展示来源信息。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">求职节点</span>
          <strong>{sourceCount.job + sourceCount.event}</strong>
          <p>岗位截止和活动时间统一收束在这里，不再分散查找。</p>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">考试提醒</span>
          <strong>{sourceCount.exam}</strong>
          <p>升学或考公相关提醒以独立考试来源进入时间线，不混入首页主推荐流。</p>
        </Card>
      </div>

      <div className="schedule-layout">
        <Card className="schedule-panel">
          <div className="section-heading">
            <div>
              <h2>聚合时间线</h2>
              <p>真实联调时由后端统一聚合，前端只负责按来源清晰呈现，不自行重排建模。</p>
            </div>
            <CalendarClock size={18} color="hsl(var(--primary))" />
          </div>

          {timeline.length === 0 ? (
            <div className="empty-state">
              <strong>当前还没有可展示的日程</strong>
              <p>这在新用户、空画像或没有 seed 数据时是正常情况，可以先新增一条自己的安排。</p>
            </div>
          ) : (
            <div className="timeline-stack">
              {groupedTimeline.map((group) => (
                <section className="timeline-day" key={group.dateKey}>
                  <div className="timeline-day__label">{group.label}</div>
                  <div className="timeline-day__items">
                    {group.items.map((item) => (
                      <article className="timeline-item" key={item.id}>
                        <div className="timeline-item__top">
                          <div>
                            <div className="timeline-item__title-row">
                              <h3>{item.title}</h3>
                              <Badge tone={getSourceTone(item.source)}>{getSourceLabel(item.source)}</Badge>
                            </div>
                            <div className="timeline-item__meta">
                              <span>
                                <Clock3 size={14} />
                                {formatTimeRange(item)}
                              </span>
                              {item.city ? (
                                <span>
                                  <MapPin size={14} />
                                  {item.city}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {item.source === "user" ? (
                            <div className="timeline-item__actions">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                <PencilLine size={14} />
                                编辑
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => void handleDelete(item)}>
                                <Trash2 size={14} />
                                删除
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <p>{item.description || "当前没有额外说明。"}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Card>

        <div className="page-stack">
          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>{editingId ? "编辑自定义日程" : "新增自定义日程"}</h2>
                <p>演示态下只更新当前页面预览；登录并同步到 live 后才会真正写入后端。</p>
              </div>
              <CalendarPlus2 size={18} color="hsl(var(--primary))" />
            </div>

            <form className="schedule-form" onSubmit={handleSubmit}>
              <label className="field-group">
                <span className="field-label">标题</span>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="例如：修改简历项目经历"
                  required
                />
              </label>

              <div className="field-grid schedule-form__grid">
                <label className="field-group">
                  <span className="field-label">开始时间</span>
                  <Input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
                    required
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">结束时间</span>
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
                  />
                </label>
              </div>

              <label className="field-group">
                <span className="field-label">地点</span>
                <Input
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="线上 / 上海 / 杭州"
                />
              </label>

              <label className="field-group">
                <span className="field-label">说明</span>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="补充这条日程的上下文，例如：要完成哪一步、关联哪个岗位。"
                />
              </label>

              <div className="schedule-form__actions">
                <Button size="lg" type="submit" loading={submitting}>
                  {editingId ? "保存修改" : "加入时间线"}
                </Button>
                {(editingId || form.title || form.startAt || form.endAt || form.city || form.description) && (
                  <Button variant="secondary" size="lg" type="button" onClick={resetComposer}>
                    清空编辑器
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>来源说明</h2>
                <p>保持后端聚合语义，不在前端把不同来源伪装成同一种任务。</p>
              </div>
            </div>

            <div className="bullet-stack">
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>岗位节点</strong>
                  <span>通常对应投递截止时间或岗位关键窗口，只展示不编辑。</span>
                </div>
              </div>
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>活动日程</strong>
                  <span>来自宣讲会或活动安排，适合和首页活动推荐联动查看。</span>
                </div>
              </div>
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>考试提醒</strong>
                  <span>来自考研或考公偏好，只作为独立提醒，不会覆盖求职主线。</span>
                </div>
              </div>
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>我的安排</strong>
                  <span>只有这类事项允许编辑删除，避免误导用户以为聚合内容也能直接改写。</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
