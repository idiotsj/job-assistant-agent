import type { FormEvent } from "react";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { TagEditor } from "@/features/profile/tag-editor";

import type { UserProfile } from "@job-assistant/contracts/profile";

export function ProfileFormSection({
  profile,
  saving,
  onSubmit,
  onTextFieldChange,
  onTagFieldChange,
  onToggleFlag,
}: {
  profile: UserProfile;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onTextFieldChange: (field: "university" | "major" | "grade", value: string) => void;
  onTagFieldChange: (
    field: "targetIndustries" | "targetCities" | "skills" | "preferredJobTypes",
    nextValue: string[],
  ) => void;
  onToggleFlag: (field: "considersPostgraduate" | "considersCivilService") => void;
}) {
  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>画像编辑区</h2>
          <p>继续沿用真实 contract 字段做维护，把资料补全这件事收敛成一个稳定可扩展的编辑面板。</p>
        </div>
        <UserRound size={18} color="hsl(var(--primary))" />
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <div className="field-grid">
          <label className="field-group">
            <span className="field-label">学校</span>
            <Input
              value={profile.university}
              onChange={(event) => onTextFieldChange("university", event.target.value)}
              placeholder="例如：复旦大学"
            />
          </label>

          <label className="field-group">
            <span className="field-label">专业</span>
            <Input
              value={profile.major}
              onChange={(event) => onTextFieldChange("major", event.target.value)}
              placeholder="例如：信息管理与信息系统"
            />
          </label>

          <label className="field-group">
            <span className="field-label">年级</span>
            <Input
              value={profile.grade}
              onChange={(event) => onTextFieldChange("grade", event.target.value)}
              placeholder="例如：大三 / 研一"
            />
          </label>
        </div>

        <TagEditor
          label="目标行业"
          value={profile.targetIndustries}
          placeholder="输入想投递的行业"
          onChange={(nextValue) => onTagFieldChange("targetIndustries", nextValue)}
        />

        <TagEditor
          label="目标城市"
          value={profile.targetCities}
          placeholder="输入想优先投递的城市"
          onChange={(nextValue) => onTagFieldChange("targetCities", nextValue)}
        />

        <TagEditor
          label="技能标签"
          value={profile.skills}
          placeholder="输入你已经具备的技能"
          onChange={(nextValue) => onTagFieldChange("skills", nextValue)}
        />

        <TagEditor
          label="意向岗位"
          value={profile.preferredJobTypes}
          placeholder="输入想重点投递的岗位"
          onChange={(nextValue) => onTagFieldChange("preferredJobTypes", nextValue)}
        />

        <div className="field-group">
          <span className="field-label">升学/考公意向</span>
          <div className="choice-row">
            <button
              type="button"
              className={`choice-toggle${profile.considersPostgraduate ? " choice-toggle--active" : ""}`}
              onClick={() => onToggleFlag("considersPostgraduate")}
            >
              考研意向
            </button>
            <button
              type="button"
              className={`choice-toggle${profile.considersCivilService ? " choice-toggle--active" : ""}`}
              onClick={() => onToggleFlag("considersCivilService")}
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
  );
}
