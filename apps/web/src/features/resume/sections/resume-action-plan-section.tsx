import Link from "next/link";

import { Card } from "@/components/ui/card";

import type { ResumeWorkbenchData } from "../types";

interface ResumeActionPlanSectionProps {
  actionPlan: ResumeWorkbenchData["diagnosisResult"]["diagnosis"]["actionPlan"];
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
}

export function ResumeActionPlanSection({
  actionPlan,
  sessionStatus,
}: ResumeActionPlanSectionProps) {
  return (
    <>
      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>优化清单</h2>
            <p>把洞察直接落成下一步动作，而不是只停留在“分数不错”。</p>
          </div>
        </div>

        <ul className="checklist">
          <li>{actionPlan.topPriority}</li>
          {actionPlan.nextSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="catalog-actions">
          <Link href="/profile" className="wa-button wa-button--secondary wa-button--md">
            去核对画像
          </Link>
          <Link href="/jobs" className="wa-button wa-button--primary wa-button--md">
            去做岗位对齐
          </Link>
        </div>
      </Card>

      {sessionStatus !== "authenticated" ? (
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>继续联调前</h2>
              <p>这一步明确告诉用户，真实能力依赖登录态，不再把未登录和服务异常混成同一种提示。</p>
            </div>
          </div>
          <div className="catalog-actions">
            <Link href="/login" className="wa-button wa-button--primary wa-button--md">
              登录后继续
            </Link>
            <Link href="/register" className="wa-button wa-button--secondary wa-button--md">
              创建账号
            </Link>
          </div>
        </Card>
      ) : null}
    </>
  );
}
