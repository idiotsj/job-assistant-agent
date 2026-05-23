"use client";

import {
  Upload,
  Sparkles,
  Target,
  Star,
  Search,
  MapPin,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Send,
  TrendingUp,
  ChevronRight,
  User,
  Eye,
  Building2,
  Users,
  Calendar,
} from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CareerPlanSection } from "./sections/career-plan-section";

/* ── 硬编码数据 ── */
const RESUME_STATS = [
  { icon: Target, label: "关键命中率", value: "95%", desc: "核心技能与岗位要求高度匹配" },
  { icon: Star, label: "个性化润色", value: "", desc: "针对经历描述优化，提升简历通过率" },
];

const CITIES = ["全部", "上海", "杭州", "深圳", "北京", "广州"];
const INDUSTRIES = ["全部", "AI 产品", "企业服务", "互联网平台", "教育科技", "新消费", "数据智能"];

const JOB_CARDS = [
  {
    logo: "G",
    title: "算法工程师",
    subtitle: "专项基金池 · 实习直推",
    city: "北京",
    match: "96% 匹配",
    salary: "25k-35k",
    color: "#ef4444",
  },
  {
    logo: "♪",
    title: "AI 产品经理",
    subtitle: "AI 创新业务部 · 2026 届",
    city: "上海",
    match: "92% 匹配",
    salary: "18k-25k",
    color: "#3b82f6",
  },
];

const COMPANY_CARDS = [
  {
    name: "中国移动",
    logoColor: "#3b82f6",
    tags: ["网络工程师", "客户经理", "产品经理"],
    talk: "往期宣讲 2.29",
    hired: "去年录取 149",
  },
  {
    name: "中国电信",
    logoColor: "#06b6d4",
    tags: ["网络工程师", "客户经理", "产品经理"],
    talk: "往期宣讲 2.29",
    hired: "去年录取 160",
  },
  {
    name: "中国联通",
    logoColor: "#ef4444",
    tags: ["网络工程师", "客户经理", "产品经理"],
    talk: "往期宣讲 2.29",
    hired: "去年录取 166",
  },
];

const MARKET_TREND = [
  { year: "2021", value: 30 },
  { year: "2022", value: 45 },
  { year: "2023", value: 58 },
  { year: "2024", value: 72 },
  { year: "2025", value: 88 },
];

/* ── 市场趋势 SVG 图表 ── */
function MarketTrendChart() {
  const w = 280;
  const h = 140;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const maxVal = 100;
  const points = MARKET_TREND.map((d, i) => {
    const x = pad.left + (i / (MARKET_TREND.length - 1)) * chartW;
    const y = pad.top + chartH - (d.value / maxVal) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="market-trend__svg">
      <defs>
        <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 网格线 */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = pad.top + chartH - (v / maxVal) * chartH;
        return (
          <line key={v} x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        );
      })}
      {/* 面积 */}
      <path d={areaPath} fill="url(#trend-area)" />
      {/* 折线 */}
      <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* 数据点 */}
      {points.map((p) => (
        <circle key={p.year} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" />
      ))}
      {/* X轴标签 */}
      {points.map((p) => (
        <text key={p.year} x={p.x} y={h - 8} textAnchor="middle" fontSize="9" fill="hsl(var(--text-muted))">
          {p.year}
        </text>
      ))}
    </svg>
  );
}

