"use client";

import type { InterviewPracticeStatus, InterviewPracticeWorkspace } from "@job-assistant/contracts/interview";
import {
  Shirt,
  Video,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInterviewPracticeWorkspace } from "@/lib/api/interview";
import { formatUserFacingError } from "@/lib/errors";

const ETIQUETTE_ITEMS = [
  {
    icon: Shirt,
    title: "着装建议：商务休闲",
    desc: "简洁纯色正装，深色卫衣或衬衫更显精神。",
  },
  {
    icon: Video,
    title: "视频面环境",
    desc: "确保光线从斜前方射入，避免背光晃眼。背景整洁。",
  },
];

const DEMO_WORKSPACE: InterviewPracticeWorkspace = {
  status: "building",
  title: "面试模拟练习区",
  summary: "当前先提供一个可联调的占位工作区，帮助前端对齐后端边界和演示路径。",
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
      description: "承接后续评分摘要、复盘记录和行动建议。",
    },
  ],
  suggestion: {
    title: "当前建议先完成投递前准备",
    summary: "在正式面试引擎上线前，优先把简历诊断、岗位分析和改写建议跑顺。",
    ctaLabel: "继续完善简历与岗位准备",
  },
  recommendedActions: [
    "先完成一轮简历诊断，补齐最关键的表达短板。",
    "对目标岗位跑一次岗位定向分析，确认匹配点和缺口。",
    "把需要强化的项目经历整理成 2 到 3 个可口述案例。",
  ],
};

const DEMO_INTERVIEW_ADVICE = {
  title: "AI 智能建议",
  desc: "建议今日练习“如何进行自我介绍”，先把岗位分析里最关键的匹配点整理成一段稳定开场白。",
  cta: "进入练习区",
};

const DEMO_MENTOR = {
  avatar: "🤖",
  name: "AI 导师：HANG HANG",
  tags: ["AI 导师已就绪", "算法工程师 · 专项"],
  greeting:
    "你好，我是你的面试导师。当前先把岗位分析和简历表达准备扎实，后续我们再进入完整模拟。",
};

const DEMO_ANALYSIS = {
  radarLabels: ["表达力", "专业", "应变力", "逻辑性", "亲和力"],
  radarValues: [78, 85, 72, 90, 68],
  winRate: 82,
  aiAdvice:
    "你在临场处理上表现优异，但在“边界情况处理描述”上还有提升空间。建议今日重点练习异常处理类话术。",
};

function InterviewRadarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const center = 100;
  const radius = 70;
  const angleStep = (Math.PI * 2) / labels.length;

  const points = values.map((value, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const pointRadius = (value / 100) * radius;
    return `${center + pointRadius * Math.cos(angle)},${center + pointRadius * Math.sin(angle)}`;
  });

  return (
    <svg viewBox="0 0 200 200" className="interview-radar__svg">
      <defs>
        <radialGradient id="interview-radar-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={center} cy={center} r={radius + 10} fill="url(#interview-radar-glow)" />
      {[20, 40, 60, 80].map((gridRadius) => (
        <polygon
          key={gridRadius}
          points={Array.from({ length: labels.length }, (_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            return `${center + (gridRadius / 100) * radius * Math.cos(angle)},${center + (gridRadius / 100) * radius * Math.sin(angle)}`;
          }).join(" ")}
          className="interview-radar__grid"
        />
      ))}
      {labels.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            className="interview-radar__grid"
          />
        );
      })}
      <polygon points={points.join(" ")} className="interview-radar__data" />
      {values.map((value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const pointRadius = (value / 100) * radius;
        return (
          <circle
            key={index}
            cx={center + pointRadius * Math.cos(angle)}
            cy={center + pointRadius * Math.sin(angle)}
            r="3.5"
            className="interview-radar__dot"
          />
        );
      })}
      {labels.map((label, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const labelRadius = radius + 20;
        return (
          <text
            key={label}
            x={center + labelRadius * Math.cos(angle)}
            y={center + labelRadius * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="600"
            className="interview-radar__label"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function getWorkspaceStatusLabel(status: InterviewPracticeStatus) {
  return status === "building" ? "建设中" : "规划中";
}

function getSyncNote(
  sessionStatus: "loading" | "authenticated" | "unauthenticated",
  isPracticeRoute: boolean,
  workspaceMode: "demo" | "live",
) {
  if (sessionStatus === "loading") {
    return "正在确认当前登录状态，稍后就会决定是否同步真实占位工作区。";
  }

  if (sessionStatus !== "authenticated") {
    return isPracticeRoute
      ? "当前先展示练习区预览；登录后会同步真实占位工作区状态，但不会伪装成完整面试引擎。"
      : "当前先展示面试模块预览；登录后进入练习区时会同步真实占位工作区状态。";
  }

  return workspaceMode === "live"
    ? "当前练习区已接上真实占位接口，但完整题目流、AI 陪练和评分能力仍在后续阶段。"
    : "当前先保留演示预览，避免工作区在接口异常时出现空白。";
}

export function InterviewPlaceholderPage({ mode = "hub" }: { mode?: "hub" | "practice" }) {
  const router = useRouter();
  const { status: sessionStatus } = useAuthSession();
  const isPracticeRoute = mode === "practice";
  const [workspace, setWorkspace] = useState<InterviewPracticeWorkspace | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<"demo" | "live">("demo");
  const [message, setMessage] = useState(
    isPracticeRoute
      ? "当前页面会优先同步真实占位工作区状态；完整面试引擎仍在后续阶段。"
      : "当前先展示面试模块总览；进入练习区后会继续同步真实占位工作区状态。",
  );
  const [messageTone, setMessageTone] = useState<"info" | "success">("info");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus !== "authenticated") {
      startTransition(() => {
        setWorkspace(null);
        setWorkspaceMode("demo");
        setErrorMessage("");
        setMessage(
          isPracticeRoute
            ? "登录后会同步真实练习区状态；当前先保留占位预览，方便继续演示页面结构。"
            : "当前先展示面试模块总览；登录后再进入练习区同步真实占位工作区。",
        );
        setMessageTone("info");
      });
      return;
    }

    let cancelled = false;

    startTransition(() => {
      setErrorMessage("");
      setMessage("正在同步当前面试工作区状态。");
      setMessageTone("info");
    });

    void getInterviewPracticeWorkspace()
      .then((nextWorkspace) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setWorkspace(nextWorkspace);
          setWorkspaceMode("live");
          setMessage(
            isPracticeRoute
              ? "练习区已切到真实占位接口结果；完整题目流和 AI 陪练仍在建设中。"
              : "面试工作区状态已同步；当前首页入口仍以占位工作区和演示内容为主。",
          );
          setMessageTone("success");
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setWorkspace(null);
          setWorkspaceMode("demo");
          setMessage(
            isPracticeRoute
              ? "当前先保留演示占位工作区，避免练习区在接口异常时出现空白。"
              : "当前先保留面试模块预览，稍后可以再同步真实工作区状态。",
          );
          setMessageTone("info");
          setErrorMessage(formatUserFacingError(error, "面试工作区暂时没同步到，当前先保留演示内容。"));
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isPracticeRoute, sessionStatus]);

  const resolvedWorkspace = workspace ?? DEMO_WORKSPACE;
  const mentorTags =
    workspaceMode === "live"
      ? resolvedWorkspace.availableModules.slice(0, 2).map((module) => module.title)
      : DEMO_MENTOR.tags;
  const mentorGreeting = workspaceMode === "live" ? resolvedWorkspace.summary : DEMO_MENTOR.greeting;
  const adviceTitle = isPracticeRoute ? resolvedWorkspace.suggestion.title : DEMO_INTERVIEW_ADVICE.title;
  const adviceDescription = isPracticeRoute ? resolvedWorkspace.suggestion.summary : DEMO_INTERVIEW_ADVICE.desc;
  const adviceCta =
    isPracticeRoute && sessionStatus !== "authenticated"
      ? "登录后同步练习区"
      : isPracticeRoute
        ? resolvedWorkspace.suggestion.ctaLabel
        : DEMO_INTERVIEW_ADVICE.cta;
  const analysisAdvice =
    workspaceMode === "live" ? resolvedWorkspace.recommendedActions[0] ?? DEMO_ANALYSIS.aiAdvice : DEMO_ANALYSIS.aiAdvice;

  function handlePrimaryAction() {
    if (!isPracticeRoute) {
      router.push("/interview/practice");
      return;
    }

    router.push(sessionStatus === "authenticated" ? "/resume" : "/login");
  }

  return (
    <div className="interview-page">
      <div className="interview-page__header">
        <h1>{isPracticeRoute ? resolvedWorkspace.title : "面试模拟"}</h1>
      </div>

      {message ? (
        <div className={`message-strip${messageTone === "success" ? " message-strip--success" : ""}`}>{message}</div>
      ) : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

      <div className={`panel-note${sessionStatus !== "authenticated" ? " panel-note--warning" : ""}`}>
        <Sparkles size={16} />
        <span>{getSyncNote(sessionStatus, isPracticeRoute, workspaceMode)}</span>
      </div>

      <section className="interview-section">
        <div className="interview-section__title-bar">
          <h2>
            <TrendingUp size={16} />
            当前工作区状态
          </h2>
        </div>
        <Card>
          <div className="page-stack">
            <div className="tag-row">
              <span className={`wa-badge ${workspaceMode === "live" ? "wa-badge--success" : "wa-badge--neutral"}`}>
                {workspaceMode === "live" ? "live 占位接口" : "demo 预览"}
              </span>
              <span className="wa-badge wa-badge--info">{getWorkspaceStatusLabel(resolvedWorkspace.status)}</span>
            </div>

            <p className="drawer-copy">{resolvedWorkspace.summary}</p>

            <div className="list-stack">
              {resolvedWorkspace.availableModules.map((module) => (
                <div key={module.id} className="list-item">
                  <ArrowRight size={16} />
                  <div>
                    <strong>{module.title}</strong>
                    <span>{module.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="interview-section">
        <div className="interview-section__title-bar">
          <h2>面试礼仪须知</h2>
          <button type="button" className="interview-section__more">
            查看手册 <ChevronRight size={14} />
          </button>
        </div>
        <div className="interview-etiquette-grid">
          {ETIQUETTE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="interview-etiquette-card">
                <div className="interview-etiquette-card__icon">
                  <Icon size={18} />
                </div>
                <div className="interview-etiquette-card__body">
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="interview-section">
        <Card className="interview-ai-advice">
          <div className="interview-ai-advice__body">
            <div className="interview-ai-advice__icon">
              <Sparkles size={18} />
            </div>
            <div>
              <strong>{adviceTitle}</strong>
              <p>{adviceDescription}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handlePrimaryAction}>
            {adviceCta}
          </Button>
        </Card>
      </section>

      <section className="interview-section">
        <Card className="interview-mentor">
          <div className="interview-mentor__tags">
            {mentorTags.map((tag) => (
              <span key={tag} className="interview-mentor__tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="interview-mentor__avatar">
            <span>{DEMO_MENTOR.avatar}</span>
          </div>

          <div className="interview-mentor__name">
            <span>{DEMO_MENTOR.name}</span>
          </div>

          <p className="interview-mentor__greeting">"{mentorGreeting}"</p>
        </Card>
      </section>

      <section className="interview-section">
        <div className="interview-section__title-bar">
          <h2>
            <BarChart3 size={16} />
            智能分析复盘与总结
          </h2>
          <button type="button" className="interview-section__more">
            查看往期 <ChevronRight size={14} />
          </button>
        </div>

        <Card className="interview-analysis">
          <div className="interview-analysis__left">
            <InterviewRadarChart labels={DEMO_ANALYSIS.radarLabels} values={DEMO_ANALYSIS.radarValues} />
          </div>

          <div className="interview-analysis__right">
            <div className="interview-analysis__winrate">
              <span className="interview-analysis__winrate-label">综合面试胜率</span>
              <div className="interview-analysis__winrate-bar">
                <div
                  className="interview-analysis__winrate-fill"
                  style={{ width: `${DEMO_ANALYSIS.winRate}%` }}
                />
              </div>
              <span className="interview-analysis__winrate-num">{DEMO_ANALYSIS.winRate}</span>
            </div>

            <div className="interview-analysis__ai-tip">
              <MessageSquare size={14} />
              <p>
                <strong>AI 建议：</strong>
                {analysisAdvice}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="interview-section">
        <Card>
          <div className="page-stack">
            <div className="interview-section__title-bar">
              <h2>当前推荐行动</h2>
            </div>
            <ul className="checklist">
              {resolvedWorkspace.recommendedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
