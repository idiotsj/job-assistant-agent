"use client";

import { useJobsPage } from "./list/hooks/use-jobs-page";
import { JobsFiltersSection } from "./list/sections/jobs-filters-section";
import { JobsPageIntro } from "./list/sections/jobs-page-intro";
import { JobsResultsSection } from "./list/sections/jobs-results-section";
import { JobsStatusStrip } from "./list/sections/jobs-status-strip";
import { JobsSummarySection } from "./list/sections/jobs-summary-section";

export function JobsPage() {
  const { data, status, actions } = useJobsPage();

  return (
    <div className="page-stack">
      <JobsPageIntro
        mode={data.mode}
        viewState={status.viewState}
        loading={status.loading}
        onSync={actions.syncLive}
        onResetToDemo={actions.resetToDemo}
      />
      <JobsStatusStrip message={status.message} errorMessage={status.errorMessage} />
      <JobsSummarySection cards={data.summaryCards} />

      <div className="catalog-layout">
        <JobsFiltersSection
          filters={data.filters}
          cityOptions={data.cityOptions}
          industryOptions={data.industryOptions}
          onKeywordChange={actions.updateKeyword}
          onSelectCity={actions.selectCity}
          onSelectIndustry={actions.selectIndustry}
          onToggleFeaturedOnly={actions.toggleFeaturedOnly}
          onApply={actions.applyFilters}
          onReset={actions.resetFilters}
        />
        <JobsResultsSection
          response={data.response}
          mode={data.mode}
          viewState={status.viewState}
          onPageChange={actions.goToPage}
        />
      </div>
    </div>
  );
}
