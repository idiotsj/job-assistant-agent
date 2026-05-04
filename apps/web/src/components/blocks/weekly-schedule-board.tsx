interface ScheduleSlot {
  time: string;
  title: string;
  type?: "interview" | "deadline" | "event" | "reminder";
}

interface WeekDay {
  date: string;
  dayNumber: number;
  label: string;
  slots: ScheduleSlot[];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function generateCurrentWeek(): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];

  return dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return {
      date: `${year}-${pad(month)}-${pad(day)}`,
      dayNumber: day,
      label,
      slots: [],
    };
  });
}

const DEFAULT_SLOTS: Record<number, ScheduleSlot[]> = {
  2: [
    { time: "14:00", title: "字节跳动宣讲会", type: "event" },
    { time: "16:00", title: "简历投递截止提醒", type: "deadline" },
  ],
  4: [{ time: "10:00", title: "模拟面试练习", type: "interview" }],
};

interface WeeklyScheduleBoardProps {
  weekLabel?: string;
  className?: string;
}

export function WeeklyScheduleBoard({ weekLabel, className }: WeeklyScheduleBoardProps) {
  const days = generateCurrentWeek().map((day, i) => ({
    ...day,
    slots: DEFAULT_SLOTS[i] ?? day.slots,
  }));

  return (
    <div className={`weekly-schedule-board${className ? ` ${className}` : ""}`}>
      <div className="weekly-schedule-board__header">
        <span className="weekly-schedule-board__title">周视图日程</span>
        {weekLabel ? (
          <span className="weekly-schedule-board__week-label">{weekLabel}</span>
        ) : null}
      </div>
      <div className="weekly-schedule-board__grid">
        {days.map((day) => (
          <div key={day.date} className="weekly-schedule-board__day">
            <span className="weekly-schedule-board__day-label">{day.label}</span>
            <span className="weekly-schedule-board__day-date">{day.dayNumber}</span>
            {day.slots.map((slot) => (
              <div
                key={`${day.date}-${slot.time}-${slot.title}`}
                className={`weekly-schedule-board__slot weekly-schedule-board__slot--${slot.type ?? "reminder"}`}
              >
                {slot.time} {slot.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
