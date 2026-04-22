import type { Job } from "@job-assistant/contracts/jobs";
import { BriefcaseBusiness, CalendarClock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { JobDetailMetaItem } from "../types";

export function JobDetailMainSection({
  job,
  insight,
  timeItems,
  reminders,
  sessionStatus,
  onOpenDrawer,
}: {
  job: Job;
  insight: string;
  timeItems: JobDetailMetaItem[];
  reminders: string[];
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  onOpenDrawer: () => void;
}) {
  return (
    <Card className="job-detail">
      <div className="job-detail__hero">
        <div>
          <Badge tone="info">{job.companyName}</Badge>
          <h2>{job.title}</h2>
          <p className="job-detail__copy">{insight}</p>
        </div>
        <Button size="lg" onClick={onOpenDrawer}>
          <Sparkles size={16} />
          一键评估投递成功率
        </Button>
      </div>

      {sessionStatus !== "authenticated" ? (
        <div className="panel-note panel-note--warning">
          <Sparkles size={16} />
          <span>未登录时可以先阅读岗位详情，但真实简历分析和改写建议需要登录后才能调用。</span>
        </div>
      ) : null}

      <div className="detail-grid">
        <Card className="analysis-panel">
          <div className="section-heading">
            <div>
              <h2>岗位要求</h2>
              <p>把后端返回的关键要求收成清晰的可读块，方便用户先做自我判断。</p>
            </div>
            <BriefcaseBusiness size={18} color="hsl(var(--primary))" />
          </div>
          <div className="badge-wall">
            {job.requiredSkills.map((skill) => (
              <Badge key={skill} tone="info">
                {skill}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="analysis-panel">
          <div className="section-heading">
            <div>
              <h2>投递时间信息</h2>
              <p>把最容易影响投递优先级的字段集中放在一个区域。</p>
            </div>
            <CalendarClock size={18} color="hsl(var(--primary))" />
          </div>
          <div className="bullet-stack">
            {timeItems.map((item) => (
              <div className="list-item" key={item.label}>
                <div className="bullet-dot" />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>投递提醒</h2>
            <p>把岗位详情和后续动作连接起来，减少用户只看不动手的情况。</p>
          </div>
        </div>
        <ul className="checklist">
          {reminders.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </Card>
  );
}
