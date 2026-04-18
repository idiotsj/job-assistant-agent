import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { HomeDashboardData, HomeSourceMode } from "../types";
import { getGreeting } from "../utils";

interface HomeHeroSectionProps {
  displayUser: HomeDashboardData["displayUser"];
  heroAdvice: HomeDashboardData["heroAdvice"];
  profile: HomeDashboardData["profile"];
  featuredJobs: HomeDashboardData["featuredJobs"];
  todayContentMode: HomeSourceMode;
}

export function HomeHeroSection({
  displayUser,
  heroAdvice,
  profile,
  featuredJobs,
  todayContentMode,
}: HomeHeroSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="wa-card--hero" padded={false}>
        <div className="hero-card">
          <div className="hero-card__body">
            <div>
              <Badge tone={todayContentMode === "live" ? "success" : "info"}>
                <Sparkles size={14} />
                {todayContentMode === "live" ? "今日内容已实时同步" : "今日内容演示预览"}
              </Badge>
              <h2>
                {getGreeting()}
                {displayUser.name ? `，${displayUser.name}` : ""}。工作智能体已为你整理好今天最值得投入的机会。
              </h2>
              <p>{heroAdvice.body}</p>
            </div>

            <div className="hero-card__meta">
              {(profile.targetIndustries.length > 0 || profile.targetCities.length > 0
                ? [...profile.targetIndustries, ...profile.targetCities]
                : ["就业优先", "今日精选", "岗位对齐"]
              ).map((item) => (
                <span key={item} className="tag-pill">
                  {item}
                </span>
              ))}
            </div>

            <div className="page-header__actions">
              <Link href="/resume" className="wa-button wa-button--primary wa-button--lg">
                去做简历体检
                <ArrowRight size={16} />
              </Link>
              <Link href="/jobs" className="wa-button wa-button--secondary wa-button--lg">
                查看岗位对齐
              </Link>
              <Link href="/schedule" className="wa-button wa-button--secondary wa-button--lg">
                打开时间线
              </Link>
            </div>
          </div>

          <div className="hero-card__aside">
            <div>
              <div className="hero-card__aside-label">Today Focus</div>
              <div className="hero-card__aside-title">{heroAdvice.title}</div>
            </div>
            <div className="hero-card__aside-copy">{heroAdvice.body}</div>
            <Badge tone="success">来源：{heroAdvice.source}</Badge>
            <span className="small-copy">
              {featuredJobs.length > 0
                ? `今日还为你挑出了 ${featuredJobs.length} 条精选岗位。`
                : "今日精选岗位会在同步成功后出现在这里。"}
            </span>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
