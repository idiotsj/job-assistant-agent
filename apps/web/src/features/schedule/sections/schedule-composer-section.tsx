import { CalendarPlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ScheduleFormState } from "../types";

export function ScheduleComposerSection({
  editing,
  form,
  submitting,
  onFieldChange,
  onSubmit,
  onReset,
}: {
  editing: boolean;
  form: ScheduleFormState;
  submitting: boolean;
  onFieldChange: (field: keyof ScheduleFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onReset: () => void;
}) {
  const hasDraft = editing || form.title || form.startAt || form.endAt || form.city || form.description;

  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>{editing ? "编辑自定义日程" : "新增自定义日程"}</h2>
          <p>演示态下只更新当前页面预览；登录并同步到 live 后才会真正写入后端。</p>
        </div>
        <CalendarPlus2 size={18} color="hsl(var(--primary))" />
      </div>

      <form className="schedule-form" onSubmit={onSubmit}>
        <label className="field-group">
          <span className="field-label">标题</span>
          <Input
            value={form.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            placeholder="例如：修改简历项目经历"
            required
          />
        </label>

        <div className="field-grid schedule-form__grid">
          <label className="field-group">
            <span className="field-label">开始时间</span>
            <Input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => onFieldChange("startAt", event.target.value)}
              required
            />
          </label>
          <label className="field-group">
            <span className="field-label">结束时间</span>
            <Input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => onFieldChange("endAt", event.target.value)}
            />
          </label>
        </div>

        <label className="field-group">
          <span className="field-label">地点</span>
          <Input
            value={form.city}
            onChange={(event) => onFieldChange("city", event.target.value)}
            placeholder="线上 / 上海 / 杭州"
          />
        </label>

        <label className="field-group">
          <span className="field-label">说明</span>
          <Textarea
            value={form.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            placeholder="补充这条日程的上下文，例如：要完成哪一步、关联哪个岗位。"
          />
        </label>

        <div className="schedule-form__actions">
          <Button size="lg" type="submit" loading={submitting}>
            {editing ? "保存修改" : "加入时间线"}
          </Button>
          {hasDraft ? (
            <Button variant="secondary" size="lg" type="button" onClick={onReset}>
              清空编辑器
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
