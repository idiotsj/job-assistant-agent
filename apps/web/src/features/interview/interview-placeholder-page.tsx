"use client";

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

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ── 硬编码数据 ── */
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

const AI_ADVICE = {
  title: "AI 智能建议",
  desc: "建议今日练习'如何进行自我介绍'，AI 导师已为你生成了针对你为主管面的个性化开场白。",
  cta: "立即前往",
};

const AI_MENTOR = {
  avatar: "🤖",
  name: "AI 导师：HANG HANG",
  tags: ["AI 导师已就绪", "算法工程师 · 专项"],
  greeting:
    "你好，我是你的面试导师。针对你投递的华为算法岗，我们要开始第一轮模拟吗？",
};

const ANALYSIS = {
  radarLabels: ["表达力", "专业", "应变力", "逻辑性", "和力"],
  radarValues: [78, 85, 72, 90, 68],
  winRate: 82,
  aiAdvice:
    "你在临场处理上表现优异，但在'边界情况处理描述'上还有提升空间。建议今日重点练习异常处理类话术。",
};

/* ── 辅助：雷达图 SVG ── */
function InterviewRadarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const center = 100;
  const radius = 70;
  const angleStep = (Math.PI * 2) / labels.length;

  const points = values.map((v, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (v / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
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
      {[20, 40, 60, 80].map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: labels.length }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${center + (r / 100) * radius * Math.cos(angle)},${center + (r / 100) * radius * Math.sin(angle)}`;
          }).join(" ")}
          className="interview-radar__grid"
        />
      ))}
      {labels.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            className="interview-radar__grid"
          />
        );
      })}
      <polygon
        points={points.join(" ")}
        className="interview-radar__data"
      />
      {values.map((v, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = (v / 100) * radius;
        return (
          <circle
            key={i}
            cx={center + r * Math.cos(angle)}
            cy={center + r * Math.sin(angle)}
            r="3.5"
            className="interview-radar__dot"
          />
        );
      })}
      {labels.map((label, i) => {
        const angle = i * angleStep - Math.PI / 2;
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

/* ── 页面 ── */
export function InterviewPlaceholderPage() {
  const router = useRouter();

  return (
    <div className="interview-page">
      {/* 标题区 */}
      <div className="interview-page__header">
        <h1>面试模拟</h1>
      </div>

      {/* 面试礼仪须知 */}
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

      {/* AI 智能建议 */}
      <section className="interview-section">
        <Card className="interview-ai-advice">
          <div className="interview-ai-advice__body">
            <div className="interview-ai-advice__icon">
              <Sparkles size={18} />
            </div>
            <div>
              <strong>{AI_ADVICE.title}</strong>
              <p>{AI_ADVICE.desc}</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/interview/practice")}
          >
            {AI_ADVICE.cta}
          </Button>
        </Card>
      </section>

      {/* AI 导师模拟面试 */}
      <section className="interview-section">
        <Card className="interview-mentor">
          <div className="interview-mentor__tags">
            {AI_MENTOR.tags.map((tag) => (
              <span key={tag} className="interview-mentor__tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="interview-mentor__avatar">
            <span>{AI_MENTOR.avatar}</span>
          </div>

          <div className="interview-mentor__name">
            <span>{AI_MENTOR.name}</span>
          </div>

          <p className="interview-mentor__greeting">
            "{AI_MENTOR.greeting}"
          </p>
        </Card>
      </section>

      {/* 智能分析复盘与总结 */}
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
            <InterviewRadarChart
              labels={ANALYSIS.radarLabels}
              values={ANALYSIS.radarValues}
            />
          </div>

          <div className="interview-analysis__right">
            <div className="interview-analysis__winrate">
              <span className="interview-analysis__winrate-label">综合面试胜率</span>
              <div className="interview-analysis__winrate-bar">
                <div
                  className="interview-analysis__winrate-fill"
                  style={{ width: `${ANALYSIS.winRate}%` }}
                />
              </div>
              <span className="interview-analysis__winrate-num">
                {ANALYSIS.winRate}
              </span>
            </div>

            <div className="interview-analysis__ai-tip">
              <MessageSquare size={14} />
              <p>
                <strong>AI 建议：</strong>
                {ANALYSIS.aiAdvice}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
