import React from "react";
import QuizPage from "@tuteria/shared-lib/src/tutor-revamp/quizzes/Quiz";
import QuizStore from "@tuteria/shared-lib/src/tutor-revamp/quizzes/quizStore";
import { clientAdapter } from "../../../server_utils/client";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { serverAdapter } from "../../../server_utils/server";
import { usePrefetchHook } from "../../../server_utils/util";
import { gradeQuiz } from "@tuteria/shared-lib/src/tutor-revamp/quizzes/quiz-grader";
import { TuteriaSubjectType } from "../../../server_utils/types";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";

const quizStore = QuizStore.create({}, { adapter: loadAdapter(clientAdapter) });
function splitArrayString(query) {
  var vars = query.split("&");
  let result = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    let p = decodeURIComponent(pair[0]);
    let q = decodeURIComponent(pair[1]);
    result[p] = q;
  }
  return result;
}
function getQueryValues(): any {
  if (typeof window !== "undefined") {
    var query = window.location.search.substring(1);
    return splitArrayString(query);
  }
  return {};
}
const Quiz: React.FC<{
  subjectInfo: TuteriaSubjectType;
  quizzes: any[];
}> = ({ subjectInfo, quizzes }) => {
  const { navigate } = usePrefetchHook({ routes: ["/apply"] });
  const [loaded, setLoaded] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);
  const [fetchedQuizzes, setFetchedQuizzes] = React.useState(quizzes);

  React.useEffect(() => {
    let queryParams = getQueryValues();
    let subjectsToTake = (queryParams?.skills || "").split(",");
    const newSubjectInfo = {
      ...subjectInfo,
      subjects: subjectInfo.subjects.filter((o) =>
        subjectsToTake.includes(o.url)
      ),
    };
    if (newSubjectInfo.subjects.length === 0) {
      navigate("/apply");
    } else {
      clientAdapter
        .buildQuizData(newSubjectInfo, quizzes)
        .then(([quiz, quizzes]) => {
          quizStore.initializeQuiz(quiz, newSubjectInfo.subjects);
          setFetchedQuizzes(quizzes);
          setLoaded(true);
        });
    }
  }, []);

  async function onQuizSubmit() {
    let gradedResult = gradeQuiz(
      fetchedQuizzes,
      quizStore.serverAnswerFormat,
      quizStore.quiz.questions.length,
      quizStore.subjectsToTake
    );
    let result = await quizStore.handleSubmission(gradedResult);
    quizStore.setQuizResults(gradedResult);
    setCompleted(true);
    return result;
  }

  function redirect() {
    navigate("/apply");
  }

  if (!loaded) {
    return <LoadingState text="Loading quiz..." />;
  }

  return (
    <QuizPage
      store={quizStore}
      quizName={subjectInfo.name}
      hasCompletedQuiz={completed}
      onNavigate={redirect}
      onSubmitQuiz={onQuizSubmit}
    />
  );
};

export default Quiz;

export async function getStaticPaths() {
  const subjects =
    (await serverAdapter.getTuteriaSubjects()) as Array<TuteriaSubjectType>;
  const paths = subjects.map(({ slug }) => {
    return { params: { slug } };
  });
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const subjectInfo = (await serverAdapter.getTuteriaSubjects(
    params.slug
  )) as TuteriaSubjectType;
  let quizzes = [];
  try {
    quizzes = await serverAdapter.getQuizzesForTuteriaSubject(
      subjectInfo.subjects
    );
  } catch (error) {
    console.log(subjectInfo.name);
  }
  return { props: { subjectInfo, quizzes } };
}
