"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserRound,
  BookOpen,
  Building2,
  Mic,
  GraduationCap,
  Landmark,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof UserRound;
}

const NAV_ITEMS: NavItem[] = [
  { label: "首页", href: "/", icon: Home },
  { label: "学生案例", href: "/cases", icon: BookOpen },
  { label: "就业广场", href: "/jobs", icon: Building2 },
  { label: "模拟面试", href: "/interview", icon: Mic },
  { label: "升学考研", href: "/postgraduate", icon: GraduationCap },
  { label: "考公之路", href: "/civil-service", icon: Landmark },
  { label: "个人中心", href: "/profile", icon: UserRound },
];

export function LeftRailNav() {
  const pathname = usePathname();

  return (
    <div className="left-rail-nav">
      <nav className="left-rail-nav__menu">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`left-rail-nav__menu-item${isActive ? " left-rail-nav__menu-item--active" : ""}`}
            >
              <Icon size={18} className="left-rail-nav__menu-icon" />
              <span className="left-rail-nav__menu-label">{item.label}</span>
              <ChevronRight size={14} className="left-rail-nav__menu-arrow" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
