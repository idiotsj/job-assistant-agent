import type { AuthUser } from "@job-assistant/contracts/auth";
import type { StudentCase } from "@job-assistant/contracts/cases";
import type { CivilServiceAdvice } from "@job-assistant/contracts/civil-service";
import type { Company } from "@job-assistant/contracts/companies";
import type { TodayContent } from "@job-assistant/contracts/daily-content";
import type { CareerEvent } from "@job-assistant/contracts/events";
import type { Job, JobResumeAnalyzeResult, JobResumeRewriteSuggestionsResult } from "@job-assistant/contracts/jobs";
import type { PostgraduateAdvice } from "@job-assistant/contracts/postgraduate";
import type { ProfileResumeDiagnoseResult, UserProfile } from "@job-assistant/contracts/profile";
import type { HomeRecommendation } from "@job-assistant/contracts/recommendation";
import type { ScheduleItem } from "@job-assistant/contracts/schedule";

export const demoUser: AuthUser = {
  id: "demo-user-01",
  email: "demo@example.com",
  name: "林嘉言",
  role: "user",
  status: "active",
  emailVerifiedAt: "2026-03-22T08:30:00.000Z",
};

export const demoProfile: UserProfile = {
  userId: demoUser.id,
  university: "复旦大学",
  major: "信息管理与信息系统",
  grade: "大三",
  targetIndustries: ["AI 产品", "互联网平台", "企业服务"],
  targetCities: ["上海", "杭州", "深圳"],
  skills: ["React", "TypeScript", "Python", "数据分析", "用户研究"],
  preferredJobTypes: ["前端开发", "产品经理", "运营分析"],
  considersPostgraduate: false,
  considersCivilService: false,
  resumeData: null,
  createdAt: "2026-03-01T09:00:00.000Z",
  updatedAt: "2026-04-17T02:40:00.000Z",
};

export const demoFeaturedCompany: Company = {
  id: "company-aurora",
  name: "Aurora AI Labs",
  industry: "AI 产品",
  city: "上海",
  description: "聚焦多模态内容理解与企业级 Copilot，正在组建面向校园人才的产品与前端联合作战小队。",
  isFeatured: true,
  updatedAt: "2026-04-16T10:00:00.000Z",
};

