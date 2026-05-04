import { Mic, Sparkles, UserRound, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const plannedModules = [
  {
    title: "数字人面试主舞台",
    description: "承接真实的问答演练、口头表达训练和临场反馈。",
    icon: Video,
  },
  {
    title: "AI 智能建议",
    description: "围绕表达节奏、答案结构和岗位匹配给出辅助建议，而不是最终评价。",
    icon: Sparkles,
  },
  {
    title: "往期面经与礼仪须知",
    description: "把常见问题、礼仪提醒和经验复盘沉淀成可重复参考的训练材料。",
    icon: UserRound,
  },
];

export function InterviewPlaceholderPage() {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>面试模拟</h1>
          <p>这个模块已经进入正式产品规划，但当前仓库还没有接入真实的 AI 面试能力。本页先作为稳定入口，避免首页和知识树出现断链或误导。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone="warning">
            <Mic size={14} />
            模块建设中
          </Badge>
        </div>
      </div>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>后续会承接的核心模块</h2>
            <p>这一页不会伪装成已上线能力，只明确告诉你它未来将接住什么体验。</p>
          </div>
        </div>

        <div className="home-insight-list">
          {plannedModules.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="home-insight-list__item">
                <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={16} />
                  {item.title}
                </strong>
                <p>{item.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>当前说明</h2>
            <p>面试模拟仍属于下一阶段重点模块。现阶段请继续使用岗位详情、简历体检、画像与日程能力，先把投递准备链路打稳。</p>
          </div>
        </div>

        <div className="panel-note">
          <span>后续接入真实能力时，文案仍需保持“AI 是辅助建议，不是最终结论”的产品边界。</span>
        </div>
      </Card>
    </div>
  );
}
