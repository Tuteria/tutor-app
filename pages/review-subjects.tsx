import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { SubjectStore } from "@tuteria/shared-lib/src/stores";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { serverAdapter } from "../server_utils/server";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { TuteriaQuizPage } from "@tuteria/shared-lib/src/tutor-revamp/quizzes/Quiz";
import { displayToast } from "@tuteria/shared-lib/src/tutor-revamp/forms/SharedComponents";
import { useRouter } from "next/router";

const tutorSubject = {
  id: 101,
  name: "",
  title: "",
  description: "",
  certifications: [],
  tuteriaStatus: 5,
  status: "not-started",
  teachingStyle: "",
  trackRecords: "",
  teachingRequirements: [],
  preliminaryQuestions: [],
  canTakeTest: true,
};

const adapter: any = {
  initializeApplication: async (tuteriaSubjects, slug) => {
    const foundSubject = tuteriaSubjects.find(
      (subject) => subject.slug === slug
    );
    if (!foundSubject) {
      throw new Error("Subject not found");
    }
    tutorSubject.name = foundSubject.name;
    return {
      tuteriaSubjects,
      tutorSubjects: [tutorSubject],
    };
  },
  loadExistingSubject: clientAdapter.loadExistingSubject,
  buildQuizData: clientAdapter.buildReviewQuizData,
  submitQuizResults: async () => {},
  beginQuiz: async () => ({}),
  createQuizFromSheet: clientAdapter.createQuizFromSheet
};

const subjectStore = SubjectStore.create({}, { adapter: loadAdapter(adapter) });

export default function SubjectReviewPage({ tuteriaSubjects = [] }) {
  const [inst, setInst] = React.useState(null);
  const [error, setError] = React.useState(false)
  const {
    query: { slug },
  } = useRouter();
  async function initialize(setLoading) {
    try {
      if(slug) {
        let result = await adapter.initializeApplication(
          tuteriaSubjects,
          slug
        );
        subjectStore.initializeTutorSubjects(result);
        subjectStore.setCurrentSubjectId(101);
        setInst(subjectStore.tuteriaSubjectForCurrentSubject);
        setLoading(false);
      }
    } catch (error) {
      setError(true)
      setLoading(false);
      displayToast({
        status: "error",
        title: "Error occured",
        duration: 4000,
        position: "top",
        description: "Wrong Query or Poor Internet Connection",
      });
    }
  }
  if(error) return null
  return (
    <LoadingStateWrapper
      initialize={initialize}
      text="Fetching Subjects..."
      key={slug as string}
    >
      <TuteriaQuizPage
        store={subjectStore.currentSubject}
        canTakeQuiz={true}
        navigateToSubject={() => {}}
        toSubjectEditPage={() => {}}
        subjectInfo={inst}
        showRefresh={true}
      />
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
