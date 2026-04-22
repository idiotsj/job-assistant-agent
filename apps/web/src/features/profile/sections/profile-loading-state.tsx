import { Card } from "@/components/ui/card";

export function ProfileLoadingState() {
  return (
    <Card className="analysis-panel">
      <div className="message-strip">正在检查当前 Cookie Session，请稍候。</div>
    </Card>
  );
}
