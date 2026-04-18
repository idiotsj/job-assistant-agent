import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { ResumeSourceMode, ResumeWorkbenchData } from "../types";
import { formatConfidence, formatPatchValue, profileFieldLabels } from "../utils";

interface ResumeParseSectionProps {
  parseSnapshot: ResumeWorkbenchData["parseSnapshot"];
  parseSnapshotMode: ResumeSourceMode;
  patchEntries: ResumeWorkbenchData["patchEntries"];
}

export function ResumeParseSection({
  parseSnapshot,
  parseSnapshotMode,
  patchEntries,
}: ResumeParseSectionProps) {
  return (
    <>
      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>结构解析结果</h2>
            <p>{parseSnapshot.parsed.summary}</p>
          </div>
          <Badge tone={parseSnapshotMode === "live" ? "success" : "info"}>
            {parseSnapshotMode === "live" ? "实时解析" : "演示解析"}
          </Badge>
        </div>

        <div className="signal-grid">
          <Card className="signal-panel">
            <h3>解析置信度</h3>
            <p>{formatConfidence(parseSnapshot.parsed.confidence)}</p>
          </Card>
          <Card className="signal-panel">
            <h3>识别院校 / 专业</h3>
            <p>
              {parseSnapshot.parsed.education.university || "待识别院校"} ·{" "}
              {parseSnapshot.parsed.education.major || "待识别专业"}
            </p>
          </Card>
          <Card className="signal-panel">
            <h3>目标岗位信号</h3>
            <p>{parseSnapshot.parsed.detectedJobTypes.join(" / ") || "暂未识别到明确岗位方向"}</p>
          </Card>
        </div>

        <div className="dual-panel">
          <div className="page-stack">
            <strong>识别到的技能</strong>
            <div className="badge-wall">
              {parseSnapshot.parsed.detectedSkills.length > 0 ? (
                parseSnapshot.parsed.detectedSkills.map((item) => (
                  <Badge key={item} tone="info">
                    {item}
                  </Badge>
                ))
              ) : (
                <span className="small-copy">当前还没有识别到明确技能标签。</span>
              )}
            </div>
          </div>
          <div className="page-stack">
            <strong>识别到的城市信号</strong>
            <div className="badge-wall">
              {parseSnapshot.parsed.detectedCities.length > 0 ? (
                parseSnapshot.parsed.detectedCities.map((item) => (
                  <Badge key={item} tone="info">
                    {item}
                  </Badge>
                ))
              ) : (
                <span className="small-copy">当前没有从简历里识别到清晰城市偏好。</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="analysis-panel">
        <div className="section-heading">
          <div>
            <h2>自动补全画像</h2>
            <p>这里明确展示本次结构解析或体检写回了哪些画像字段，避免“后台悄悄改了什么”不透明。</p>
          </div>
        </div>

        {patchEntries.length === 0 ? (
          <div className="empty-state">
            <strong>本次没有新增补全字段</strong>
            <p>这通常意味着当前简历已经和画像信息比较一致，或者这次输入没有提供更多可写回线索。</p>
          </div>
        ) : (
          <div className="bullet-stack">
            {patchEntries.map(([key, value]) => (
              <div className="list-item" key={key}>
                <div className="bullet-dot" />
                <div>
                  <strong>{profileFieldLabels[key] ?? key}</strong>
                  <span>{formatPatchValue(value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <hr className="divider" />

        <div className="bullet-stack">
          <div className="list-item">
            <div className="bullet-dot" />
            <div>
              <strong>最新画像摘要</strong>
              <span>
                {(parseSnapshot.profile.university || "待补院校")} · {(parseSnapshot.profile.major || "待补专业")} ·{" "}
                {(parseSnapshot.profile.grade || "待补年级")}
              </span>
            </div>
          </div>
          <div className="list-item">
            <div className="bullet-dot" />
            <div>
              <strong>目标岗位</strong>
              <span>{parseSnapshot.profile.preferredJobTypes.join(" / ") || "当前还没有明确目标岗位"}</span>
            </div>
          </div>
          <div className="list-item">
            <div className="bullet-dot" />
            <div>
              <strong>技能标签</strong>
              <span>{parseSnapshot.profile.skills.join(" · ") || "当前还没有技能标签"}</span>
            </div>
          </div>
        </div>

        <div className="catalog-actions">
          <Link href="/profile" className="wa-button wa-button--primary wa-button--md">
            去画像页核对补全结果
          </Link>
          <Link href="/jobs" className="wa-button wa-button--secondary wa-button--md">
            去岗位页继续对齐
          </Link>
        </div>
      </Card>
    </>
  );
}
