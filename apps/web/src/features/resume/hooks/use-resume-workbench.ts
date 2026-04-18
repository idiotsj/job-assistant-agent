"use client";

import { startTransition, useMemo, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { demoResumeDiagnosis, demoResumeText } from "@/features/shared/demo-data";
import { diagnoseProfileResume, parseProfileResume } from "@/lib/api/profile";

import type {
  ResumeMessageTone,
  ResumeWorkbenchActions,
  ResumeWorkbenchData,
  ResumeWorkbenchStatus,
} from "../types";
import {
  demoResumeParseResult,
  getPatchEntries,
  getResumeActionError,
  getResumeViewState,
  isSupportedResumeTextFile,
} from "../utils";

interface ResumeWorkbenchController {
  data: ResumeWorkbenchData;
  status: ResumeWorkbenchStatus;
  actions: ResumeWorkbenchActions;
}

const initialMessage =
  "当前展示结构预览与演示诊断结果；登录后可以按“先解析、再体检”的顺序调用真实接口。";

export function useResumeWorkbench(): ResumeWorkbenchController {
  const { status: sessionStatus } = useAuthSession();
  const [rawText, setRawText] = useState(demoResumeText);
  const [parseResult, setParseResult] = useState(demoResumeParseResult);
  const [diagnosisResult, setDiagnosisResult] = useState(demoResumeDiagnosis);
  const [parseMode, setParseMode] = useState<"demo" | "live">("demo");
  const [diagnosisMode, setDiagnosisMode] = useState<"demo" | "live">("demo");
  const [actionStatus, setActionStatus] = useState<"idle" | "importing" | "parsing" | "diagnosing">("idle");
  const [message, setMessage] = useState(initialMessage);
  const [messageTone, setMessageTone] = useState<ResumeMessageTone>("info");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultStale, setResultStale] = useState(false);

  const parseSnapshot = diagnosisMode === "live"
    ? {
        parsed: diagnosisResult.parsed,
        appliedPatch: diagnosisResult.appliedPatch,
        profile: diagnosisResult.profile,
      }
    : parseResult;
  const parseSnapshotMode = diagnosisMode === "live" ? "live" : parseMode;
  const patchEntries = useMemo(
    () => getPatchEntries(parseSnapshot.appliedPatch as Record<string, unknown>),
    [parseSnapshot],
  );

  function updateRawText(nextValue: string) {
    const hasLiveResult = parseSnapshotMode === "live" || diagnosisMode === "live";
    const changed = rawText !== nextValue;

    setRawText(nextValue);
    setErrorMessage("");

    if (!changed) {
      return;
    }

    if (hasLiveResult) {
      setResultStale(true);

      if (!resultStale) {
        setMessage("简历原文已更新，当前解析和体检结果对应的是旧文本，请重新运行。");
        setMessageTone("info");
      }

      return;
    }

    setMessage("");
  }

  function ensureCanRun() {
    setErrorMessage("");

    if (!rawText.trim()) {
      setMessage("");
      setErrorMessage("请先粘贴简历文本，再开始结构解析或 AI 体检。");
      return false;
    }

    if (sessionStatus === "loading") {
      setMessage("");
      setErrorMessage("正在检查当前登录状态，请稍候片刻再试。");
      return false;
    }

    if (sessionStatus !== "authenticated") {
      setMessage("");
      setErrorMessage("真实简历解析和 AI 体检都需要登录后才能调用。当前保留的是演示结构预览。");
      return false;
    }

    return true;
  }

  async function importTextFile(file: File | null) {
    if (!file) {
      return;
    }

    setActionStatus("importing");
    setErrorMessage("");

    try {
      if (!isSupportedResumeTextFile(file)) {
        setMessage("");
        setErrorMessage("当前只支持导入 txt / md 文本文件。Word 或 PDF 请先转成纯文本后再导入。");
        return;
      }

      const nextText = await file.text();

      if (!nextText.trim()) {
        setMessage("");
        setErrorMessage("导入的文本文件是空的，请换一个文件再试。");
        return;
      }

      updateRawText(nextText);
      setMessage(
        parseSnapshotMode === "live" || diagnosisMode === "live"
          ? `已导入 ${file.name}。当前结果已标记为旧文本结果，请重新运行解析或体检。`
          : `已导入 ${file.name}，可以先做结构解析。`,
      );
      setMessageTone("info");
    } finally {
      setActionStatus("idle");
    }
  }

  async function handleParse() {
    if (!ensureCanRun()) {
      return;
    }

    setActionStatus("parsing");
    setMessage("");

    try {
      const next = await parseProfileResume({
        rawText,
        fileName: "resume.txt",
      });

      startTransition(() => {
        setParseResult(next);
        setParseMode("live");
        setResultStale(false);
        setMessage("结构解析已切换到真实结果，下面可以继续做 AI 体检。");
        setMessageTone("success");
      });
    } catch (error) {
      setErrorMessage(getResumeActionError(error, "parse"));
    } finally {
      setActionStatus("idle");
    }
  }

  async function handleDiagnose() {
    if (!ensureCanRun()) {
      return;
    }

    setActionStatus("diagnosing");
    setMessage("");

    try {
      const next = await diagnoseProfileResume({
        rawText,
        fileName: "resume.txt",
      });

      startTransition(() => {
        setDiagnosisResult(next);
        setDiagnosisMode("live");
        setParseResult({
          parsed: next.parsed,
          appliedPatch: next.appliedPatch,
          profile: next.profile,
        });
        setParseMode("live");
        setResultStale(false);
        setMessage("AI 体检已切换到真实结果，本次自动补全的画像字段也已经同步刷新。");
        setMessageTone("success");
      });
    } catch (error) {
      setErrorMessage(getResumeActionError(error, "diagnose"));
    } finally {
      setActionStatus("idle");
    }
  }

  function resetToDemo() {
    setRawText(demoResumeText);
    setParseResult(demoResumeParseResult);
    setDiagnosisResult(demoResumeDiagnosis);
    setParseMode("demo");
    setDiagnosisMode("demo");
    setActionStatus("idle");
    setResultStale(false);
    setMessage("已回到演示预览状态，方便继续看页面结构与文案效果。");
    setMessageTone("info");
    setErrorMessage("");
  }

  function loadDemoResume() {
    if (parseSnapshotMode === "live" || diagnosisMode === "live") {
      resetToDemo();
      return;
    }

    setRawText(demoResumeText);
    setResultStale(false);
    setMessage("已载入演示简历文本。");
    setMessageTone("info");
    setErrorMessage("");
  }

  return {
    data: {
      rawText,
      parseResult,
      diagnosisResult,
      parseSnapshot,
      parseMode,
      diagnosisMode,
      parseSnapshotMode,
      patchEntries,
    },
    status: {
      sessionStatus,
      actionStatus,
      message,
      messageTone,
      errorMessage,
      resultStale,
      viewState: getResumeViewState(sessionStatus, parseSnapshotMode, diagnosisMode, resultStale),
    },
    actions: {
      updateRawText,
      importTextFile,
      handleParse,
      handleDiagnose,
      resetToDemo,
      loadDemoResume,
    },
  };
}
