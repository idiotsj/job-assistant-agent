import type { ReactNode } from "react";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-grid">
      <Card className="auth-panel auth-panel--hero">
        <div className="auth-hero__badge-row">
          <Badge tone="info">
            <Sparkles size={14} />
            求职主链路
          </Badge>
        </div>

        <div className="auth-hero__copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="auth-hero__stack">
          <div className="auth-hero__item">
            <ShieldCheck size={18} />
            <div>
              <strong>统一 Cookie Session</strong>
              <span>登录成功后由后端写入 Cookie，前端不自行存 token。</span>
            </div>
          </div>
          <div className="auth-hero__item">
            <CheckCircle2 size={18} />
            <div>
              <strong>画像优先补全</strong>
              <span>进入工作台前，先把目标城市、行业和岗位方向整理清楚。</span>
            </div>
          </div>
          <div className="auth-hero__item">
            <CheckCircle2 size={18} />
            <div>
              <strong>AI 能力按登录态开放</strong>
              <span>简历诊断、岗位分析、日程聚合都会复用当前账号上下文。</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="auth-panel">
        <div className="auth-form__header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {children}
        {footer ? <div className="auth-form__footer">{footer}</div> : null}
      </Card>
    </div>
  );
}
