import React from "react";
import QuizPage from "@tuteria/shared-lib/src/tutor-revamp/quizzes/QuizPage";
import QuizStore from "@tuteria/shared-lib/src/tutor-revamp/quizzes/quizStore";
import { clientAdapter } from "../../../server_utils/client";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { serverAdapter, TuteriaSubjectType } from "../../../server_utils/server";
import { usePrefetchHook } from "../../../server_utils/util";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import {
    SAMPLE_QUIZ_DATA,
  } from "@tuteria/shared-lib/src/tutor-revamp/quizzes/sample-quiz-data";

const quizStore = QuizStore.create({}, { adapter: loadAdapter(clientAdapter) });

const Quiz: React.FC<{ subjectInfo: TuteriaSubjectType; quiz: any }> = ({
  subjectInfo,
  quiz,
}) => {
  const { navigate } = usePrefetchHook({ routes: ["/application"] });
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    // store.initializeQuizQuestions({ questions: DATA.quiz.questions });
    quizStore.setTestSubject(subjectInfo.name);
    quizStore.initializeQuiz(quiz);
    setLoaded(true);
  }, []);

  function redirect() {
    navigate("/application");
  }
  if (!loaded) {
    return <LoadingState text="Loading quiz..." />;
  }
  return <QuizPage index={0} store={quizStore} navigate={() => {}} />;
};

export default Quiz;

export async function getServerSideProps({params}) {
  const subjectInfo = await serverAdapter.getTuteriaSubjects(params.slug);
  const quiz = SAMPLE_QUIZ_DATA
  return { props: { subjectInfo, quiz } };
}
