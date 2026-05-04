"use client";

import { useSchedulePage } from "./hooks/use-schedule-page";
import { ScheduleComposerSection } from "./sections/schedule-composer-section";
import { SchedulePageIntro } from "./sections/schedule-page-intro";
import { ScheduleSourceGuideSection } from "./sections/schedule-source-guide-section";
import { ScheduleStatusStrip } from "./sections/schedule-status-strip";
import { ScheduleSummarySection } from "./sections/schedule-summary-section";
import { ScheduleTimelineSection } from "./sections/schedule-timeline-section";

export function SchedulePage() {
  const { data, status, actions } = useSchedulePage();

  return (
    <div className="page-stack">
      <SchedulePageIntro
        mode={data.mode}
        viewState={status.viewState}
        sessionStatus={status.sessionStatus}
        loading={status.loading}
        onSync={actions.syncTimeline}
      />
      <ScheduleStatusStrip message={status.message} errorMessage={status.errorMessage} />
      <ScheduleSummarySection cards={data.summaryCards} />

      <div className="schedule-layout">
        <ScheduleTimelineSection
          groups={data.groupedTimeline}
          onEdit={actions.editItem}
          onDelete={actions.deleteItem}
        />

        <div className="page-stack">
          <ScheduleComposerSection
            editing={Boolean(data.editingId)}
            form={data.form}
            submitting={status.submitting}
            onFieldChange={actions.updateFormField}
            onSubmit={actions.submitForm}
            onReset={actions.resetComposer}
          />
          <ScheduleSourceGuideSection />
        </div>
      </div>
    </div>
  );
}
