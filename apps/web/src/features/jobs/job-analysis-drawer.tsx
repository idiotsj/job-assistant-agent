"use client";

import type { Job } from "@job-assistant/contracts/jobs";
import { AnimatePresence, motion } from "framer-motion";

import { useJobAnalysisDrawer } from "./drawer/hooks/use-job-analysis-drawer";
import { JobAnalysisActionSection } from "./drawer/sections/job-analysis-action-section";
import { JobAnalysisDrawerHeader } from "./drawer/sections/job-analysis-drawer-header";
import { JobAnalysisDrawerStatus } from "./drawer/sections/job-analysis-drawer-status";
import { JobAnalysisInputSection } from "./drawer/sections/job-analysis-input-section";
import { JobAnalysisOverviewSection } from "./drawer/sections/job-analysis-overview-section";
import { JobAnalysisRewriteSection } from "./drawer/sections/job-analysis-rewrite-section";

export function JobAnalysisDrawer({
  job,
  open,
  onClose,
}: {
  job: Job | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, status, actions } = useJobAnalysisDrawer(job);

  if (!data.job) {
    return null;
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="drawer-panel"
            initial={{ x: 480, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0.4 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="drawer-panel__inner">
              <JobAnalysisDrawerHeader
                job={data.job}
                sourceLabel={data.sourceLabel}
                analysisMode={data.analysisMode}
                rewriteMode={data.rewriteMode}
                viewState={status.viewState}
                onReset={actions.resetToDemo}
                onClose={onClose}
              />
              <JobAnalysisDrawerStatus
                sessionStatus={status.sessionStatus}
                viewState={status.viewState}
                message={status.message}
                messageTone={status.messageTone}
                errorMessage={status.errorMessage}
              />
              <JobAnalysisInputSection
                sessionStatus={status.sessionStatus}
                rawText={data.rawText}
                actionStatus={status.actionStatus}
                resultStale={status.resultStale}
                onRawTextChange={actions.updateRawText}
                onAnalyze={actions.handleAnalyze}
              />
              <JobAnalysisOverviewSection
                analysis={data.analysis}
                analysisMode={data.analysisMode}
                skillRows={data.skillRows}
              />
              <JobAnalysisRewriteSection
                rewrite={data.rewrite}
                rewriteMode={data.rewriteMode}
                adoptedSuggestions={data.adoptedSuggestions}
                copiedTarget={status.copiedTarget}
                onAdoptSuggestion={actions.adoptSuggestion}
                onCopySuggestion={actions.copySuggestion}
                onCopyStandaloneText={actions.copyStandaloneText}
              />
              <JobAnalysisActionSection
                adoptedSuggestions={data.adoptedSuggestions}
                actionChecklist={data.actionChecklist}
                copiedTarget={status.copiedTarget}
                onCopyAdoptedSuggestions={actions.copyAdoptedSuggestions}
                onClearAdoptedSuggestions={actions.clearAdoptedSuggestions}
                onRemoveAdoptedSuggestion={actions.removeAdoptedSuggestion}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
