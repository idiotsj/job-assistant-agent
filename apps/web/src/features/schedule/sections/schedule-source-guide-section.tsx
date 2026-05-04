import { Card } from "@/components/ui/card";

export function ScheduleSourceGuideSection() {
  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>来源说明</h2>
          <p>保持后端聚合语义，不在前端把不同来源伪装成同一种任务。</p>
        </div>
      </div>

      <div className="bullet-stack">
        <div className="list-item">
          <div className="bullet-dot" />
          <div>
            <strong>岗位节点</strong>
            <span>通常对应投递截止时间或岗位关键窗口，只展示不编辑。</span>
          </div>
        </div>
        <div className="list-item">
          <div className="bullet-dot" />
          <div>
            <strong>活动日程</strong>
            <span>来自宣讲会或活动安排，适合和首页活动推荐联动查看。</span>
          </div>
        </div>
        <div className="list-item">
          <div className="bullet-dot" />
          <div>
            <strong>考试提醒</strong>
            <span>来自考研或考公偏好，只作为独立提醒，不会覆盖求职主线。</span>
          </div>
        </div>
        <div className="list-item">
          <div className="bullet-dot" />
          <div>
            <strong>我的安排</strong>
            <span>只有这类事项允许编辑删除，避免误导用户以为聚合内容也能直接改写。</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
