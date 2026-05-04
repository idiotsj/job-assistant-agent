import { CalendarClock, Clock3, MapPin, PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { ScheduleItem } from "@job-assistant/contracts/schedule";
import type { ScheduleDayGroup } from "../types";
import { formatTimeRange, getSourceLabel, getSourceTone } from "../utils";

export function ScheduleTimelineSection({
  groups,
  onEdit,
  onDelete,
}: {
  groups: ScheduleDayGroup[];
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => Promise<void>;
}) {
  return (
    <Card className="schedule-panel">
      <div className="section-heading">
        <div>
          <h2>聚合时间线</h2>
          <p>真实联调时由后端统一聚合，前端只负责按来源清晰呈现，不自行重排建模。</p>
        </div>
        <CalendarClock size={18} color="hsl(var(--primary))" />
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <strong>当前还没有可展示的日程</strong>
          <p>这在新用户、空画像或没有 seed 数据时是正常情况，可以先新增一条自己的安排。</p>
        </div>
      ) : (
        <div className="timeline-stack">
          {groups.map((group) => (
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
                          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                            <PencilLine size={14} />
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void onDelete(item)}>
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
  );
}