export const demoHomeRecommendation: HomeRecommendation = {
  jobs: [
    {
      id: "job-fe-01",
      title: "校园前端开发实习生",
      companyId: demoFeaturedCompany.id,
      companyName: demoFeaturedCompany.name,
      companyIndustry: demoFeaturedCompany.industry,
      workLocation: "上海·徐汇",
      tags: ["250-300/天", "React", "可转正"],
      requiredSkills: ["React", "TypeScript", "工程化", "交互设计理解"],
      description: "参与智能求职助手的前台工作区搭建，负责多模块信息流和分析面板的实现。",
      isFeatured: true,
      deadline: "2026-05-08T16:00:00.000Z",
      publishedAt: "2026-04-15T02:00:00.000Z",
      popularity: 92,
      score: 88,
      reason: "你的 React 与数据分析组合，正好适合做求职工作台的复杂信息编排。",
      source: "jobs",
    },
    {
      id: "job-pm-02",
      title: "AI 产品经理校招生",
      companyId: "company-wave",
      companyName: "BlueWave Cloud",
      companyIndustry: "企业服务",
      workLocation: "杭州·滨江",
      tags: ["20-28K", "AI Agent", "B 端"],
      requiredSkills: ["需求拆解", "用户研究", "SQL", "A/B Test"],
      description: "负责招聘场景 Agent 的策略设计、结果评估和增长实验，和工程团队共同推进交付。",
      isFeatured: true,
      deadline: "2026-05-12T16:00:00.000Z",
      publishedAt: "2026-04-14T04:00:00.000Z",
      popularity: 80,
      score: 83,
      reason: "你的用户研究和数据分析经历可以直接支撑产品策略与效果评估。",
      source: "jobs",
    },
    {
      id: "job-op-03",
      title: "内容运营分析实习生",
      companyId: "company-luma",
      companyName: "Luma Growth",
      companyIndustry: "新消费",
      workLocation: "深圳·南山",
      tags: ["180-220/天", "增长分析", "内容策略"],
      requiredSkills: ["Excel", "数据可视化", "活动策划", "跨团队协同"],
      description: "围绕品牌校园项目建立内容策略与活动复盘体系，持续优化转化漏斗。",
      isFeatured: false,
      deadline: "2026-05-18T16:00:00.000Z",
      publishedAt: "2026-04-11T08:00:00.000Z",
      popularity: 68,
      score: 76,
      reason: "如果你想保留商业敏感度，这个岗位能补足偏增长与运营的实战经验。",
      source: "jobs",
    },
  ],
  cases: [
    {
      id: "case-01",
      title: "经管背景转前端：用作品集拿到 SaaS Offer",
      careerPath: "前端开发",
      backgroundMajor: "工商管理",
      city: "上海",
      tags: ["跨专业", "作品集", "实习转正"],
      summary: "通过两个业务中后台作品和一份结构化简历，3 周拿到 2 个企业服务方向面试。",
      isFeatured: true,
      publishedAt: "2026-04-10T08:00:00.000Z",
      score: 82,
      reason: "你的履历和她一样具备跨学科表达优势，案例里的作品集结构可以直接借鉴。",
      source: "cases",
    },
    {
      id: "case-02",
      title: "信管学生如何把数据分析讲成产品价值",
      careerPath: "产品经理",
      backgroundMajor: "信息管理与信息系统",
      city: "杭州",
      tags: ["产品岗", "数据分析", "STAR"],
      summary: "把课程项目改写成业务价值故事后，终面通过率明显提升。",
      isFeatured: false,
      publishedAt: "2026-04-09T08:00:00.000Z",
      score: 79,
      reason: "你和案例主人公专业背景一致，最值得抄的是“问题-动作-指标”表达法。",
      source: "cases",
    },
  ],
  events: [
    {
      id: "event-01",
      title: "AI 求职产品开放日",
      companyName: demoFeaturedCompany.name,
      companyIndustry: demoFeaturedCompany.industry,
      city: "上海",
      startAt: "2026-04-23T10:00:00.000Z",
      endAt: "2026-04-23T12:00:00.000Z",
      registrationDeadline: "2026-04-21T15:00:00.000Z",
      description: "产品、前端、算法三线同台答疑，现场提供简历快诊与面试官午餐交流。",
      isFeatured: true,
      score: 86,
      reason: "你目标城市和目标行业完全重合，适合现场拿反馈并建立一手连接。",
      source: "events",
    },
    {
      id: "event-02",
      title: "企业服务 PM 校招线上宣讲",
      companyName: "BlueWave Cloud",
      companyIndustry: "企业服务",
      city: "杭州",
      startAt: "2026-04-25T11:30:00.000Z",
      endAt: "2026-04-25T13:00:00.000Z",
      registrationDeadline: "2026-04-24T16:00:00.000Z",
      description: "聚焦 Agent 方向产品校招需求，含试题结构和转正样本拆解。",
      isFeatured: false,
      score: 75,
      reason: "如果你在产品和前端之间犹豫，这场能帮你校准岗位判断标准。",
      source: "events",
    },
  ],
  dailyAdvice: {
    title: "把“会做”升级成“可被录用”",
    body: "今天优先把最近一个项目经历改成结果导向版本：补上用户规模、指标变化和你真正主导的动作。这样你的简历会比同水平候选人更容易被记住。",
    source: "work-agent-curated",
  },
  featuredCompany: demoFeaturedCompany,
};

export const demoJobs: Job[] = demoHomeRecommendation.jobs.map(({ score, reason, source, ...job }) => job);

export const demoTodayContent: TodayContent = {
  dailyAdvice: demoHomeRecommendation.dailyAdvice,
  featuredCompany: demoFeaturedCompany,
  featuredJobs: demoJobs.slice(0, 2),
};

