"use client";

import { Clock, MapPin, Sparkles, ChevronRight } from "lucide-react";

interface ScheduleItem {
  time: string;
  title: string;
  location?: string;
  type: "interview" | "deadline" | "event" | "reminder";
}

interface CountdownItem {
  tag: string;
  label: string;
  daysLeft: number;
}

const SCHEDULE_DATA: ScheduleItem[] = [
  { time: "10:00", title: "模拟面试练习", type: "interview" },
  { time: "14:00", title: "字节跳动宣讲会", location: "A302", type: "event" },
  { time: "16:00", title: "简历投递截止提醒", type: "deadline" },
];

const COUNTDOWN_DATA: CountdownItem[] = [
  { tag: "投递", label: "字节春招截止", daysLeft: 12 },
  { tag: "考试", label: "六级成绩公布", daysLeft: 24 },
];

const DEFAULT_ADVICE =
  "针对昨日面试，建议今日进行 15 分钟模拟练习，巩固自我介绍和项目经历的表达。";

const TYPE_COLORS: Record<string, string> = {
  interview: "#3e81e5",
  deadline: "#f59e0b",
  event: "#3e81e5",
  reminder: "#8b9dc3",
};

function generateWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
  const slotsByDay: Record<number, { time: string; title: string; type: string }[]> = {
    1: [{ time: "10:00", title: "模拟面试", type: "interview" }],
    2: [
      { time: "14:00", title: "字节宣讲会", type: "event" },
      { time: "16:00", title: "投递截止", type: "deadline" },
    ],
    4: [{ time: "10:00", title: "笔试练习", type: "reminder" }],
  };

  return dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    return {
      dayNumber: d.getDate(),
      label,
      isToday,
      slots: slotsByDay[i] ?? [],
    };
  });
}

export function RightRailUser() {
  const weekDays = generateWeekDays();

  return (
    <div className="right-rail-user">
      <div className="right-rail-user__card">
        <span className="right-rail-user__card-title">周视图日程</span>
        <div className="right-rail-user__week-grid">
          {weekDays.map((day) => (
            <div
              key={day.label}
              className={`right-rail-user__week-day${day.isToday ? " right-rail-user__week-day--today" : ""}`}
            >
              <span className="right-rail-user__week-day-label">{day.label}</span>
              <span className="right-rail-user__week-day-num">{day.dayNumber}</span>
              {day.slots.length > 0 ? (
                <div className="right-rail-user__week-day-slots">
                  {day.slots.map((slot) => (
                    <span
                      key={`${slot.time}-${slot.title}`}
                      className="right-rail-user__week-day-slot"
                      style={{ borderLeftColor: TYPE_COLORS[slot.type] ?? TYPE_COLORS.reminder }}
                    >
                      {slot.title}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="right-rail-user__week-day-empty">—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="right-rail-user__card">
        <span className="right-rail-user__card-title">今日日程</span>
        <div className="right-rail-user__schedule-list">
          {SCHEDULE_DATA.map((item) => (
            <div
              key={`${item.time}-${item.title}`}
              className="right-rail-user__schedule-item"
            >
              <span
                className="right-rail-user__schedule-dot"
                style={{ background: TYPE_COLORS[item.type] }}
              />
              <div className="right-rail-user__schedule-body">
                <span className="right-rail-user__schedule-title">{item.title}</span>
                <span className="right-rail-user__schedule-meta">
                  <Clock size={11} /> {item.time}
                  {item.location ? (
                    <>
                      <span className="right-rail-user__schedule-sep">·</span>
                      <MapPin size={11} /> {item.location}
                    </>
                  ) : null}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-rail-user__card">
        <span className="right-rail-user__card-title">关键日程倒计时</span>
        <div className="right-rail-user__countdown-list">
          {COUNTDOWN_DATA.map((item) => (
            <div key={item.label} className="right-rail-user__countdown-item">
              <span className="right-rail-user__countdown-tag">{item.tag}</span>
              <span className="right-rail-user__countdown-label">{item.label}</span>
              <span className="right-rail-user__countdown-days">
                剩余 {item.daysLeft} 天
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="left-rail-nav__advice">
        <div className="left-rail-nav__advice-header">
          <Sparkles size={14} className="left-rail-nav__advice-icon" />
          <span className="left-rail-nav__advice-title">每日建议</span>
        </div>
        <p className="left-rail-nav__advice-text">{DEFAULT_ADVICE}</p>
        <button type="button" className="left-rail-nav__advice-action">
          前往练习
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
