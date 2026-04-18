"use client";

import type { UserProfile } from "@job-assistant/contracts/profile";
import { BookmarkCheck, GraduationCap, MapPinned, UserRound } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProfile, updateProfile } from "@/lib/api/profile";
import { formatUserFacingError } from "@/lib/errors";
import { demoProfile } from "@/features/shared/demo-data";
import { TagEditor } from "@/features/profile/tag-editor";

const suggestedIndustries = ["AI 产品", "互联网平台", "企业服务", "新消费", "教育科技"];
const suggestedCities = ["上海", "杭州", "深圳", "北京", "广州"];
const suggestedJobTypes = ["前端开发", "产品经理", "运营分析", "数据分析", "用户研究"];
const suggestedSkills = ["React", "TypeScript", "Python", "SQL", "Figma", "用户研究"];

function createEmptyProfile(userId: string): UserProfile {
  return {
    userId,
    university: "",
    major: "",
    grade: "",
    targetIndustries: [],
    targetCities: [],
    skills: [],
    preferredJobTypes: [],
    considersPostgraduate: false,
    considersCivilService: false,
    resumeData: null,
  };
}

export function ProfilePage() {
  const { status, user } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useEffectEvent(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const nextProfile = await getProfile();
      startTransition(() => {
        setProfile(nextProfile);
      });
    } catch (error) {
      startTransition(() => {
        setProfile(createEmptyProfile(user.id));
        setErrorMessage(formatUserFacingError(error, "画像暂时没取到，先继续填写也可以。"));
      });
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (status === "authenticated" && user) {
      void loadProfile();
    }
  }, [status, user]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextProfile = await updateProfile({
        university: profile.university,
        major: profile.major,
        grade: profile.grade,
        targetIndustries: profile.targetIndustries,
        targetCities: profile.targetCities,
        skills: profile.skills,
        preferredJobTypes: profile.preferredJobTypes,
        considersPostgraduate: profile.considersPostgraduate,
        considersCivilService: profile.considersCivilService,
      });

      startTransition(() => {
        setProfile(nextProfile);
        setMessage("画像已经保存，后续首页推荐和频道建议都会以这份画像为准。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "画像保存失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>用户画像</h1>
            <p>正在恢复登录状态，稍后就会展示可编辑画像。</p>
          </div>
        </div>
        <Card className="analysis-panel">
          <div className="message-strip">正在检查当前 Cookie Session，请稍候。</div>
        </Card>
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>用户画像</h1>
            <p>画像页需要登录后才能保存，它会直接影响首页推荐、日程提醒和考研/考公频道结果。</p>
          </div>
        </div>

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
      </div>
    );
  }

  const currentProfile = profile ?? createEmptyProfile(user.id);
  const completeness =
    Number(Boolean(currentProfile.university)) +
    Number(Boolean(currentProfile.major)) +
    Number(Boolean(currentProfile.grade)) +
    Number(currentProfile.targetCities.length > 0) +
    Number(currentProfile.targetIndustries.length > 0) +
    Number(currentProfile.preferredJobTypes.length > 0) +
    Number(currentProfile.skills.length > 0);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>用户画像</h1>
          <p>这里是后续所有个性化能力的核心输入层。先把你想去哪里、想投什么、会什么写清楚，推荐结果才会稳定。</p>
        </div>
        <div className="page-header__actions">
          <Badge tone="info">
            当前登录：{user.name ?? user.email}
          </Badge>
        </div>
      </div>

      <div className="profile-layout">
        <Card className="feature-panel">
          <div className="section-heading">
            <div>
              <h2>画像编辑区</h2>
              <p>保持字段和后端契约一致，不在前端自创另一套模型。</p>
            </div>
            <UserRound size={18} color="hsl(var(--primary))" />
          </div>

          {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}
          {message ? <div className="message-strip message-strip--success">{message}</div> : null}
          {loading ? <div className="message-strip">正在读取当前画像...</div> : null}

          <form className="profile-form" onSubmit={handleSave}>
            <div className="field-grid">
              <label className="field-group">
                <span className="field-label">学校</span>
                <Input
                  value={currentProfile.university}
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      university: event.target.value,
                    }))
                  }
                  placeholder="例如：复旦大学"
                />
              </label>

              <label className="field-group">
                <span className="field-label">专业</span>
                <Input
                  value={currentProfile.major}
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      major: event.target.value,
                    }))
                  }
                  placeholder="例如：信息管理与信息系统"
                />
              </label>

              <label className="field-group">
                <span className="field-label">年级</span>
                <Input
                  value={currentProfile.grade}
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      grade: event.target.value,
                    }))
                  }
                  placeholder="例如：大三 / 研一"
                />
              </label>
            </div>

            <TagEditor
              label="目标行业"
              value={currentProfile.targetIndustries}
              placeholder="输入想投递的行业"
              onChange={(nextValue) =>
                setProfile((previous) => ({
                  ...(previous ?? currentProfile),
                  targetIndustries: nextValue,
                }))
              }
            />

            <TagEditor
              label="目标城市"
              value={currentProfile.targetCities}
              placeholder="输入想优先投递的城市"
              onChange={(nextValue) =>
                setProfile((previous) => ({
                  ...(previous ?? currentProfile),
                  targetCities: nextValue,
                }))
              }
            />

            <TagEditor
              label="技能标签"
              value={currentProfile.skills}
              placeholder="输入你已经具备的技能"
              onChange={(nextValue) =>
                setProfile((previous) => ({
                  ...(previous ?? currentProfile),
                  skills: nextValue,
                }))
              }
            />

            <TagEditor
              label="意向岗位"
              value={currentProfile.preferredJobTypes}
              placeholder="输入想重点投递的岗位"
              onChange={(nextValue) =>
                setProfile((previous) => ({
                  ...(previous ?? currentProfile),
                  preferredJobTypes: nextValue,
                }))
              }
            />

            <div className="field-group">
              <span className="field-label">升学/考公意向</span>
              <div className="choice-row">
                <button
                  type="button"
                  className={`choice-toggle${currentProfile.considersPostgraduate ? " choice-toggle--active" : ""}`}
                  onClick={() =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      considersPostgraduate: !currentProfile.considersPostgraduate,
                    }))
                  }
                >
                  考研意向
                </button>
                <button
                  type="button"
                  className={`choice-toggle${currentProfile.considersCivilService ? " choice-toggle--active" : ""}`}
                  onClick={() =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      considersCivilService: !currentProfile.considersCivilService,
                    }))
                  }
                >
                  考公意向
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={saving}>
              保存画像
            </Button>
          </form>
        </Card>

        <div className="page-stack">
          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>当前画像摘要</h2>
                <p>这里适合持续保留一个右侧摘要位，帮助用户快速确认系统理解。</p>
              </div>
            </div>

            <div className="profile-stat">
              <strong>{completeness}/7</strong>
              <span>核心画像字段已完成</span>
            </div>

            <div className="bullet-stack">
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>基础信息</strong>
                  <span>{currentProfile.university || "待补学校"} / {currentProfile.major || "待补专业"} / {currentProfile.grade || "待补年级"}</span>
                </div>
              </div>
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>目标方向</strong>
                  <span>{currentProfile.preferredJobTypes.join(" / ") || "尚未设定意向岗位"}</span>
                </div>
              </div>
              <div className="list-item">
                <div className="bullet-dot" />
                <div>
                  <strong>目标城市</strong>
                  <span>{currentProfile.targetCities.join(" / ") || "尚未设定目标城市"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>建议先补哪些内容</h2>
                <p>把最影响推荐和频道判断的字段优先补齐。</p>
              </div>
            </div>

            <div className="tag-wall">
              {suggestedIndustries.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="suggestion-chip"
                  onClick={() =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      targetIndustries: currentProfile.targetIndustries.includes(item)
                        ? currentProfile.targetIndustries
                        : [...currentProfile.targetIndustries, item],
                    }))
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="tag-wall">
              {suggestedCities.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="suggestion-chip"
                  onClick={() =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      targetCities: currentProfile.targetCities.includes(item)
                        ? currentProfile.targetCities
                        : [...currentProfile.targetCities, item],
                    }))
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="tag-wall">
              {suggestedJobTypes.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="suggestion-chip"
                  onClick={() =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      preferredJobTypes: currentProfile.preferredJobTypes.includes(item)
                        ? currentProfile.preferredJobTypes
                        : [...currentProfile.preferredJobTypes, item],
                    }))
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="tag-wall">
              {suggestedSkills.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="suggestion-chip"
                  onClick={() =>
                    setProfile((previous) => ({
                      ...(previous ?? currentProfile),
                      skills: currentProfile.skills.includes(item)
                        ? currentProfile.skills
                        : [...currentProfile.skills, item],
                    }))
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </Card>

          <Card className="feature-panel">
            <div className="section-heading">
              <div>
                <h2>当前简历缓存</h2>
                <p>后端画像里的 `resumeData` 可能为空，这里只做状态说明，不伪造历史能力。</p>
              </div>
            </div>

            {currentProfile.resumeData ? (
              <div className="message-strip message-strip--success">已存在最近一次简历分析缓存，可继续用于诊断页参考。</div>
            ) : (
              <div className="message-strip">当前还没有简历缓存，建议完成画像后再去 `/resume` 进行首次诊断。</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
