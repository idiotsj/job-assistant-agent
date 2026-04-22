"use client";

import type { JobListQuery } from "@job-assistant/contracts/jobs";
import { startTransition, useEffectEvent, useState } from "react";

import { listJobs } from "@/lib/api/jobs";
import { formatUserFacingError } from "@/lib/errors";

import type { JobsPageActions, JobsPageData, JobsPageResponse, JobsPageStatus } from "../types";
import {
  buildJobsSummaryCards,
  defaultJobFilters,
  getDemoJobsResponse,
  getJobsViewState,
  jobsCityOptions,
  jobsIndustryOptions,
} from "../utils";

interface JobsPageController {
  data: JobsPageData;
  status: JobsPageStatus;
  actions: JobsPageActions;
}

export function useJobsPage(): JobsPageController {
  const [filters, setFilters] = useState<JobListQuery>(defaultJobFilters);
  const [appliedFilters, setAppliedFilters] = useState<JobListQuery>(defaultJobFilters);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [liveResponse, setLiveResponse] = useState<JobsPageResponse | null>(null);

  const demoResponse = getDemoJobsResponse(appliedFilters);
  const response = mode === "live" && liveResponse ? liveResponse : demoResponse;

  const syncLive = useEffectEvent(async (nextFilters: JobListQuery = appliedFilters) => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const nextResponse = await listJobs(nextFilters);
      startTransition(() => {
        setLiveResponse(nextResponse);
        setAppliedFilters(nextFilters);
        setMode("live");
        setMessage("岗位列表已经切换到真实接口结果。");
        setErrorMessage("");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "岗位列表同步失败，当前先保留已展示的结果。"));
    } finally {
      setLoading(false);
    }
  });

  function applyFilters() {
    const nextFilters = {
      ...filters,
      page: 1,
    };

    setMessage("");
    setErrorMessage("");

    if (mode === "live") {
      void syncLive(nextFilters);
      return;
    }

    setAppliedFilters(nextFilters);
  }

  function resetFilters() {
    setFilters(defaultJobFilters);
    setMessage("");
    setErrorMessage("");

    if (mode === "live") {
      void syncLive(defaultJobFilters);
      return;
    }

    setAppliedFilters(defaultJobFilters);
  }

  function resetToDemo() {
    setFilters(defaultJobFilters);
    setAppliedFilters(defaultJobFilters);
    setLiveResponse(null);
    setMode("demo");
    setLoading(false);
    setMessage("已回到演示岗位列表。");
    setErrorMessage("");
  }

  function goToPage(page: number) {
    if (page < 1 || page === response.pagination.page) {
      return;
    }

    const nextFilters = {
      ...appliedFilters,
      page,
    };

    setMessage("");
    setErrorMessage("");

    if (mode === "live") {
      void syncLive(nextFilters);
      return;
    }

    setAppliedFilters(nextFilters);
  }

  return {
    data: {
      filters,
      appliedFilters,
      response,
      mode,
      summaryCards: buildJobsSummaryCards(response, appliedFilters),
      cityOptions: jobsCityOptions,
      industryOptions: jobsIndustryOptions,
    },
    status: {
      loading,
      message,
      errorMessage,
      viewState: getJobsViewState({
        response,
        mode,
        loading,
        errorMessage,
      }),
    },
    actions: {
      updateKeyword: (value) => setFilters((current) => ({ ...current, keyword: value })),
      selectCity: (value) => setFilters((current) => ({ ...current, city: value })),
      selectIndustry: (value) => setFilters((current) => ({ ...current, industry: value })),
      toggleFeaturedOnly: () =>
        setFilters((current) => ({
          ...current,
          featuredOnly: !current.featuredOnly,
        })),
      applyFilters,
      resetFilters,
      resetToDemo,
      goToPage,
      syncLive: () => syncLive(),
    },
  };
}
