import { Sparkles } from "lucide-react";

import type { JobDrawerMessageTone, JobDrawerViewState } from "../types";
import { getAiTaskStatusLabel } from "../utils";

function getStatusNote(
  sessionStatus: "loading" | "authenticated" | "unauthenticated",
  viewState: JobDrawerViewState,
) {
  if (sessionStatus === "loading") {
    return "正在确认当前登录状态，稍后就能判断是否可以切到真实岗位分析。";
  }

  if (sessionStatus !== "authenticated") {
    return "未登录时只展示结构预览，不会伪装成你的真实个人结果。";
  }

  if (viewState === "stale-live") {
    return "你已经改过原文，当前 live 模块结果对应的是旧文本，重新运行后才会刷新。";
  }

  if (viewState === "ready-live") {
    return "岗位分析和改写建议都来自实时接口，可以作为当前投递前的参考。";
  }

  if (viewState === "partial-live") {
    return "当前为 mixed 状态：部分模块已切到实时结果，剩余模块仍保留 demo 兜底。";
  }

  return "当前仍是结构预览；点击按钮后才会把岗位分析和改写建议切到真实接口。";
}

export function JobAnalysisDrawerStatus({
  sessionStatus,
  viewState,
  rewriteTaskStatus,
  taskChannel,
  activeTaskId,
  message,
  messageTone,
  errorMessage,
}: {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  viewState: JobDrawerViewState;
  rewriteTaskStatus: "idle" | "pending" | "running" | "succeeded" | "failed" | "cancelled";
  taskChannel: "idle" | "websocket" | "polling";
  activeTaskId: string | null;
  message: string;
  messageTone: JobDrawerMessageTone;
  errorMessage: string;
}) {
  const statusNote = getStatusNote(sessionStatus, viewState);
  const warningNote = sessionStatus !== "authenticated" || viewState === "stale-live";

  return (
    <>
      {message ? <div className={`message-strip${messageTone === "success" ? " message-strip--success" : ""}`}>{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

      <div className="drawer-note-stack">
        <div className={`panel-note${warningNote ? " panel-note--warning" : ""}`}>
          <Sparkles size={16} />
          <span>{statusNote}</span>
        </div>
        {activeTaskId ? (
          <div className="panel-note">
            <Sparkles size={16} />
            <span>
              改写建议任务状态：{getAiTaskStatusLabel(rewriteTaskStatus)}
              {taskChannel === "websocket" ? "，当前通过 WebSocket 接收通知。" : ""}
              {taskChannel === "polling" ? "，当前已降级为轮询刷新。" : ""}
            </span>
          </div>
        ) : null}
        <div className="panel-note">
          <Sparkles size={16} />
          <span>AI 结果是辅助建议，不替代你对岗位取舍与简历表述的最终判断。</span>
        </div>
      </div>
    </>
  );
}
