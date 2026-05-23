"use client";

import { Bell, ChevronDown, LogIn, LogOut, Moon, Sparkles, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { useTheme } from "@/hooks/use-theme";

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
  const router = useRouter();
  const { user, status, logoutSession } = useAuthSession();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = user?.name ?? "访客";
  const initials = (displayName ?? "YH").slice(0, 1).toUpperCase();
  const roleLabel =
    status === "authenticated"
      ? user?.email ?? "已登录"
      : status === "loading"
        ? "正在恢复会话"
        : "未登录";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logoutSession();
    router.push("/");
    router.refresh();
  }

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

        <button
          type="button"
          className="brand-top-bar__theme-toggle"
          aria-label={theme === "dark" ? "切换白天模式" : "切换黑夜模式"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="brand-top-bar__account" ref={menuRef}>
          <button
            type="button"
            className="brand-top-bar__user"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <div className="brand-top-bar__avatar">{initials}</div>
            <div className="brand-top-bar__user-info">
              <span className="brand-top-bar__user-name">{displayName}</span>
              <span className="brand-top-bar__user-meta">{roleLabel}</span>
            </div>
            <ChevronDown
              size={16}
              className={`brand-top-bar__chevron${menuOpen ? " brand-top-bar__chevron--open" : ""}`}
            />
          </button>

          {menuOpen ? (
            <div className="brand-top-bar__menu" role="menu">
              {status === "authenticated" ? (
                <>
                  <Link
                    href="/profile"
                    className="brand-top-bar__menu-item"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={16} />
                    个人中心
                  </Link>
                  <button
                    type="button"
                    className="brand-top-bar__menu-item"
                    role="menuitem"
                    onClick={() => void handleLogout()}
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </>
              ) : (
                <div className="brand-top-bar__menu-actions">
                  <Link href="/login" className="wa-button wa-button--primary wa-button--sm" onClick={() => setMenuOpen(false)}>
                    <LogIn size={16} />
                    登录
                  </Link>
                  <Link href="/register" className="wa-button wa-button--secondary wa-button--sm" onClick={() => setMenuOpen(false)}>
                    注册
                  </Link>
                </div>
              )}
              {status === "loading" ? (
                <div className="brand-top-bar__menu-hint">正在恢复登录态…</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
