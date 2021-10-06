import React from "react";
import QuizPage from "@tuteria/shared-lib/src/tutor-revamp/quizzes/QuizPage";
import QuizStore from "@tuteria/shared-lib/src/tutor-revamp/quizzes/quizStore";
import { clientAdapter } from "../../../server_utils/client";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import {
  serverAdapter,
  TuteriaSubjectType,
} from "../../../server_utils/server";
import { usePrefetchHook } from "../../../server_utils/util";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { gradeQuiz } from "@tuteria/shared-lib/src/tutor-revamp/quizzes/quiz-grader";
import ResultsPage from "@tuteria/shared-lib/src/tutor-revamp/Results";
import { Box } from "@chakra-ui/layout";

const quizStore = QuizStore.create({}, { adapter: loadAdapter(clientAdapter) });

function getQueryValues() {
  if (typeof window !== "undefined") {
    var query = window.location.search.substring(1);
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
  return {};
}
const Quiz: React.FC<{
  subjectInfo: TuteriaSubjectType;
  quizzes: any[];
}> = ({ subjectInfo, quizzes }) => {
  const { navigate } = usePrefetchHook({ routes: ["/application"] });
  const [loaded, setLoaded] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    let queryParams = getQueryValues();
    let subjectsToTake = (queryParams.skills || "").split(",");
    const newSubjectInfo = {
      ...subjectInfo,
      subjects: subjectInfo.subjects.filter((o) =>
        subjectsToTake.includes(o.url)
      ),
    };
    if (newSubjectInfo.subjects.length === 0) {
      navigate("/application");
    } else {
      clientAdapter.buildQuizData(newSubjectInfo, quizzes).then((quiz) => {
        quizStore.initializeQuiz(quiz, newSubjectInfo.subjects);
        setLoaded(true);
      });
    }
  }, []);

  async function onQuizSubmit() {
    let gradedResult = gradeQuiz(
      quizzes,
      quizStore.serverAnswerFormat,
      quizStore.quiz.questions.length
    );
    let result = await quizStore.handleSubmission(gradedResult);
    quizStore.setQuizResults(gradedResult);
    setCompleted(true);
    return result;
  }

  function redirect() {
    navigate("/application");
  }
  if (!loaded) {
    return <LoadingState text="Loading quiz..." />;
  }
  return (
    <Box>
      {completed ? (
        <ResultsPage
          subject={subjectInfo.name}
          quizResults={quizStore.quizResults}
          navigate={redirect}
        />
      ) : (
        <QuizPage
          completed={completed}
          onQuizSubmit={onQuizSubmit}
          index={0}
          store={quizStore}
        />
      )}
    </Box>
  );
};

export default Quiz;

export async function getStaticPaths() {
  const subjects =
    (await serverAdapter.getTuteriaSubjects()) as Array<TuteriaSubjectType>;
  const paths = subjects.map(({ slug }) => ({ params: { slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const subjectInfo = (await serverAdapter.getTuteriaSubjects(
    params.slug
  )) as TuteriaSubjectType;
  const quizzes = await serverAdapter.getQuizzesForTuteriaSubject(
    subjectInfo.subjects
  );
  return { props: { subjectInfo, quizzes } };
}
