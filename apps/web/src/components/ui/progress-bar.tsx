import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(100, value))}%`;

  return (
    <div className={cn("progress-bar", className)}>
      <div className="progress-bar__fill" style={{ width }} />
    </div>
  );
}
