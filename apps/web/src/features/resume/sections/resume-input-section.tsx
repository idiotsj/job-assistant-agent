import { FileText, ScanSearch, Sparkles, UploadCloud } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type { ResumeActionStatus } from "../types";

function ResumeCodeView({ rawText }: { rawText: string }) {
  return (
    <div className="code-view">
      {rawText.split("\n").map((line, index) => (
        <div className="code-line" key={`${index}-${line}`}>
          <span className="code-line__number">{String(index + 1).padStart(2, "0")}</span>
          <span>{line || " "}</span>
        </div>
      ))}
    </div>
  );
}

interface ResumeInputSectionProps {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  rawText: string;
  actionStatus: ResumeActionStatus;
  resultStale: boolean;
  onRawTextChange: (nextValue: string) => void;
  onImportFile: (file: File | null) => Promise<void>;
  onParse: () => Promise<void>;
  onDiagnose: () => Promise<void>;
  onLoadDemo: () => void;
}

export function ResumeInputSection({
  sessionStatus,
  rawText,
  actionStatus,
  resultStale,
  onRawTextChange,
  onImportFile,
  onParse,
  onDiagnose,
  onLoadDemo,
}: ResumeInputSectionProps) {
  const importLabel = actionStatus === "importing" ? "正在导入..." : "导入文本文件";

  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>简历原文区</h2>
          <p>支持直接粘贴文本，或先导入 txt / md 文件后再走“先解析、再体检”的正式链路。</p>
        </div>
        <FileText size={18} color="hsl(var(--primary))" />
      </div>

      <div className="resume-input">
        <div className="dropzone">
          <UploadCloud size={26} />
          <strong>上传或粘贴你的简历文本</strong>
          <p>当前仍按接口约定提交纯文本。Word / PDF 请先转成文本，再导入到这里继续解析与体检。</p>
          <div className="page-header__actions">
            <label className="wa-button wa-button--secondary wa-button--md">
              {importLabel}
              <input
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  void onImportFile(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <Button variant="secondary" size="md" onClick={onLoadDemo}>
              载入演示简历
            </Button>
          </div>
        </div>

        <Textarea value={rawText} onChange={(event) => onRawTextChange(event.target.value)} />

        <div className="page-header__actions">
          <Button variant="secondary" size="lg" loading={actionStatus === "parsing"} onClick={() => void onParse()}>
            <ScanSearch size={16} />
            {resultStale ? "重新做结构解析" : "先做结构解析"}
          </Button>
          <Button size="lg" loading={actionStatus === "diagnosing"} onClick={() => void onDiagnose()}>
            <Sparkles size={16} />
            {resultStale ? "重新开始 AI 体检" : "开始 AI 体检"}
          </Button>
        </div>

        {sessionStatus !== "authenticated" ? (
          <div className="page-header__actions">
            <Link href="/login" className="wa-button wa-button--primary wa-button--md">
              去登录后联调
            </Link>
            <Link href="/register" className="wa-button wa-button--secondary wa-button--md">
              先注册
            </Link>
          </div>
        ) : null}
      </div>

      <ResumeCodeView rawText={rawText} />
    </Card>
  );
}
