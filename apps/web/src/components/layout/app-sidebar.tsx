"use client";

import {
  Building2,
  CalendarRange,
  CalendarDays,
  BriefcaseBusiness,
  BookMarked,
  BookOpenText,
  LayoutDashboard,
  Landmark,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthSession } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    title: "首页总览",
    copy: "推荐流与今日洞察",
    icon: LayoutDashboard,
  },
  {
    href: "/resume",
    title: "简历体检",
    copy: "AI 解析与诊断",
    icon: Sparkles,
  },
  {
    href: "/jobs",
    title: "岗位对齐",
    copy: "投递匹配与改写",
    icon: BriefcaseBusiness,
  },
  {
    href: "/profile",
    title: "用户画像",
    copy: "偏好与目标配置",
    icon: UserRound,
  },
  {
    href: "/companies",
    title: "企业列表",
    copy: "行业与城市浏览",
    icon: Building2,
  },
  {
    href: "/cases",
    title: "学生案例",
    copy: "路径参考与经验拆解",
    icon: BookMarked,
  },
  {
    href: "/events",
    title: "活动宣讲会",
    copy: "近期活动与报名节点",
    icon: CalendarDays,
  },
  {
    href: "/schedule",
    title: "日程时间线",
    copy: "聚合节点与个人安排",
    icon: CalendarRange,
  },
  {
    href: "/postgraduate",
    title: "考研频道",
    copy: "升学建议与节奏判断",
    icon: BookOpenText,
  },
  {
    href: "/civil-service",
    title: "考公频道",
    copy: "城市导向与准备建议",
    icon: Landmark,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { status, user, logoutSession } = useAuthSession();

  const accountName = user?.name ?? "访客模式";
  const accountRole =
    status === "authenticated" ? user?.email ?? "已登录用户" : status === "loading" ? "正在恢复登录态" : "未登录";
  const initials = (accountName ?? "WA").slice(0, 1).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">
          <Star size={20} />
        </div>
        <div>
          <h1 className="sidebar__brand-title">Work Agent</h1>
          <p className="sidebar__brand-copy">智能求职工作台</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar__link", active && "sidebar__link--active")}
            >
              {active ? <motion.span layoutId="sidebar-active" className="sidebar__link-indicator" /> : null}
              <Icon size={18} />
              <div className="sidebar__meta">
                <span className="sidebar__meta-title">{item.title}</span>
                <span className="sidebar__meta-copy">{item.copy}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__status">
          <Badge tone={status === "authenticated" ? "success" : "info"}>
            {status === "authenticated" ? "已连接账号" : status === "loading" ? "正在恢复会话" : "演示数据兜底"}
          </Badge>
          <h3>蓝白系体验版</h3>
          <p>首页、岗位、画像、企业、案例、活动、日程和双频道建议都已接入同一套蓝白系工作台骨架。</p>
        </div>

        <div className="sidebar__account">
          <div className="sidebar__avatar">{initials}</div>
          <div>
            <h3>{accountName}</h3>
            <p>{accountRole}</p>
          </div>
        </div>

        <div className="sidebar__actions">
          {status === "authenticated" ? (
            <>
              <Link href="/profile" className="wa-button wa-button--secondary wa-button--sm">
                去完善画像
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void logoutSession()}>
                退出登录
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="wa-button wa-button--primary wa-button--sm">
                登录
              </Link>
              <Link href="/register" className="wa-button wa-button--secondary wa-button--sm">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
