"use client";

import { useRouter } from "next/navigation";
import { Zap, Wand2, CheckCircle, Target, TrendingUp, Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { HomeDashboardData, HomeDashboardStatus } from "../types";

interface HomeHeroSectionProps {
  stageTask: HomeDashboardData["stageTask"];
  profile: HomeDashboardData["profile"];
  profileNeedsAttention: boolean;
  modes: HomeDashboardStatus["modes"];
  recommendation: HomeDashboardData["recommendation"];
}

export function HomeHeroSection({
  stageTask,
  profile,
  profileNeedsAttention,
  modes,
  recommendation,
}: HomeHeroSectionProps) {
  const router = useRouter();

  const competitiveness = [
    { label: "专业技能匹配度", value: 92, color: "hsl(var(--primary))" },
    { label: "项目经历丰富度", value: 78, color: "hsl(var(--primary))" },
    { label: "实习经历相关性", value: 65, color: "hsl(var(--accent-orange))" },
  ];

  const radarLabels = ["学业", "实践", "心理", "能力", "创新"];
  const radarValues = [85, 70, 90, 75, 80];
  const angleStep = (Math.PI * 2) / radarLabels.length;

  return (
    <section className="home-hero-section">
      <div className="home-hero-main">
        <Card className="home-task-card" padded={false}>
          <div className="home-task-card__header">
            <Badge tone="info" className="home-task-card__badge">
              大三下学期核心任务
            </Badge>
          </div>
          <h2 className="home-task-card__title">{stageTask.title}</h2>
          <p className="home-task-card__desc">{stageTask.explanation}</p>

          <div className="home-task-card__keywords">
            <span className="home-task-card__keyword-label">AI 已抓取个人画像关键词</span>
            <div className="home-task-card__keyword-tags">
              {profile.skills.slice(0, 4).map((skill) => (
                <span key={skill} className="home-task-card__keyword-tag">
                  {skill}
                </span>
              ))}
              <span className="home-task-card__keyword-tag home-task-card__keyword-tag--more">
                +3 新标签
              </span>
            </div>
          </div>

          <div className="home-task-card__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(stageTask.primaryActionHref)}
              className="home-task-card__btn-primary"
            >
              <Zap size={16} />
              {stageTask.primaryActionLabel}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push(stageTask.secondaryActionHref)}
            >
              <Wand2 size={16} />
              {stageTask.secondaryActionLabel}
            </Button>
            <button
              type="button"
              className="home-task-card__link"
              onClick={() => router.push("/schedule")}
            >
              任务清单 &gt;
            </button>
          </div>

          <div className="home-task-card__footer">
            <div className="home-task-card__footer-item">
              <Award size={14} />
              <span>
                简历竞争力：<strong>优于 85% 同学</strong>
              </span>
            </div>
            <div className="home-task-card__footer-item">
              <Target size={14} />
              <span>
                求职意向：<strong>{profile.preferredJobTypes.join(" / ") || "待补充"}</strong>
              </span>
            </div>
          </div>
        </Card>

        <Card className="home-profile-card" padded={false}>
          <div className="home-profile-card__header">
            <h3>个人画像</h3>
            <Badge tone={modes.profile === "live" ? "success" : "info"}>
              {modes.profile === "live" ? "已完整" : "演示"}
            </Badge>
          </div>
          <div className="home-profile-card__score">
            <span className="home-profile-card__score-num">7</span>
            <span className="home-profile-card__score-total">/7</span>
            <span className="home-profile-card__score-label">核心画像维度已完成</span>
          </div>
          <p className="home-profile-card__sub">画像已进入稳定可用阶段</p>
          <div className="home-profile-card__info">
            <div className="home-profile-card__info-item">
              <CheckCircle size={14} className="home-profile-card__info-icon" />
              <span>
                基础信息：{profile.university || "待补充"} / {profile.major || "待补充"} / {profile.grade || "待补充"}
              </span>
            </div>
            <div className="home-profile-card__info-item">
              <CheckCircle size={14} className="home-profile-card__info-icon" />
              <span>目标方向：{profile.preferredJobTypes.join(" / ") || "待补充"}</span>
            </div>
          </div>
          {profileNeedsAttention ? (
            <p className="home-profile-card__warning">画像还不够完整，建议补齐后再刷新</p>
          ) : null}
        </Card>
      </div>

      <div className="home-hero-side">
        <Card className="home-compete-card" padded={false}>
          <div className="home-compete-card__header">
            <TrendingUp size={16} />
            <h3>竞争力分析</h3>
          </div>
          <div className="home-compete-card__bars">
            {competitiveness.map((item) => (
              <div key={item.label} className="home-compete-card__bar-row">
                <div className="home-compete-card__bar-top">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="home-compete-card__bar-track">
                  <div
                    className="home-compete-card__bar-fill"
                    style={{
                      width: `${item.value}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="home-compete-card__tip">
            <span className="home-compete-card__tip-icon">💡</span>
            <span>
              建议补充：增加一段与"前端开发"强相关的实习或项目经历，竞争力可提升至 85%+
            </span>
          </div>
        </Card>

        <Card className="home-radar-card" padded={false}>
          <div className="home-radar-card__header">
            <h3>用户状态图</h3>
            <span className="home-radar-card__sub">心理/能力</span>
          </div>
          <div className="home-radar-card__chart">
            <svg viewBox="0 0 200 200" className="home-radar-card__svg">
              <defs>
                <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="80" fill="url(#radar-glow)" />
              {[20, 40, 60, 80].map((r) => (
                <polygon
                  key={r}
                  points={Array.from({ length: 5 }, (_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    return `${100 + (r / 100) * 80 * Math.cos(angle)},${100 + (r / 100) * 80 * Math.sin(angle)}`;
                  }).join(" ")}
                  className="radar-grid-polygon"
                />
              ))}
              {radarLabels.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={100}
                    y1={100}
                    x2={100 + 80 * Math.cos(angle)}
                    y2={100 + 80 * Math.sin(angle)}
                    className="radar-grid-line"
                  />
                );
              })}
              <polygon
                points={radarValues.map((v, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const r = (v / 100) * 80;
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                }).join(" ")}
                className="radar-data-polygon"
              />
              {radarValues.map((v, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const r = (v / 100) * 80;
                return (
                  <circle
                    key={i}
                    cx={100 + r * Math.cos(angle)}
                    cy={100 + r * Math.sin(angle)}
                    r="3.5"
                    className="radar-data-dot"
                  />
                );
              })}
              {radarLabels.map((label, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const labelRadius = 80 + 18;
                const x = 100 + labelRadius * Math.cos(angle);
                const y = 100 + labelRadius * Math.sin(angle);
                return (
                  <text
                    key={label}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="600"
                    className="radar-label-text"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="home-radar-card__scale">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="home-radar-card__scale-item">
                <span className="home-radar-card__scale-num">{n}</span>
                <span className="home-radar-card__scale-bar" data-level={n} />
              </div>
            ))}
          </div>
          <div className="home-radar-card__labels">
            <span>心理压力：低</span>
            <span>今日：晴</span>
          </div>
        </Card>
      </div>
    </section>
  );
}
