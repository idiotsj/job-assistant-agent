import Link from "next/link";

import { WeeklyScheduleBoard } from "@/components/blocks";
import { Card } from "@/components/ui/card";

import type { ProfilePageData } from "../types";
import { getProfileTimelineLabel } from "../utils";

export function ProfileTimelineSection({
  timelinePreview,
  weeklyFocus,
}: Pick<ProfilePageData, "timelinePreview" | "weeklyFocus">) {
  return (
    <section className="profile-secondary-grid">
      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>关键日程</h2>
            <p>把你最近最需要注意的岗位、活动、考试或自定义事项直接收进个人中心。</p>
          </div>
        </div>

        {timelinePreview.length > 0 ? (
          <div className="bullet-stack">
            {timelinePreview.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="bullet-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{getProfileTimelineLabel(item)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="message-strip">当前没有可预览的关键日程，新的聚合节点会继续从岗位、活动和考试来源进入这里。</div>
        )}

        <div className="catalog-actions">
          <Link href="/schedule" className="wa-button wa-button--secondary wa-button--sm">
            打开完整时间线
          </Link>
        </div>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>周视图与本周重点</h2>
            <p>周视图不只给日程页使用，个人中心也需要用它帮助用户建立“当前阶段”的节奏感。</p>
          </div>
        </div>

        <WeeklyScheduleBoard />

        <ul className="checklist">
          {weeklyFocus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
