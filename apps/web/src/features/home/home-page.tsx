"use client";

import { useHomeDashboardData } from "./hooks/use-home-dashboard-data";
import { HomeAuthPrompt } from "./sections/home-auth-prompt";
import { HomeHeroSection } from "./sections/home-hero-section";
import { HomeMetricsSection } from "./sections/home-metrics-section";
import { HomeOverviewSection } from "./sections/home-overview-section";
import { HomePageIntro } from "./sections/home-page-intro";
import { HomeRecommendationsSection } from "./sections/home-recommendations-section";
import { HomeStatusStrip } from "./sections/home-status-strip";

export function HomePage() {
  const { data, status, actions } = useHomeDashboardData();

  return (
    <div className="page-stack">
      <HomePageIntro status={status} onSync={() => void actions.syncDashboard("manual")} />
      {status.sessionStatus === "unauthenticated" ? <HomeAuthPrompt /> : null}
      <HomeStatusStrip
        message={status.message}
        messageTone={status.messageTone}
        errorMessage={status.errorMessage}
      />
      <HomeHeroSection
        displayUser={data.displayUser}
        heroAdvice={data.heroAdvice}
        profile={data.profile}
        featuredJobs={data.featuredJobs}
        todayContentMode={status.modes.todayContent}
      />
      <HomeMetricsSection
        topRecommendation={data.topRecommendation}
        featuredJobs={data.featuredJobs}
        timelinePreview={data.timelinePreview}
      />
      <HomeRecommendationsSection
        recommendation={data.recommendation}
        recommendationMode={status.modes.recommendation}
      />
      <HomeOverviewSection
        recommendation={data.recommendation}
        recommendationMode={status.modes.recommendation}
        featuredJobs={data.featuredJobs}
        todayContentMode={status.modes.todayContent}
        featuredCompany={data.featuredCompany}
        profile={data.profile}
        profileMode={status.modes.profile}
        profileNeedsAttention={data.profileNeedsAttention}
        timelinePreview={data.timelinePreview}
        scheduleMode={status.modes.schedule}
        actionChecklist={data.actionChecklist}
      />
    </div>
  );
}
