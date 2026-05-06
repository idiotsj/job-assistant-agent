import Link from "next/link";

import { Card } from "@/components/ui/card";

export function ProfileResumeCacheSection({ hasResumeCache }: { hasResumeCache: boolean }) {
  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>简历状态</h2>
          <p>后端画像里的 `resumeData` 可能为空，这里只做真实状态说明，不伪造历史诊断能力。</p>
        </div>
      </div>

      {hasResumeCache ? (
        <div className="message-strip message-strip--success">已存在最近一次简历分析缓存，可继续用于诊断页参考。</div>
      ) : (
        <div className="message-strip">当前还没有简历缓存，建议完成画像后再去 `/resume` 进行首次诊断。</div>
      )}

      <div className="catalog-actions">
        <Link href="/resume" className="wa-button wa-button--primary wa-button--md">
          去简历页继续
        </Link>
        <Link href="/jobs" className="wa-button wa-button--secondary wa-button--md">
          去岗位页继续对齐
        </Link>
      </div>
    </Card>
  );
}
