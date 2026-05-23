"use client";

import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { HomeDashboardData, HomeDashboardStatus } from "../types";
import { formatCompactDate, getScheduleSourceLabel } from "../utils";

interface HomeTimelineSectionProps {
  timelinePreview: HomeDashboardData["timelinePreview"];
  schedule: HomeDashboardData["schedule"];
  modes: HomeDashboardStatus["modes"];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface WeekDayInfo {
  date: string;
  dayNumber: number;
  label: string;
}

function generateCurrentWeek(): WeekDayInfo[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];

  return dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      dayNumber: d.getDate(),
      label,
    };
  });
}

const DEMO_WEEK_EVENTS: Record<string, Array<{ time: string; title: string; location: string; type: "interview" | "deadline" | "event" | "reminder" }>> = {
  1: [
    { time: "10:00", title: "模拟面试练习", location: "线上", type: "interview" },
  ],
  2: [
    { time: "14:00", title: "字节跳动宣讲会", location: "A302 教学楼", type: "event" },
    { time: "16:00", title: "简历投递截止提醒", location: "线上", type: "deadline" },
  ],
  4: [
    { time: "10:00", title: "笔试模拟练习", location: "线上", type: "reminder" },
    { time: "15:00", title: "腾讯技术沙龙", location: "B201 报告厅", type: "event" },
  ],
  5: [
    { time: "09:00", title: "春招补录面试", location: "线上 Zoom", type: "interview" },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  interview: "#3e81e5",
  deadline: "#f59e0b",
  event: "#3e81e5",
  reminder: "#8b9dc3",
};

const TYPE_LABELS: Record<string, string> = {
  interview: "面试",
  deadline: "截止",
  event: "宣讲",
  reminder: "提醒",
};

export function HomeTimelineSection({ timelinePreview, schedule, modes }: HomeTimelineSectionProps) {
  const weekDays = generateCurrentWeek();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const weekSchedule = schedule.filter((item) => {
    const itemDate = item.startAt ? item.startAt.split("T")[0] : "";
    return weekDays.some((d) => d.date === itemDate);
  });

  const weekFocus = [
    "优先围绕\"前端开发\"整理岗位判断与简历表达",
    "重点留意上海的岗位与活动时间线",
  ];

  return (
    <section className="home-timeline-section">
      <Card className="home-timeline-card" padded={false}>
        <div className="home-timeline-card__header">
          <div>
            <h3>完整时间线面板 · 周视图 · 周重点</h3>
          </div>
          <div className="home-timeline-card__toggle">
            <button type="button" className="home-timeline-card__toggle-btn">月视图</button>
            <button type="button" className="home-timeline-card__toggle-btn home-timeline-card__toggle-btn--active">
              周视图
            </button>
          </div>
        </div>

        <div className="home-timeline-card__week">
          <button type="button" className="home-timeline-card__nav">
            <ChevronLeft size={16} />
          </button>
          {weekDays.map((day) => {
            const isToday = day.date === todayStr;
            const dayEvents = weekSchedule.filter((s) => s.startAt?.startsWith(day.date));
            return (
              <div
                key={day.date}
                className={`home-timeline-card__day${isToday ? " home-timeline-card__day--today" : ""}`}
              >
                <span className="home-timeline-card__day-label">{day.label}</span>
                <span className="home-timeline-card__day-num">{day.dayNumber}</span>
                {dayEvents.length > 0 ? (
                  <div className="home-timeline-card__day-dot" />
                ) : null}
              </div>
            );
          })}
          <button type="button" className="home-timeline-card__nav">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="home-timeline-card__focus">
          <h4>本周重点</h4>
          <ul>
            {weekFocus.map((f, i) => (
              <li key={i}>
                <CheckCircle2 size={14} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="home-timeline-card__events">
          {weekDays.map((day, dayIndex) => {
            const events = DEMO_WEEK_EVENTS[dayIndex] ?? [];
            const isToday = day.date === todayStr;
            return (
              <div
                key={day.date}
                className={`home-timeline-card__day-group${isToday ? " home-timeline-card__day-group--today" : ""}`}
              >
                <div className="home-timeline-card__day-group-header">
                  <span className="home-timeline-card__day-group-label">周{day.label}</span>
                  <span className="home-timeline-card__day-group-date">{day.dayNumber}日</span>
                  {isToday ? <Badge tone="success">今天</Badge> : null}
                </div>
                <div className="home-timeline-card__day-group-events">
                  {events.length > 0 ? (
                    events.map((evt) => (
                      <div
                        key={`${day.date}-${evt.time}-${evt.title}`}
                        className="home-timeline-card__event"
                        style={{ borderLeftColor: TYPE_COLORS[evt.type] }}
                      >
                        <div className="home-timeline-card__event-top">
                          <span
                            className="home-timeline-card__event-type-tag"
                            style={{ background: `${TYPE_COLORS[evt.type]}18`, color: TYPE_COLORS[evt.type] }}
                          >
                            {TYPE_LABELS[evt.type]}
                          </span>
                          <div className="home-timeline-card__event-time">
                            <Clock size={14} />
                            <span>{evt.time}</span>
                          </div>
                        </div>
                        <div className="home-timeline-card__event-title">{evt.title}</div>
                        <div className="home-timeline-card__event-meta">
                          <MapPin size={12} />
                          <span>{evt.location}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="home-timeline-card__day-group-empty">
                      <span>暂无日程</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
