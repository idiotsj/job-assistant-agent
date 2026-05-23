"use client";

import {
  Plus,
  Trash2,
  Search,
  Sparkles,
  Download,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ── 硬编码占位思维导图数据 ── */
const MIND_MAP_DATA = {
  center: "AI 算法工程师",
  branches: [
    {
      label: "基础技能",
      children: ["数据结构", "算法设计", "Python/C++", "机器学习基础"],
    },
    {
      label: "进阶能力",
      children: ["深度学习框架", "模型优化", "分布式训练", "论文复现"],
    },
    {
      label: "工程实践",
      children: ["模型部署", "推理加速", "A/B 测试", "监控运维"],
    },
    {
      label: "软技能",
      children: ["技术沟通", "项目管理", "团队协作", "业务理解"],
    },
  ],
};

/* ── 占位思维导图 SVG ── */
function CareerMindMap() {
  const w = 720;
  const h = 320;
  const cx = 100;
  const cy = h / 2;
  const branchX = 280;
  const leafX = 520;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="career-mindmap__svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="mindmap-center" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent-blue))" />
        </linearGradient>
        <filter id="mindmap-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 中心节点 */}
      <rect
        x={cx - 60}
        y={cy - 22}
        width={120}
        height={44}
        rx={10}
        fill="url(#mindmap-center)"
        filter="url(#mindmap-glow)"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="700"
        fill="#fff"
      >
        {MIND_MAP_DATA.center}
      </text>

      {/* 分支 + 叶子 */}
      {MIND_MAP_DATA.branches.map((branch, bi) => {
        const branchY = 60 + bi * 70;
        const leafStartY = branchY - ((branch.children.length - 1) * 28) / 2;

        return (
          <g key={branch.label}>
            {/* 中心 → 分支 连线 */}
            <path
              d={`M ${cx + 60} ${cy} C ${cx + 120} ${cy}, ${branchX - 40} ${branchY}, ${branchX - 50} ${branchY}`}
              fill="none"
              stroke="hsl(var(--primary) / 0.4)"
              strokeWidth="1.5"
            />

            {/* 分支节点 */}
            <rect
              x={branchX - 50}
              y={branchY - 18}
              width={100}
              height={36}
              rx={8}
              fill="hsl(var(--primary-soft))"
              stroke="hsl(var(--primary) / 0.3)"
              strokeWidth="1"
            />
            <text
              x={branchX}
              y={branchY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="600"
              fill="hsl(var(--text-primary))"
            >
              {branch.label}
            </text>

            {/* 分支 → 叶子 连线 */}
            {branch.children.map((_, ci) => {
              const ly = leafStartY + ci * 28;
              return (
                <path
                  key={ci}
                  d={`M ${branchX + 50} ${branchY} C ${branchX + 90} ${branchY}, ${leafX - 50} ${ly}, ${leafX - 50} ${ly}`}
                  fill="none"
                  stroke="hsl(var(--border-soft))"
                  strokeWidth="1"
                />
              );
            })}

            {/* 叶子节点 */}
            {branch.children.map((leaf, ci) => {
              const ly = leafStartY + ci * 28;
              return (
                <g key={leaf}>
                  <rect
                    x={leafX - 50}
                    y={ly - 14}
                    width={100}
                    height={28}
                    rx={6}
                    fill="hsl(var(--bg-surface-soft))"
                    stroke="hsl(var(--border-soft))"
                    strokeWidth="1"
                  />
                  <text
                    x={leafX}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fill="hsl(var(--text-secondary))"
                  >
                    {leaf}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ── 板块 ── */
export function CareerPlanSection() {
  return (
    <section className="career-plan-section">
      <div className="career-plan-section__header">
        <h2>职业规划全周期</h2>
        <p>
          系统性拆解你的职业目标，从技能补充到晋升路径，AI
          为你绘制每一步成长地图。支持自定义生成、删除与查找节点。
        </p>
      </div>

      <Card className="career-plan-card">
        {/* 工具栏 */}
        <div className="career-plan-toolbar">
          <Button variant="primary" size="sm">
            <Plus size={14} />
            新增节点
          </Button>
          <button type="button" className="career-plan-toolbar__btn">
            <Trash2 size={14} />
            删除
          </button>
          <button type="button" className="career-plan-toolbar__btn">
            <Search size={14} />
            查找
          </button>
          <button type="button" className="career-plan-toolbar__btn">
            <Sparkles size={14} />
            AI 生成
          </button>
          <button type="button" className="career-plan-toolbar__btn">
            <Download size={14} />
            导出
          </button>
        </div>

        {/* 思维导图 */}
        <div className="career-mindmap">
          <CareerMindMap />
        </div>

        {/* 查看完整 */}
        <div className="career-plan-footer">
          <button type="button" className="career-plan-footer__link">
            查看完整 <ChevronRight size={14} />
          </button>
        </div>
      </Card>
    </section>
  );
}
