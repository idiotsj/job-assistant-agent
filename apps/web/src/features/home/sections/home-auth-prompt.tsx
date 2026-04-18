import { LogIn } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function HomeAuthPrompt() {
  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>登录后可查看你的真实首页</h2>
          <p>当前仍保留演示内容方便看效果，但真实的首页推荐、今日精选岗位和时间线都依赖登录态。</p>
        </div>
        <Badge tone="warning">
          <LogIn size={14} />
          需要登录
        </Badge>
      </div>
      <div className="catalog-actions">
        <Link href="/login" className="wa-button wa-button--primary wa-button--md">
          去登录
        </Link>
        <Link href="/register" className="wa-button wa-button--secondary wa-button--md">
          先注册
        </Link>
      </div>
    </Card>
  );
}
