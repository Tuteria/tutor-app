import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { SubjectStore } from "@tuteria/shared-lib/src/stores";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import TutorSubjectsPage from "@tuteria/shared-lib/src/tutor-revamp/Subject";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { serverAdapter } from "../server_utils/server";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";

const adapter: any = {
  initializeApplication: async (tuteriaSubjects) => {
    return {
      tuteriaSubjects,
      tutorSubjects: [],
    };
  },
  getTutorSubjects: async () => {},
  getTuteriaSubjects: clientAdapter.getTuteriaSubjects,
  deleteSubject: async () => {},
  loadExistingTutorInfo: clientAdapter.loadExistingTutorInfo,
  loadExistingSubject: clientAdapter.loadExistingSubject,
  saveSubject: clientAdapter.saveSubject,
  saveTutorSubjects: async () => {},
  buildQuizData: clientAdapter.buildQuizData,
  submitQuizResults: async () => {},
  beginQuiz: clientAdapter.beginQuiz,
};

const subjectStore = SubjectStore.create({}, { adapter: loadAdapter(adapter) });

export default function SubjectReviewPage({ tuteriaSubjects = [] }) {
  async function initialize(setLoading) {
    let result = await adapter.initializeApplication(tuteriaSubjects);
    subjectStore.initializeTutorSubjects(result);
  }
  return (
    <LoadingStateWrapper
      defaultLoading={false}
      initialize={initialize}
      text="Loading subject details..."
    >
      <TutorPageWrapper store={{}}>
        <TutorSubjectsPage
          store={subjectStore}
          showWelcomeModal={false}
          renderPreview={(subjectStore) => {
            return null;
          }}
        />
      </TutorPageWrapper>
    </LoadingStateWrapper>
  );
}

export async function getStaticProps() {
  const result = await serverAdapter.initializeApplication();
  return {
    props: {
      ...result,
    },
  };
}
