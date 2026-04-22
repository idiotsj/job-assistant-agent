"use client";

import { useProfilePage } from "./hooks/use-profile-page";
import { ProfileAuthPrompt } from "./sections/profile-auth-prompt";
import { ProfileFormSection } from "./sections/profile-form-section";
import { ProfileLoadingState } from "./sections/profile-loading-state";
import { ProfilePageIntro } from "./sections/profile-page-intro";
import { ProfileResumeCacheSection } from "./sections/profile-resume-cache-section";
import { ProfileStatusStrip } from "./sections/profile-status-strip";
import { ProfileSuggestionsSection } from "./sections/profile-suggestions-section";
import { ProfileSummarySection } from "./sections/profile-summary-section";

export function ProfilePage() {
  const { data, status, actions } = useProfilePage();

  return (
    <div className="page-stack">
      <ProfilePageIntro
        sessionStatus={status.sessionStatus}
        viewState={status.viewState}
        displayUserLabel={data.displayUserLabel}
        loading={status.loading}
        onSync={actions.syncProfile}
      />
      <ProfileStatusStrip loading={status.loading && status.viewState !== "loading"} message={status.message} errorMessage={status.errorMessage} />

      {status.viewState === "loading" ? (
        <ProfileLoadingState />
      ) : status.viewState === "unauthenticated" ? (
        <ProfileAuthPrompt />
      ) : data.currentProfile ? (
        <div className="profile-layout">
          <ProfileFormSection
            profile={data.currentProfile}
            saving={status.saving}
            onSubmit={actions.saveProfile}
            onTextFieldChange={actions.updateTextField}
            onTagFieldChange={actions.updateTagField}
            onToggleFlag={actions.toggleFlagField}
          />

          <div className="page-stack">
            <ProfileSummarySection
              completeness={data.completeness}
              total={data.completenessTotal}
              summaryItems={data.summaryItems}
            />
            <ProfileSuggestionsSection groups={data.suggestionGroups} onAppendTag={actions.appendSuggestedTag} />
            <ProfileResumeCacheSection hasResumeCache={data.hasResumeCache} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