export const demoCompanies: Company[] = [
  demoFeaturedCompany,
  {
    id: "company-wave",
    name: "BlueWave Cloud",
    industry: "企业服务",
    city: "杭州",
    description: "专注 AI Agent 与企业协同平台，团队强调产品、研发和数据分析的快速闭环。",
    isFeatured: true,
    updatedAt: "2026-04-15T10:20:00.000Z",
  },
  {
    id: "company-luma",
    name: "Luma Growth",
    industry: "新消费",
    city: "深圳",
    description: "擅长把内容增长、用户洞察和品牌活动整合到同一套数据驱动方法里。",
    isFeatured: false,
    updatedAt: "2026-04-12T08:00:00.000Z",
  },
  {
    id: "company-orbit",
    name: "Orbit Campus",
    industry: "教育科技",
    city: "北京",
    description: "围绕校园服务与生涯规划做数字化产品，适合有教育或青年用户场景兴趣的同学。",
    isFeatured: false,
    updatedAt: "2026-04-11T09:30:00.000Z",
  },
  {
    id: "company-nova",
    name: "Nova Retail Lab",
    industry: "互联网平台",
    city: "上海",
    description: "聚焦零售与会员体验数字化，欢迎既懂业务洞察又愿意深挖交互细节的人加入。",
    isFeatured: false,
    updatedAt: "2026-04-10T14:00:00.000Z",
  },
  {
    id: "company-morrow",
    name: "Morrow Data",
    industry: "数据智能",
    city: "广州",
    description: "面向企业提供数据治理与智能分析平台，适合偏前端平台化和分析产品方向的候选人。",
    isFeatured: true,
    updatedAt: "2026-04-09T16:40:00.000Z",
  },
];

export const demoStudentCases: StudentCase[] = [
  demoHomeRecommendation.cases[0] ? (({ score, reason, source, ...item }) => item)(demoHomeRecommendation.cases[0]) : null,
  demoHomeRecommendation.cases[1] ? (({ score, reason, source, ...item }) => item)(demoHomeRecommendation.cases[1]) : null,
  {
    id: "case-03",
    title: "统计学背景进运营分析：把课程项目改成业务推演",
    careerPath: "运营分析",
    backgroundMajor: "统计学",
    city: "深圳",
    tags: ["数据分析", "运营", "实习转正"],
    summary: "把原本偏学术的建模项目重写成增长复盘故事后，面试官更容易看见业务思维。",
    isFeatured: true,
    publishedAt: "2026-04-08T08:00:00.000Z",
  },
  {
    id: "case-04",
    title: "新传学生转产品：先做校园用户研究，再写作品集",
    careerPath: "产品经理",
    backgroundMajor: "新闻传播学",
    city: "北京",
    tags: ["产品岗", "用户研究", "作品集"],
    summary: "把用户访谈和需求拆解过程沉淀成作品集后，成功从内容实习转到产品面试主线。",
    isFeatured: false,
    publishedAt: "2026-04-06T09:20:00.000Z",
  },
  {
    id: "case-05",
    title: "计算机学生避开海投：先锁两类企业再集中突破",
    careerPath: "前端开发",
    backgroundMajor: "计算机科学与技术",
    city: "杭州",
    tags: ["前端", "求职策略", "筛选"],
    summary: "通过先缩小企业画像，再集中改写简历和作品，投递效率明显高于无差别海投。",
    isFeatured: false,
    publishedAt: "2026-04-04T10:30:00.000Z",
  },
].filter(Boolean) as StudentCase[];

export const demoCareerEvents: CareerEvent[] = [
  demoHomeRecommendation.events[0] ? (({ score, reason, source, ...item }) => item)(demoHomeRecommendation.events[0]) : null,
  demoHomeRecommendation.events[1] ? (({ score, reason, source, ...item }) => item)(demoHomeRecommendation.events[1]) : null,
  {
    id: "event-03",
    title: "前端平台工程师线下沙龙",
    companyName: "Morrow Data",
    companyIndustry: "数据智能",
    city: "广州",
    startAt: "2026-04-27T11:00:00.000Z",
    endAt: "2026-04-27T13:30:00.000Z",
    registrationDeadline: "2026-04-25T15:00:00.000Z",
    description: "聚焦组件体系、复杂表单和平台工作台设计，适合希望强化工程叙事的候选人。",
    isFeatured: true,
  },
  {
    id: "event-04",
    title: "校园产品经理圆桌交流",
    companyName: "Orbit Campus",
    companyIndustry: "教育科技",
    city: "北京",
    startAt: "2026-04-29T10:30:00.000Z",
    endAt: "2026-04-29T12:00:00.000Z",
    registrationDeadline: "2026-04-28T12:00:00.000Z",
    description: "会拆解校园产品岗位的判断标准，也会聊作品集和实习选择的取舍。",
    isFeatured: false,
  },
  {
    id: "event-05",
    title: "零售增长与用户运营开放日",
    companyName: "Nova Retail Lab",
    companyIndustry: "互联网平台",
    city: "上海",
    startAt: "2026-05-03T06:00:00.000Z",
    endAt: "2026-05-03T08:00:00.000Z",
    registrationDeadline: null,
    description: "更适合想保留商业分析和内容增长双向可能性的同学，现场会有案例拆解。",
    isFeatured: false,
  },
].filter(Boolean) as CareerEvent[];

