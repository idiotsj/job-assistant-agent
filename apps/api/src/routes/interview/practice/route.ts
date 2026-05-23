import { interviewPracticeWorkspaceSchema } from "@job-assistant/contracts/interview";

import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";

const interviewPracticeWorkspace = interviewPracticeWorkspaceSchema.parse({
  status: "building",
  title: "面试模拟练习区",
  summary:
    "当前后端先提供稳定的占位工作区信息，方便前端进入真实联调；完整的面试编排、题目流和 AI 陪练能力仍在后续阶段。",
  availableModules: [
    {
      id: "etiquette",
      title: "面试礼仪与环境准备",
      description: "承接礼仪提示、设备检查和面试前准备建议。",
    },
    {
      id: "mentor",
      title: "AI 导师入口",
      description: "为未来的模拟面试舞台、问答训练和复盘反馈预留统一入口。",
    },
    {
      id: "review",
      title: "复盘与成长记录",
      description: "为后续面试记录、评分摘要和行动建议提供承载位置。",
    },
  ],
  suggestion: {
    title: "当前建议先完成求职主链路准备",
    summary: "在正式面试引擎上线前，优先使用岗位分析、简历诊断和改写建议，把投递准备链路打稳。",
    ctaLabel: "继续完善简历与岗位准备",
  },
  recommendedActions: [
    "先完成一轮简历诊断，补齐最关键的表达短板。",
    "对目标岗位跑一次岗位定向分析，确认匹配点和缺口。",
    "把需要强化的项目经历整理成 2 到 3 个可口述案例。",
  ],
});

export const GET = withErrorHandling(async (request) => {
  await requireAuth(request);
  return success(interviewPracticeWorkspace);
});
