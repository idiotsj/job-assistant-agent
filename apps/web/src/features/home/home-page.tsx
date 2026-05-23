"use client";

import { useHomeDashboardData } from "./hooks/use-home-dashboard-data";
import { HomeAuthPrompt } from "./sections/home-auth-prompt";
import { HomeStatusStrip } from "./sections/home-status-strip";
import { HomeHeroSection } from "./sections/home-hero-section";
import { HomeTimelineSection } from "./sections/home-timeline-section";
import { HomeBottomSection } from "./sections/home-bottom-section";

export function HomePage() {
  const { data, status, actions } = useHomeDashboardData();

  return (
    <div className="home-page">
      <HomeStatusStrip
        message={status.message}
        messageTone={status.messageTone}
        errorMessage={status.errorMessage}
      />

      <HomeHeroSection
        stageTask={data.stageTask}
        profile={data.profile}
        profileNeedsAttention={data.profileNeedsAttention}
        modes={status.modes}
        recommendation={data.recommendation}
      />

      {status.sessionStatus === "unauthenticated" ? <HomeAuthPrompt /> : null}

      <HomeTimelineSection
        timelinePreview={data.timelinePreview}
        schedule={data.schedule}
        modes={status.modes}
      />

      <HomeBottomSection
        featuredEvents={data.featuredEvents}
        featuredCompany={data.featuredCompany}
        insightHighlights={data.insightHighlights}
        spotlightJobs={data.spotlightJobs}
      />
    </div>
  );
}