export const demoScheduleItems: ScheduleItem[] = [
  {
    id: "schedule-user-01",
    title: "整理本周投递复盘",
    source: "user",
    startAt: "2026-04-19T11:00:00.000Z",
    endAt: "2026-04-19T12:00:00.000Z",
    city: "线上",
    description: "把本周已经投递的岗位按反馈情况归档，顺手更新下一轮重点跟进名单。",
  },
  {
    id: "schedule-job-01",
    title: "Aurora AI Labs 前端实习投递截止",
    source: "job",
    startAt: "2026-05-08T16:00:00.000Z",
    endAt: null,
    city: "上海",
    description: "对齐首页推荐里的高契合岗位，建议在截止前完成简历定向改写和附件检查。",
  },
  {
    id: "schedule-event-01",
    title: "AI 求职产品开放日",
    source: "event",
    startAt: "2026-04-23T10:00:00.000Z",
    endAt: "2026-04-23T12:00:00.000Z",
    city: "上海",
    description: "现场可获取产品、前端、算法三条线的岗位反馈，也适合验证目标岗位判断。",
  },
  {
    id: "schedule-exam-01",
    title: "考研一阶段复习提醒",
    source: "exam",
    startAt: "2026-04-26T01:30:00.000Z",
    endAt: "2026-04-26T03:30:00.000Z",
    city: null,
    description: "如果你仍保留升学可能性，这里适合把数学和专业课拆成固定的晨间复习块。",
  },
  {
    id: "schedule-exam-02",
    title: "国考公告关注窗口",
    source: "exam",
    startAt: "2026-05-02T01:00:00.000Z",
    endAt: null,
    city: "上海",
    description: "用于提醒考公频道里与目标城市匹配的招录窗口，不和求职主线混在一起展示。",
  },
];

export const demoPostgraduateAdvice: PostgraduateAdvice[] = [
  {
    id: "postgraduate-01",
    title: "先确认目标方向，再决定是否投入长期备考",
    summary:
      "如果你同时还在投递前端或产品岗位，建议先用 2 周把就业与考研的机会成本写清楚，再进入长期备考节奏。",
    actionItems: [
      "把目标院校、目标专业和现有就业机会放进同一张对比表",
      "确认自己更看重学历跃迁、研究方向还是就业城市",
      "给数学和专业课各切出一段最小可持续时间块，先试跑一周",
    ],
    targetMajors: ["信息管理", "计算机相关", "管理科学"],
    updatedAt: "2026-04-16T09:00:00.000Z",
  },
  {
    id: "postgraduate-02",
    title: "跨专业备考时，先补“信息差”而不是盲目刷题",
    summary:
      "对跨方向考研用户，前两周最关键的是把院校难度、参考书和往年节奏摸清楚，不要一上来就进入高强度刷题。",
    actionItems: [
      "整理 3 所目标院校的真题结构和科目权重",
      "确认是否需要补专业基础课程或实验经历",
      "把作品集、实习和备考时间切成互不冲突的周计划",
    ],
    targetMajors: ["跨专业申请", "信息系统", "数字媒体"],
    updatedAt: "2026-04-14T15:30:00.000Z",
  },
];

