import { Clock } from "lucide-react";

interface CountdownItem {
  label: string;
  targetDate: string;
  tag?: string;
}

const DEFAULT_ITEMS: CountdownItem[] = [
  { label: "字节跳动 2026 春招截止", targetDate: "2026-05-20", tag: "投递" },
  { label: "六级成绩公布", targetDate: "2026-06-15", tag: "考试" },
];

interface CountdownCardProps {
  items?: CountdownItem[];
  className?: string;
}

function computeDaysLeft(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function CountdownCard({ items = DEFAULT_ITEMS, className }: CountdownCardProps) {
  return (
    <div className={`countdown-card${className ? ` ${className}` : ""}`}>
      <div className="countdown-card__header">
        <Clock size={16} className="countdown-card__header-icon" />
        <span className="countdown-card__header-label">关键日程</span>
      </div>
      <div className="countdown-card__list">
        {items.map((item) => {
          const days = computeDaysLeft(item.targetDate);
          return (
            <div key={item.label} className="countdown-card__item">
              {item.tag ? <span className="countdown-card__item-tag">{item.tag}</span> : null}
              <span className="countdown-card__item-label">{item.label}</span>
              <span className="countdown-card__item-days">
                {days > 0 ? `剩余 ${days} 天` : "今天"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
