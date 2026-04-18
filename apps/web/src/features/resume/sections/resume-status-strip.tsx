import { AlertCircle, Sparkles } from "lucide-react";

import type { ResumeMessageTone } from "../types";

interface ResumeStatusStripProps {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  message: string;
  messageTone: ResumeMessageTone;
  errorMessage: string;
  resultStale: boolean;
}

export function ResumeStatusStrip({
  sessionStatus,
  message,
  messageTone,
  errorMessage,
  resultStale,
}: ResumeStatusStripProps) {
  return (
    <>
      <div className="panel-note">
        <AlertCircle size={18} />
        <span>
          {sessionStatus === "authenticated"
            ? "真实接口每次都需要提交当前简历原文。建议先跑结构解析，确认自动补全结果，再继续进行 AI 体检。"
            : "当前可以先看演示结构与视觉效果，但真实结构解析和 AI 体检都需要登录后才能调用。"}
        </span>
      </div>
      {resultStale ? (
        <div className="panel-note panel-note--warning">
          <Sparkles size={16} />
          <span>你已经更新了简历原文，当前展示的解析和体检结果对应旧文本，请重新运行。</span>
        </div>
      ) : null}
      {message ? (
        <div className={`message-strip${messageTone === "success" ? " message-strip--success" : ""}`}>
          {message}
        </div>
      ) : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}
    </>
  );
}
