import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";

import type { HomeDashboardData } from "../types";

interface HomeMetricsSectionProps {
  topRecommendation: HomeDashboardData["topRecommendation"];
  featuredJobs: HomeDashboardData["featuredJobs"];
  timelinePreview: HomeDashboardData["timelinePreview"];
}

export function HomeMetricsSection({
  topRecommendation,
  featuredJobs,
  timelinePreview,
}: HomeMetricsSectionProps) {
  const metrics = [
    {
      label: "最高契合岗位",
      value: topRecommendation ? `${topRecommendation.score}%` : "--",
      copy: topRecommendation?.title ?? "当前没有高契合岗位推荐",
    },
    {
      label: "今日精选岗位",
      value: `${featuredJobs.length}`,
      copy:
        featuredJobs.length > 0
          ? "来自 daily-content 的今日精选内容块"
          : "当前没有可展示的今日精选岗位",
    },
    {
      label: "时间线提醒",
      value: `${timelinePreview.length}`,
      copy: timelinePreview[0] ? `最近一条：${timelinePreview[0].title}` : "当前没有可展示的时间线提醒",
    },
    {
      label: "求职准备指数",
      value: `${Math.round(
        ((topRecommendation?.score ?? 0) + featuredJobs.length * 12 + timelinePreview.length * 10) / 1.6,
      )}`,
      copy: "基于推荐强度、今日精选和时间线数量的粗略估算",
    },
  ];

  return (
    <section className="metric-grid">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
        >
          <Card className="metric-card">
            <h3 className="metric-card__label">{metric.label}</h3>
            <strong>{metric.value}</strong>
            <p>{metric.copy}</p>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}
