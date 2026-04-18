"use client";

import { useResumeWorkbench } from "./hooks/use-resume-workbench";
import { ResumeActionPlanSection } from "./sections/resume-action-plan-section";
import { ResumeDiagnosisSection } from "./sections/resume-diagnosis-section";
import { ResumeInputSection } from "./sections/resume-input-section";
import { ResumePageIntro } from "./sections/resume-page-intro";
import { ResumeParseSection } from "./sections/resume-parse-section";
import { ResumeStatusStrip } from "./sections/resume-status-strip";

export function ResumeDiagnosisPage() {
  const { data, status, actions } = useResumeWorkbench();

  return (
    <div className="page-stack">
      <ResumePageIntro
        parseSnapshotMode={data.parseSnapshotMode}
        diagnosisMode={data.diagnosisMode}
        sessionStatus={status.sessionStatus}
        viewState={status.viewState}
        onReset={actions.resetToDemo}
      />
      <ResumeStatusStrip
        sessionStatus={status.sessionStatus}
        message={status.message}
        messageTone={status.messageTone}
        errorMessage={status.errorMessage}
        resultStale={status.resultStale}
      />

      <div className="resume-grid">
        <ResumeInputSection
          sessionStatus={status.sessionStatus}
          rawText={data.rawText}
          actionStatus={status.actionStatus}
          resultStale={status.resultStale}
          onRawTextChange={actions.updateRawText}
          onImportFile={actions.importTextFile}
          onParse={actions.handleParse}
          onDiagnose={actions.handleDiagnose}
          onLoadDemo={actions.loadDemoResume}
        />

        <div className="page-stack">
          <ResumeParseSection
            parseSnapshot={data.parseSnapshot}
            parseSnapshotMode={data.parseSnapshotMode}
            patchEntries={data.patchEntries}
          />
          <ResumeDiagnosisSection
            diagnosisResult={data.diagnosisResult}
            diagnosisMode={data.diagnosisMode}
          />
          <ResumeActionPlanSection
            actionPlan={data.diagnosisResult.diagnosis.actionPlan}
            sessionStatus={status.sessionStatus}
          />
        </div>
      </div>
    </div>
  );
}
