"use client";

import type { FormEvent } from "react";
import { startTransition, useEffect, useEffectEvent, useMemo, useState } from "react";

import { useAuthSession } from "@/components/providers/auth-provider";
import { demoScheduleItems } from "@/features/shared/demo-data";
import { getProfile, updateProfile } from "@/lib/api/profile";
import { getScheduleTimeline } from "@/lib/api/schedule";
import { formatUserFacingError } from "@/lib/errors";

import type {
  ProfileFlagField,
  ProfilePageActions,
  ProfilePageData,
  ProfilePageStatus,
  ProfileTagField,
  ProfileTextField,
} from "../types";
import {
  buildProfileFocusCards,
  buildProfileStageTask,
  buildProfileTags,
  buildProfileTimelinePreview,
  buildProfileWeeklyFocus,
  buildProfileSuggestionGroups,
  buildProfileSummaryItems,
  createEmptyProfile,
  getProfileCompleteness,
  getProfileReadinessLabel,
  getProfileTimelineLabel,
  getProfileViewState,
  sortProfileTimeline,
} from "../utils";

interface ProfilePageController {
  data: ProfilePageData;
  status: ProfilePageStatus;
  actions: ProfilePageActions;
}

export function useProfilePage(): ProfilePageController {
  const { status: sessionStatus, user } = useAuthSession();
  const [profile, setProfile] = useState<ReturnType<typeof createEmptyProfile> | null>(null);
  const [timeline, setTimeline] = useState(() => sortProfileTimeline(demoScheduleItems));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useEffectEvent(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const [nextProfile, nextTimeline] = await Promise.all([getProfile(), getScheduleTimeline()]);
      startTransition(() => {
        setProfile(nextProfile);
        setTimeline(sortProfileTimeline(nextTimeline));
      });
    } catch (error) {
      startTransition(() => {
        setProfile(createEmptyProfile(user.id));
        setTimeline(sortProfileTimeline(demoScheduleItems));
        setErrorMessage(formatUserFacingError(error, "画像暂时没取到，先继续填写也可以。"));
      });
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (sessionStatus === "authenticated" && user) {
      void loadProfile();
      return;
    }

    setProfile(null);
    setLoading(false);
    setSaving(false);
    setMessage("");
    setErrorMessage("");
  }, [sessionStatus, user?.id]);

  const currentProfile = useMemo(() => {
    if (sessionStatus !== "authenticated" || !user) {
      return null;
    }

    return profile ?? createEmptyProfile(user.id);
  }, [sessionStatus, user, profile]);

  function updateTextField(field: ProfileTextField, value: string) {
    if (!currentProfile) {
      return;
    }

    setProfile((previous) => ({
      ...(previous ?? currentProfile),
      [field]: value,
    }));
  }

  function updateTagField(field: ProfileTagField, nextValue: string[]) {
    if (!currentProfile) {
      return;
    }

    setProfile((previous) => ({
      ...(previous ?? currentProfile),
      [field]: nextValue,
    }));
  }

  function appendSuggestedTag(field: ProfileTagField, value: string) {
    if (!currentProfile || currentProfile[field].includes(value)) {
      return;
    }

    updateTagField(field, [...currentProfile[field], value]);
  }

  function toggleFlagField(field: ProfileFlagField) {
    if (!currentProfile) {
      return;
    }

    setProfile((previous) => ({
      ...(previous ?? currentProfile),
      [field]: !currentProfile[field],
    }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentProfile) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextProfile = await updateProfile({
        university: currentProfile.university,
        major: currentProfile.major,
        grade: currentProfile.grade,
        targetIndustries: currentProfile.targetIndustries,
        targetCities: currentProfile.targetCities,
        skills: currentProfile.skills,
        preferredJobTypes: currentProfile.preferredJobTypes,
        considersPostgraduate: currentProfile.considersPostgraduate,
        considersCivilService: currentProfile.considersCivilService,
      });

      startTransition(() => {
        setProfile(nextProfile);
        setMessage("画像已经保存，后续首页推荐和频道建议都会以这份画像为准。");
      });
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "画像保存失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  }

  return {
    data: {
      currentProfile,
      displayUserLabel: user?.name ?? user?.email ?? "当前用户",
      completeness: currentProfile ? getProfileCompleteness(currentProfile) : 0,
      completenessTotal: 7,
      summaryItems: currentProfile ? buildProfileSummaryItems(currentProfile) : [],
      suggestionGroups: buildProfileSuggestionGroups(),
      hasResumeCache: Boolean(currentProfile?.resumeData),
      stageTask: currentProfile
        ? buildProfileStageTask(
            currentProfile,
            getProfileCompleteness(currentProfile),
            7,
          )
        : null,
      profileTags: currentProfile ? buildProfileTags(currentProfile) : [],
      focusCards: currentProfile
        ? buildProfileFocusCards(currentProfile, getProfileCompleteness(currentProfile), 7)
        : [],
      timelinePreview: buildProfileTimelinePreview(timeline),
      weeklyFocus: currentProfile ? buildProfileWeeklyFocus(currentProfile) : [],
      profileReadinessLabel: currentProfile
        ? getProfileReadinessLabel(getProfileCompleteness(currentProfile), 7)
        : "画像状态待恢复",
    },
    status: {
      sessionStatus,
      viewState: getProfileViewState({
        sessionStatus,
        profile: currentProfile,
        loading,
        errorMessage,
      }),
      loading,
      saving,
      message,
      errorMessage,
    },
    actions: {
      syncProfile: loadProfile,
      updateTextField,
      updateTagField,
      appendSuggestedTag,
      toggleFlagField,
      saveProfile,
    },
  };
}
