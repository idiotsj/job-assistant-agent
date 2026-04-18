"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import {
  demoHomeRecommendation,
  demoProfile,
  demoScheduleItems,
  demoTodayContent,
  demoUser,
} from "@/features/shared/demo-data";
import { ApiError } from "@/lib/api/client";
import { getTodayContent } from "@/lib/api/daily-content";
import { formatUserFacingError } from "@/lib/errors";
import { getProfile } from "@/lib/api/profile";
import { getHomeRecommendations } from "@/lib/api/recommendation";
import { getScheduleTimeline } from "@/lib/api/schedule";

import type { HomeDashboardController, HomeDashboardState, HomeSyncReason } from "../types";
import { getHomeViewState, summarizeHomeModes } from "../utils";

const initialState: HomeDashboardState = {
  profile: demoProfile,
  recommendation: demoHomeRecommendation,
  todayContent: demoTodayContent,
  schedule: demoScheduleItems,
  modes: {
    profile: "demo",
    recommendation: "demo",
    todayContent: "demo",
    schedule: "demo",
  },
};

const initialMessage =
  "当前展示的是演示首页。登录完成后会自动尝试同步你的真实推荐、今日内容和时间线。";

export function useHomeDashboardData(): HomeDashboardController {
  const {
    user: sessionUser,
    status: sessionStatus,
    error: sessionError,
    refreshSession,
  } = useAuthSession();
  const [state, setState] = useState(initialState);
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState(initialMessage);
  const [messageTone, setMessageTone] = useState<"info" | "success">("info");
  const [errorMessage, setErrorMessage] = useState("");
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  const syncDashboard = useEffectEvent(async (reason: HomeSyncReason = "manual") => {
    if (sessionStatus === "loading") {
      setMessage("正在恢复当前登录状态，完成后会继续同步首页内容。");
      setMessageTone("info");
      setErrorMessage("");
      return;
    }

    if (sessionStatus !== "authenticated") {
      setMessage("正在重新检查登录状态。确认成功后，首页会自动切到你的真实内容。");
      setMessageTone("info");
      setErrorMessage("");
      void refreshSession();
      return;
    }

    setSyncStatus("loading");
    setErrorMessage("");
    setMessage(
      reason === "auto" ? "已检测到登录状态，正在自动同步首页实时内容。" : "正在同步首页实时内容。",
    );
    setMessageTone("info");

    const [profileResult, recommendationResult, todayContentResult, scheduleResult] =
      await Promise.allSettled([
        getProfile(),
        getHomeRecommendations(),
        getTodayContent(),
        getScheduleTimeline(),
      ]);

    const failures = [profileResult, recommendationResult, todayContentResult, scheduleResult].filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const hasUnauthorized = failures.some(
      (result) => result.reason instanceof ApiError && result.reason.status === 401,
    );

    if (hasUnauthorized) {
      setSyncStatus("idle");
      setMessage("检测到当前登录态已过期，正在重新检查并回到演示首页。");
      setMessageTone("info");
      setErrorMessage("");
      void refreshSession();
      return;
    }

    const successCount = [profileResult, recommendationResult, todayContentResult, scheduleResult].filter(
      (result) => result.status === "fulfilled",
    ).length;

    if (successCount > 0) {
      startTransition(() => {
        setState((current) => ({
          profile: profileResult.status === "fulfilled" ? profileResult.value : current.profile,
          recommendation:
            recommendationResult.status === "fulfilled"
              ? recommendationResult.value
              : current.recommendation,
          todayContent:
            todayContentResult.status === "fulfilled" ? todayContentResult.value : current.todayContent,
          schedule: scheduleResult.status === "fulfilled" ? scheduleResult.value : current.schedule,
          modes: {
            profile: profileResult.status === "fulfilled" ? "live" : current.modes.profile,
            recommendation:
              recommendationResult.status === "fulfilled" ? "live" : current.modes.recommendation,
            todayContent: todayContentResult.status === "fulfilled" ? "live" : current.modes.todayContent,
            schedule: scheduleResult.status === "fulfilled" ? "live" : current.modes.schedule,
          },
        }));
      });
    }

    if (successCount === 4) {
      setMessage("首页 4 个实时模块已经全部同步完成。");
      setMessageTone("success");
    } else if (successCount > 0) {
      setMessage(`已同步 ${successCount} / 4 个首页模块，未成功部分暂时保留演示内容。`);
      setMessageTone("info");
    } else if (failures[0]) {
      setErrorMessage(
        formatUserFacingError(
          failures[0].reason,
          "首页实时内容暂时没有同步成功，当前继续保留演示内容。",
        ),
      );
    }

    setSyncStatus("idle");
  });

  useEffect(() => {
    if (sessionStatus === "authenticated" && sessionUser && syncedUserId !== sessionUser.id) {
      setSyncedUserId(sessionUser.id);
      void syncDashboard("auto");
    }
  }, [sessionStatus, sessionUser, syncedUserId]);

  useEffect(() => {
    if (sessionStatus !== "unauthenticated") {
      return;
    }

    setSyncedUserId(null);
    startTransition(() => {
      setState(initialState);
      setSyncStatus("idle");
      setErrorMessage("");
      setMessage(
        sessionError instanceof ApiError && sessionError.status === 401
          ? "当前登录状态已失效，首页已回到演示内容。重新登录后会继续展示你的真实推荐。"
          : "当前未登录，首页继续保留演示内容；登录后即可替换成你的真实推荐、今日内容与时间线。",
      );
      setMessageTone("info");
    });
  }, [sessionStatus, sessionError]);

  const profile = state.profile;
  const recommendation = state.recommendation;
  const todayContent = state.todayContent;
  const timelinePreview = [...state.schedule]
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
    .slice(0, 3);
  const featuredJobs = todayContent.featuredJobs.slice(0, 3);
  const topRecommendation = recommendation.jobs[0] ?? null;
  const featuredCompany = todayContent.featuredCompany ?? recommendation.featuredCompany;
  const heroAdvice =
    state.modes.todayContent === "live" ? todayContent.dailyAdvice : recommendation.dailyAdvice;
  const profileNeedsAttention =
    profile.preferredJobTypes.length === 0 ||
    profile.targetCities.length === 0 ||
    profile.skills.length === 0;
  const actionChecklist = [
    profileNeedsAttention
      ? "先去画像页补齐目标岗位、城市和技能标签，首页推荐会更稳。"
      : "先确认首页识别的画像摘要是否准确，再决定今天主攻哪一条机会线。",
    featuredJobs[0]
      ? `优先查看“${featuredJobs[0].title}”这条今日精选岗位，判断它是否值得列入本周重点投递。`
      : topRecommendation
        ? `优先复核“${topRecommendation.title}”这条高契合岗位，决定是否进入正式投递准备。`
        : "如果当前没有高契合岗位，建议先去画像页补全偏好，再回来刷新首页。",
    timelinePreview[0]
      ? `把“${timelinePreview[0].title}”加入今天的跟进清单，避免错过时间节点。`
      : "把最近一个最强项目改成结果导向版本，再去跑一次简历体检。",
  ];

  const modeSummary = summarizeHomeModes(state.modes);

  return {
    data: {
      displayUser: sessionUser ?? demoUser,
      profile,
      recommendation,
      todayContent,
      timelinePreview,
      heroAdvice,
      featuredCompany,
      featuredJobs,
      topRecommendation,
      actionChecklist,
      profileNeedsAttention,
    },
    status: {
      sessionStatus,
      syncStatus,
      message,
      messageTone,
      errorMessage,
      modes: state.modes,
      ...modeSummary,
      viewState: getHomeViewState(sessionStatus, modeSummary.overallMode, errorMessage),
    },
    actions: {
      syncDashboard,
    },
  };
}