export const demoCivilServiceAdvice: CivilServiceAdvice[] = [
  {
    id: "civil-service-01",
    title: "把考公准备压缩成“可维护副线”，不要吞掉主线求职",
    summary:
      "如果你还没有完全确认转向考公，建议先保留稳定关注与阶段性练习，而不是一口气切断求职和作品积累。",
    actionItems: [
      "先确认是否真的接受岗位地点和发展节奏",
      "每周只保留 2 到 3 个固定刷题时段，避免侵蚀主线投递",
      "把公告关注、岗位筛选和练习复盘拆开处理，降低心智负担",
    ],
    targetCities: ["上海", "浙江"],
    updatedAt: "2026-04-15T08:20:00.000Z",
  },
  {
    id: "civil-service-02",
    title: "城市导向型准备，先锁定地域再谈岗位类型",
    summary:
      "如果你更在意留在目标城市，考公频道最适合先帮助你建立地域筛选逻辑，而不是先沉迷岗位名称本身。",
    actionItems: [
      "先按目标城市整理近两年的招录节奏和岗位规模",
      "确认自己能接受的岗位通勤、专业限制和未来路径",
      "把政策型岗位和综合管理岗分开评估，不要混成同一类选择",
    ],
    targetCities: ["上海", "杭州", "深圳"],
    updatedAt: "2026-04-13T18:10:00.000Z",
  },
];

export const demoResumeText = `林嘉言
电话：138-0000-0000 ｜ 邮箱：demo@example.com ｜ 求职方向：前端开发 / AI 产品

教育背景
复旦大学 信息管理与信息系统 本科
2023.09 - 2027.06

项目经历
1. 校园活动助手后台
- 独立完成 React + TypeScript 控制台搭建，支持活动发布、报名审核与数据看板
- 通过表单拆分和状态管理重构，将复杂页面平均首屏交互时间降低约 28%

2. AI 内容摘要工具
- 负责 Prompt 设计、前端交互和日志分析
- 联合 3 名同学完成 Web 原型，累计收集 120+ 条用户反馈

实习经历
互联网内容运营实习生
- 每周输出竞品分析与栏目复盘，协助优化专题页点击率

技能
React、TypeScript、Python、SQL、Figma、用户研究`;

export const demoResumeDiagnosis: ProfileResumeDiagnoseResult = {
  diagnosis: {
    version: "demo-v1",
    generatedAt: "2026-04-17T02:40:00.000Z",
    overallScore: 85,
    summary: "你的简历已经具备“能拿面试”的底子，优势集中在跨学科能力与项目表达，但还缺少更强的量化结果和更明确的岗位聚焦。",
    quality: {
      strengths: ["前端与产品双向叙事自然", "项目经历覆盖真实业务流程", "技能栈与目标岗位关联度高"],
      risks: ["部分经历仍偏任务描述", "缺少用户规模或转化指标", "岗位目标稍显分散"],
      missingInfo: ["缺少作品链接", "尚未突出主导角色", "没有标注协作规模"],
    },
    alignment: {
      targetSummary: "更适合投递 AI 产品型前端、交互复杂的企业服务平台、校园招聘数字化工具相关岗位。",
      matchedSignals: ["React + TypeScript 工程化实践", "兼具数据分析和用户研究意识", "有跨职能协作表达"],
      gapSignals: ["缺少性能优化或指标复盘案例", "项目结果描述尚未建立业务影响"],
    },
    actionPlan: {
      topPriority: "先把最强项目改成“场景-动作-结果”结构，并补上结果指标。",
      nextSteps: [
        "在第一段项目经历中加入使用规模、效率提升或业务结果",
        "把求职方向收束成“前端开发 / AI 产品型前端”",
        "补上作品集或 GitHub 链接，降低面试官验证成本",
      ],
    },
  },
  parsed: {
    summary: "一份偏向前端与 AI 产品交叉岗位的校园简历，项目驱动明显。",
    detectedSkills: ["React", "TypeScript", "Python", "SQL", "Figma", "用户研究"],
    detectedJobTypes: ["前端开发", "产品经理"],
    detectedCities: ["上海", "杭州"],
    education: {
      university: demoProfile.university,
      major: demoProfile.major,
    },
    confidence: 0.92,
  },
  appliedPatch: {
    university: demoProfile.university,
    major: demoProfile.major,
    skills: demoProfile.skills,
    targetCities: demoProfile.targetCities,
    preferredJobTypes: ["前端开发", "AI 产品"],
  },
  profile: {
    ...demoProfile,
    preferredJobTypes: ["前端开发", "AI 产品"],
  },
};

