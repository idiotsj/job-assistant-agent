"use client";

import type { Job } from "@job-assistant/contracts/jobs";
import { startTransition, useEffect, useEffectEvent, useMemo, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { demoJobs } from "@/features/shared/demo-data";
import { getJob } from "@/lib/api/jobs";
import { ApiError } from "@/lib/api/client";
import { formatUserFacingError } from "@/lib/errors";

import type { JobDetailActions, JobDetailData, JobDetailStatus } from "../types";
import {
  buildJobContinueLinks,
  buildJobReminders,
  buildJobTimeItems,
  createJobInsight,
  getJobDetailViewState,
} from "../utils";

interface JobDetailPageController {
  data: JobDetailData;
  status: JobDetailStatus;
  actions: JobDetailActions;
}

export function useJobDetailPage(jobId: string): JobDetailPageController {
  const { status: sessionStatus } = useAuthSession();
  const demoJob = useMemo(() => demoJobs.find((item) => item.id === jobId) ?? null, [jobId]);
  const [job, setJob] = useState<Job | null>(demoJob);
  const [mode, setMode] = useState<"demo" | "live">(demoJob ? "demo" : "live");
  const [loading, setLoading] = useState(!demoJob);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadLiveJob = useEffectEvent(async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");
    setNotFound(false);

    try {
      const nextJob = await getJob(jobId);
      startTransition(() => {
        setJob(nextJob);
        setMode("live");
        setMessage("岗位详情已经切换为真实接口结果。");
        setErrorMessage("");
        setNotFound(false);
      });
    } catch (error) {
      startTransition(() => {
        if (error instanceof ApiError && error.status === 404) {
          if (demoJob) {
            setJob(demoJob);
            setMode("demo");
            setErrorMessage("真实岗位不存在或已下线，当前先保留演示详情结构。");
            setNotFound(false);
            return;
          }

          setJob(null);
          setErrorMessage("这个岗位不存在，或当前已经下线。");
          setNotFound(true);
          return;
        }

        if (!demoJob) {
          setJob(null);
        }

        setErrorMessage(formatUserFacingError(error, "岗位详情读取失败，请稍后再试。"));
      });
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    setDrawerOpen(false);
    setMessage("");
    setErrorMessage("");
    setNotFound(false);

    if (demoJob) {
      setJob(demoJob);
      setMode("demo");
      setLoading(false);
      return;
    }

    setJob(null);
    setMode("live");
    setLoading(true);
    void loadLiveJob();
  }, [demoJob, jobId]);

  return {
    data: {
      job,
      mode,
      insight: job ? createJobInsight(job) : "",
      timeItems: job ? buildJobTimeItems(job) : [],
      reminders: job ? buildJobReminders(job) : [],
      continueLinks: job ? buildJobContinueLinks(job) : [],
    },
    status: {
      sessionStatus,
      loading,
      message,
      errorMessage,
      notFound,
      drawerOpen,
      viewState: getJobDetailViewState({
        job,
        mode,
        loading,
        errorMessage,
        notFound,
      }),
    },
    actions: {
      syncLiveJob: loadLiveJob,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    },
  };
}
