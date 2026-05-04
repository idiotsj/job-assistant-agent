import { Card } from "@/components/ui/card";

import type { ScheduleSummaryCard } from "../types";

export function ScheduleSummarySection({ cards }: { cards: ScheduleSummaryCard[] }) {
  return (
    <div className="schedule-summary-grid">
      {cards.map((card) => (
        <Card className="summary-card" key={card.label}>
          <span className="summary-card__label">{card.label}</span>
          <strong>{card.value}</strong>
          <p>{card.description}</p>
        </Card>
      ))}
    </div>
  );
}