export const demoJobAnalysis: JobResumeAnalyzeResult = {
  analysis: {
    version: "demo-v1",
    generatedAt: "2026-04-17T02:45:00.000Z",
    overallScore: 82,
    verdict: "strong_match",
    summary: "你和这份前端实习岗位整体适配度较高，优势集中在交互台前实现和多角色协同，但还可以进一步增强性能与指标层面的表达。",
    matchedRequirements: [
      "具备 React + TypeScript 的真实项目实践",
      "能够把产品需求拆成清晰的交互与页面模块",
      "有跨角色合作经验，适合快速进入业务团队",
    ],
    gaps: [
      "缺少可验证的性能优化或工程质量指标",
      "没有明确展示组件复用或设计系统建设经验",
    ],
    resumeRisks: ["项目亮点分布平均，尚未突出一个足够“压箱底”的代表作", "技能关键词可再向岗位 JD 靠拢"],
    actionPlan: {
      topPriority: "把“校园活动助手后台”改写成这次投递的主叙事项目。",
      nextSteps: [
        "在项目描述中加入组件抽象、表单拆分和状态管理优化的证据",
        "补充页面复杂度、用户量或效率提升数据",
        "把标题定位成“前端开发实习生｜擅长复杂工作台与 AI 交互”",
      ],
    },
  },
  parsed: demoResumeDiagnosis.parsed,
  appliedPatch: demoResumeDiagnosis.appliedPatch,
  profile: demoResumeDiagnosis.profile,
};

export const demoJobRewriteSuggestions: JobResumeRewriteSuggestionsResult = {
  rewriteSuggestions: {
    version: "demo-v1",
    generatedAt: "2026-04-17T02:46:00.000Z",
    summary: "建议把原本偏课程式的表述改成“业务结果 + 技术动作 + 协作角色”，这样更容易对应岗位 JD。",
    headlineSuggestion: "前端开发实习候选人｜聚焦复杂工作台、AI 交互与数据驱动优化",
    summarySuggestion:
      "具备 React、TypeScript 与数据分析基础，曾独立完成后台工作台与 AI Web 原型搭建，擅长把需求拆解为清晰的信息结构与可落地交互。",
    keywordSuggestions: ["复杂工作台", "组件抽象", "状态管理", "交互优化", "AI 应用"],
    sectionSuggestions: [
      {
        section: "project",
        currentIssue: "独立完成 React + TypeScript 控制台搭建，支持活动发布、报名审核与数据看板",
        rewriteGoal: "突出复杂交互与业务承载能力",
        suggestedText:
          "独立设计并实现 React + TypeScript 校园活动工作台，覆盖发布、审核、数据看板三类核心流程，支撑活动全生命周期管理。",
      },
      {
        section: "project",
        currentIssue: "通过表单拆分和状态管理重构，将复杂页面平均首屏交互时间降低约 28%",
        rewriteGoal: "强调工程优化与量化结果",
        suggestedText:
          "针对复杂表单和多状态页面完成模块拆分与状态重构，使首屏交互响应耗时下降约 28%，提升后台运营效率。",
      },
      {
        section: "summary",
        currentIssue: "负责 Prompt 设计、前端交互和日志分析",
        rewriteGoal: "让 AI 项目描述更贴近岗位价值",
        suggestedText:
          "承担 AI 摘要工具的 Prompt 设计、前端交互落地与使用日志分析，推动原型在 120+ 次真实反馈中迭代验证。",
      },
    ],
    actionChecklist: [
      "把标题替换为更聚焦前端岗位的版本",
      "在技能区前置 React、TypeScript、工程化关键词",
      "给项目经历补充指标、规模和你的主导责任",
    ],
  },
  parsed: demoResumeDiagnosis.parsed,
  appliedPatch: demoResumeDiagnosis.appliedPatch,
  profile: demoResumeDiagnosis.profile,
};
