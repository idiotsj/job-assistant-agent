import Link from "next/link";
import type { ElementType } from "react";
import { BookOpen, Building2, ChevronRight, GraduationCap, Landmark, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

interface KnowledgeTreeLink {
  label: string;
  href: string;
  icon: ElementType;
}

const DEFAULT_LINKS: KnowledgeTreeLink[] = [
  { label: "个人中心", href: "/profile", icon: UserRound },
  { label: "学生案例", href: "/cases", icon: BookOpen },
  { label: "就业广场", href: "/jobs", icon: Building2 },
  { label: "升学考研", href: "/postgraduate", icon: GraduationCap },
  { label: "考公之路", href: "/civil-service", icon: Landmark },
];

interface KnowledgeTreeCardProps {
  title?: string;
  links?: KnowledgeTreeLink[];
  className?: string;
}

export function KnowledgeTreeCard({
  title = "综合就业知识树",
  links = DEFAULT_LINKS,
  className,
}: KnowledgeTreeCardProps) {
  return (
    <div className={cn("knowledge-tree-card", className)}>
      <span className="knowledge-tree-card__title">{title}</span>
      <nav className="knowledge-tree-card__list">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="knowledge-tree-card__link">
              <Icon size={18} className="knowledge-tree-card__link-icon" />
              <span className="knowledge-tree-card__link-label">{link.label}</span>
              <ChevronRight size={16} className="knowledge-tree-card__link-chevron" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
