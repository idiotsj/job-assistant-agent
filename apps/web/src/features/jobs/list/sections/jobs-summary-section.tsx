import { Card } from "@/components/ui/card";

import type { JobsSummaryCard } from "../types";

export function JobsSummarySection({ cards }: { cards: JobsSummaryCard[] }) {
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
