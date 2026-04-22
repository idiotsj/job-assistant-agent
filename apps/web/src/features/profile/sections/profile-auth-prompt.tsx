import { BookmarkCheck, GraduationCap, MapPinned } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

export function ProfileAuthPrompt() {
  return (
    <div className="auth-grid">
      <Card className="auth-panel auth-panel--hero">
        <div className="auth-hero__copy">
          <h2>先登录，再让系统真正认识你</h2>
          <p>目标城市、行业、岗位方向和技能标签，是后续推荐、AI 建议和日程聚合的基础输入。</p>
        </div>
        <div className="auth-hero__stack">
          <div className="auth-hero__item">
            <MapPinned size={18} />
            <div>
              <strong>目标城市</strong>
              <span>决定首页机会召回范围与活动优先级。</span>
            </div>
          </div>
          <div className="auth-hero__item">
            <BookmarkCheck size={18} />
            <div>
              <strong>岗位偏好</strong>
              <span>决定推荐岗位和简历诊断的目标方向。</span>
            </div>
          </div>
          <div className="auth-hero__item">
            <GraduationCap size={18} />
            <div>
              <strong>升学/考公意向</strong>
              <span>决定独立频道和考试提醒是否进入你的时间线。</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="auth-panel">
        <div className="auth-form__header">
          <h2>当前是游客状态</h2>
          <p>登录后即可保存画像并解锁完整个性化内容。</p>
        </div>
        <div className="page-header__actions">
          <Link href="/login" className="wa-button wa-button--primary wa-button--lg">
            去登录
          </Link>
          <Link href="/register" className="wa-button wa-button--secondary wa-button--lg">
            去注册
          </Link>
        </div>
      </Card>
    </div>
  );
}
