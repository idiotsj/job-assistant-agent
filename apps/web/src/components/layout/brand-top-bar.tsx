"use client";

import { Bell, Sparkles } from "lucide-react";

import { useAuthSession } from "@/components/providers/auth-provider";

function formatDateString(): string {
  const now = new Date();
  return now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function BrandTopBar() {
  const { user, status } = useAuthSession();

  const displayName = user?.name ?? "访客";
  const initials = (displayName ?? "YH").slice(0, 1).toUpperCase();
  const roleLabel =
    status === "authenticated"
      ? user?.email ?? "已登录"
      : status === "loading"
        ? "正在恢复会话"
        : "未登录";

  return (
    <header className="brand-top-bar">
      <div className="brand-top-bar__left">
        <div className="brand-top-bar__logo">
          <Sparkles size={20} />
        </div>
        <div className="brand-top-bar__brand">
          <span className="brand-top-bar__brand-name">YU HANG</span>
          <span className="brand-top-bar__brand-date">{formatDateString()}</span>
        </div>
        <span className="brand-top-bar__subtitle">智能生涯助手</span>
      </div>

      <div className="brand-top-bar__right">
        <button type="button" className="brand-top-bar__notification" aria-label="通知">
          <Bell size={20} />
        </button>

        <div className="brand-top-bar__user">
          <div className="brand-top-bar__avatar">{initials}</div>
          <div className="brand-top-bar__user-info">
            <span className="brand-top-bar__user-name">{displayName}</span>
            <span className="brand-top-bar__user-meta">{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
