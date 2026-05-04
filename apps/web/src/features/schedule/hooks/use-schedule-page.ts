"use client";

import type { FormEvent } from "react";
import type { ScheduleItem } from "@job-assistant/contracts/schedule";
import { startTransition, useEffectEvent, useMemo, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { demoScheduleItems } from "@/features/shared/demo-data";
import {
  createScheduleItem,
  deleteScheduleItem,
  getScheduleTimeline,
  updateScheduleItem,
} from "@/lib/api/schedule";
import { formatUserFacingError } from "@/lib/errors";

import type { SchedulePageActions, SchedulePageData, SchedulePageStatus } from "../types";
import {
  buildScheduleSummaryCards,
  createDraftItem,
  getScheduleSourceCount,
  getScheduleViewState,
  groupTimeline,
  initialScheduleFormState,
  sortTimeline,
  toIsoDateTime,
  toLocalDateTimeInput,
} from "../utils";

interface SchedulePageController {
  data: SchedulePageData;
  status: SchedulePageStatus;
  actions: SchedulePageActions;
}

export function useSchedulePage(): SchedulePageController {
  const { status: sessionStatus } = useAuthSession();
  const [timeline, setTimeline] = useState(() => sortTimeline(demoScheduleItems));
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialScheduleFormState);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const groupedTimeline = useMemo(() => groupTimeline(timeline), [timeline]);
  const upcomingItem = timeline[0] ?? null;
  const sourceCount = useMemo(() => getScheduleSourceCount(timeline), [timeline]);

  const syncTimeline = useEffectEvent(async () => {
    if (sessionStatus !== "authenticated") {
      setErrorMessage("登录后才能同步真实日程；当前仍保留演示态，方便先确认界面效果。");
      setMessage("");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextTimeline = await getScheduleTimeline();
      startTransition(() => {
        setTimeline(sortTimeline(nextTimeline));
        setMode("live");
        setMessage("真实日程已经同步完成，聚合来源会按岗位、活动、考试和自定义事项分开展示。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "真实日程同步失败，暂时先保留演示时间线。"));
    } finally {
      setLoading(false);
    }
  });

  function resetComposer() {
    setEditingId(null);
    setForm(initialScheduleFormState);
  }

  function editItem(item: ScheduleItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      startAt: toLocalDateTimeInput(item.startAt),
      endAt: toLocalDateTimeInput(item.endAt),
      city: item.city ?? "",
      description: item.description,
    });
  }

  async function deleteItem(item: ScheduleItem) {
    if (item.source !== "user") {
      return;
    }

    setErrorMessage("");
    setMessage("");

    if (mode === "live" && sessionStatus === "authenticated") {
      try {
        await deleteScheduleItem(item.id);
        startTransition(() => {
          setTimeline((current) => current.filter((entry) => entry.id !== item.id));
          setMessage("这条自定义日程已经删除。");
        });
      } catch (error) {
        setErrorMessage(formatUserFacingError(error, "删除日程失败，请稍后再试。"));
      }

      return;
    }

    startTransition(() => {
      setTimeline((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("演示态下已删除这条日程，仅影响当前预览效果。");
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setMessage("");

    const startAt = toIsoDateTime(form.startAt);
    const endAt = toIsoDateTime(form.endAt);

    if (!form.title.trim() || !startAt) {
      setErrorMessage("标题和开始时间都需要先填写。");
      setSubmitting(false);
      return;
    }

    if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
      setErrorMessage("结束时间不能早于开始时间。");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      startAt,
      endAt,
      city: form.city.trim() || null,
      description: form.description.trim(),
    };

    try {
      if (mode === "live" && sessionStatus === "authenticated") {
        const nextItem = editingId
          ? await updateScheduleItem(editingId, payload)
          : await createScheduleItem(payload);

        startTransition(() => {
          setTimeline((current) => {
            const nextTimeline = editingId
              ? current.map((item) => (item.id === nextItem.id ? nextItem : item))
              : [...current, nextItem];
            return sortTimeline(nextTimeline);
          });
          setMessage(editingId ? "日程已更新。" : "新的自定义日程已经加入时间线。");
        });
      } else {
        const draftItem = createDraftItem(editingId ?? `demo-user-${Date.now()}`, form);

        startTransition(() => {
          setTimeline((current) => {
            const nextTimeline = editingId
              ? current.map((item) => (item.id === editingId ? draftItem : item))
              : [...current, draftItem];
            return sortTimeline(nextTimeline);
          });
          setMessage(editingId ? "演示态下已更新日程预览。" : "演示态下已新增一条自定义日程。");
        });
      }

      resetComposer();
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "日程保存失败，请稍后再试。"));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    data: {
      mode,
      timeline,
      groupedTimeline,
      upcomingItem,
      sourceCount,
      summaryCards: buildScheduleSummaryCards(upcomingItem, sourceCount),
      editingId,
      form,
    },
    status: {
      sessionStatus,
      viewState: getScheduleViewState({
        mode,
        timeline,
        errorMessage,
      }),
      loading,
      submitting,
      message,
      errorMessage,
    },
    actions: {
      syncTimeline,
      editItem,
      deleteItem,
      updateFormField: (field, value) => setForm((current) => ({ ...current, [field]: value })),
      submitForm,
      resetComposer,
    },
  };
}
