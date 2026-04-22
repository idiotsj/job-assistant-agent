"use client";

import { JobAnalysisDrawer } from "./job-analysis-drawer";
import { useJobDetailPage } from "./detail/hooks/use-job-detail-page";
import { JobDetailEmptyState } from "./detail/sections/job-detail-empty-state";
import { JobDetailHeroSection } from "./detail/sections/job-detail-hero-section";
import { JobDetailMainSection } from "./detail/sections/job-detail-main-section";
import { JobDetailPageIntro } from "./detail/sections/job-detail-page-intro";
import { JobDetailSidebarSection } from "./detail/sections/job-detail-sidebar-section";
import { JobDetailStatusStrip } from "./detail/sections/job-detail-status-strip";

export function JobDetailPage({ jobId }: { jobId: string }) {
  const { data, status, actions } = useJobDetailPage(jobId);

  return (
    <div className="page-stack">
      <JobDetailPageIntro mode={data.mode} viewState={status.viewState} loading={status.loading} onSync={actions.syncLiveJob} />
      <JobDetailStatusStrip message={status.message} errorMessage={status.errorMessage} />

      {!data.job ? (
        <JobDetailEmptyState viewState={status.viewState} />
      ) : (
        <>
          <div className="detail-view-layout">
            <JobDetailHeroSection job={data.job} />

            <div className="detail-view-grid">
              <JobDetailMainSection
                job={data.job}
                insight={data.insight}
                timeItems={data.timeItems}
                reminders={data.reminders}
                sessionStatus={status.sessionStatus}
                onOpenDrawer={actions.openDrawer}
              />
              <JobDetailSidebarSection job={data.job} continueLinks={data.continueLinks} />
            </div>
          </div>

          <JobAnalysisDrawer job={data.job} open={status.drawerOpen} onClose={actions.closeDrawer} />
        </>
      )}
    </div>
  );
}
