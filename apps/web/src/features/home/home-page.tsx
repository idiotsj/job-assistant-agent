"use client";

import { useHomeDashboardData } from "./hooks/use-home-dashboard-data";
import { HomeAuthPrompt } from "./sections/home-auth-prompt";
import { HomePageIntro } from "./sections/home-page-intro";
import { HomeSecondaryGridSection } from "./sections/home-secondary-grid-section";
import { HomeStageSection } from "./sections/home-stage-section";
import { HomeStatusStrip } from "./sections/home-status-strip";

export function HomePage() {
  const { data, status, actions } = useHomeDashboardData();

  return (
    <div className="page-stack">
      <HomeStatusStrip
        message={status.message}
        messageTone={status.messageTone}
        errorMessage={status.errorMessage}
      />
      <HomeStageSection
        stageTask={data.stageTask}
        quickLinks={data.quickLinks}
        spotlightJobs={data.spotlightJobs}
        recommendationMode={status.modes.recommendation}
      />
      <HomePageIntro status={status} onSync={() => void actions.syncDashboard("manual")} />
      {status.sessionStatus === "unauthenticated" ? <HomeAuthPrompt /> : null}
      <HomeSecondaryGridSection
        featuredJobs={data.featuredJobs}
        featuredEvents={data.featuredEvents}
        featuredCompany={data.featuredCompany}
        timelinePreview={data.timelinePreview}
        profile={data.profile}
        profileNeedsAttention={data.profileNeedsAttention}
        actionChecklist={data.actionChecklist}
        insightHighlights={data.insightHighlights}
        modes={status.modes}
      />
    </div>
  );
}
