import type { ReactNode } from "react";

interface DarkStagePanelProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  className?: string;
}

export function DarkStagePanel({
  children,
  title,
  subtitle,
  badge,
  className,
}: DarkStagePanelProps) {
  return (
    <div className={`dark-stage-panel${className ? ` ${className}` : ""}`}>
      {badge ? <span className="dark-stage-panel__badge">{badge}</span> : null}
      {title ? <h3 className="dark-stage-panel__title">{title}</h3> : null}
      {subtitle ? <p className="dark-stage-panel__subtitle">{subtitle}</p> : null}
      {children}
    </div>
  );
}