/* ── 页面 ── */
export function JobsPage() {
  const [selectedCity, setSelectedCity] = useState("全部");
  const [selectedIndustry, setSelectedIndustry] = useState("全部");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [keyword, setKeyword] = useState("");

  return (
    <div className="jobs-plaza-page">
      {/* ===== 顶部标题 ===== */}
      <div className="jobs-plaza-header">
        <h1>就业广场</h1>
        <p>基于你的简历与院校背景，AI 为你智能匹配岗位、分析市场需求，并生成专属职业规划路径。</p>
      </div>

      {/* ===== 简历智能优化区 ===== */}
      <section className="jobs-plaza-section">
        <div className="jobs-plaza-section__title">
          <Briefcase size={18} />
          <h2>简历智能优化</h2>
        </div>
        <p className="jobs-plaza-section__desc">
          利用前沿 AI 算法，一键诊断简历质量，并根据目标岗位进行精准关键词优化，支持多种模板一键导出。
        </p>

        <div className="resume-optimize-layout">
          {/* 左侧：功能 */}
          <div className="resume-optimize-left">
            <div className="resume-stats">
              {RESUME_STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div className="resume-stat-item" key={s.label}>
                    <Icon size={16} className="resume-stat-item__icon" />
                    <div>
                      <strong>{s.label}</strong>
                      {s.value && <span className="resume-stat-item__value"> {s.value}</span>}
                      <p>{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="resume-actions">
              <Button variant="ghost" size="sm">
                <Upload size={14} />
                上传简历
              </Button>
              <Button variant="primary" size="sm">
                <Sparkles size={14} />
                一键生成
              </Button>
            </div>
          </div>

          {/* 右侧：简历预览卡片 */}
          <Card className="resume-preview-card">
            <div className="resume-preview-card__header">
              <div className="resume-preview-card__avatar">
                <User size={20} />
              </div>
              <div>
                <strong>个人简历</strong>
                <p>算法工程师 · 应届</p>
              </div>
              <Button variant="ghost" size="xs">预览</Button>
            </div>
            <div className="resume-preview-card__lines">
              <span /><span /><span /><span />
            </div>
          </Card>
        </div>
      </section>

      {/* ===== 筛选器区 ===== */}
      <section className="jobs-plaza-section">
        <Card className="jobs-filter-card">
          <div className="jobs-filter-card__header">
            <h3>筛选器</h3>
            <Search size={18} className="jobs-filter-card__search-icon" />
          </div>
          <p className="jobs-filter-card__desc">
            岗位页继续保留城市、行业、关键词和精选态筛选；筛选草稿和已应用结果分开维护，方便后续扩展更多条件。
          </p>

          <div className="jobs-filter-group">
            <label>关键词</label>
            <div className="jobs-filter-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="搜索岗位、公司、行业或技能"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="jobs-filter-group">
            <label>城市</label>
            <div className="jobs-filter-chips">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`jobs-filter-chip ${selectedCity === c ? "active" : ""}`}
                  onClick={() => setSelectedCity(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="jobs-filter-group">
            <label>行业</label>
            <div className="jobs-filter-chips">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  className={`jobs-filter-chip ${selectedIndustry === ind ? "active" : ""}`}
                  onClick={() => setSelectedIndustry(ind)}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="jobs-filter-footer">
            <button
              type="button"
              className="jobs-filter-toggle"
              onClick={() => setFeaturedOnly(!featuredOnly)}
            >
              {featuredOnly ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              <span>仅看精选岗位</span>
            </button>
            <div className="jobs-filter-actions">
              <Button variant="primary" size="sm">应用筛选</Button>
              <Button variant="ghost" size="sm">重置筛选</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ===== AI 岗位推荐 ===== */}
      <section className="jobs-plaza-section">
        <p className="jobs-plaza-section__subtitle">
          针对你目前的简历，AI 智能分析后为你推荐以下岗位与宣讲会
        </p>
        <div className="job-recommend-grid">
          {JOB_CARDS.map((job) => (
            <Card className="job-recommend-card" key={job.title}>
              <div className="job-recommend-card__top">
                <div className="job-recommend-card__logo" style={{ background: job.color }}>
                  {job.logo}
                </div>
                <div className="job-recommend-card__info">
                  <strong>{job.title}</strong>
                  <p>{job.subtitle}</p>
                </div>
                <span className="job-recommend-card__match">{job.match}</span>
              </div>
              <div className="job-recommend-card__meta">
                <span><MapPin size={12} /> {job.city}</span>
                <span><MapPin size={12} /> {job.city}</span>
              </div>
              <div className="job-recommend-card__salary">{job.salary}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== 校招企业推荐 ===== */}
      <section className="jobs-plaza-section">
        <div className="jobs-plaza-section__title-bar">
          <p>
            针对你的院校 <strong>重庆邮电大学</strong> 为信息行业的强校，为你推荐以下企业
          </p>
          <button type="button" className="jobs-plaza-section__more">
            查看更多 <ChevronRight size={14} />
          </button>
        </div>
        <div className="company-recommend-grid">
          {COMPANY_CARDS.map((comp) => (
            <Card className="company-recommend-card" key={comp.name}>
              <div className="company-recommend-card__header">
                <div className="company-recommend-card__logo" style={{ background: comp.logoColor }}>
                  <Building2 size={18} />
                </div>
                <strong>{comp.name}</strong>
              </div>
              <div className="company-recommend-card__tags">
                {comp.tags.map((t) => (
                  <span key={t} className="company-tag">{t}</span>
                ))}
              </div>
              <div className="company-recommend-card__footer">
                <span><Calendar size={12} /> {comp.talk}</span>
                <span><Users size={12} /> {comp.hired}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== AI 智能岗位咨询 + 市场趋势 ===== */}
      <section className="jobs-plaza-section">
        <div className="ai-consult-header">
          <span className="ai-consult-header__badge">Real-time AI Analysis</span>
          <h2>AI 智能岗位咨询</h2>
          <p>基于 2026 年最新行业趋势，为你匹配最适合的就业路径</p>
        </div>

        <div className="ai-consult-layout">
          {/* 左侧：AI 对话 */}
          <Card className="ai-consult-chat">
            <div className="ai-consult-chat__bubble">
              <div className="ai-consult-chat__avatar">
                <Sparkles size={16} />
              </div>
              <div className="ai-consult-chat__msg">
                您好！我是你的 AI 职业顾问。我已根据您的简历与院校背景，为你筛选出目前 AI 算法工程师方向的高需求岗位。您希望先了解哪个领域的岗位详情？
              </div>
            </div>
            <div className="ai-consult-chat__input">
              <input type="text" placeholder="向 AI 咨询更多职业建议..." />
              <Button variant="primary" size="icon-sm">
                <Send size={14} />
              </Button>
            </div>
          </Card>

          {/* 右侧：市场趋势 */}
          <Card className="market-trend-card">
            <h4>市场需求趋势</h4>
            <MarketTrendChart />
            <p className="market-trend-card__footer">
              <TrendingUp size={12} />
              市场均薪水平 8K-15K
            </p>
          </Card>
        </div>
      </section>

      {/* ===== 职业规划全周期 ===== */}
      <CareerPlanSection />
    </div>
  );
}
