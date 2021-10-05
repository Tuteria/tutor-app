import { useToast } from "@chakra-ui/toast";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import QuizSelectionView from "@tuteria/shared-lib/src/tutor-revamp/QuizSelectionView";
import React from "react";
import { clientAdapter } from "../../../server_utils/client";
import {
  serverAdapter,
  TuteriaSubjectType,
} from "../../../server_utils/server";
import { usePrefetchHook } from "../../../server_utils/util";

const SelectSubjectTestPage: React.FC<{ subjectInfo: TuteriaSubjectType }> = ({
  subjectInfo,
}) => {
  const { navigate } = usePrefetchHook({ routes: ["/quiz/test"] });
  const [canTakeQuiz, setTakeQuiz] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();
  const [testableSubjects, setTestableSubjects] = React.useState(
    subjectInfo.subjects.map((o) => o.name)
  );

  async function onNextClick(selectedQuizzes: string[]) {
    try {
      await clientAdapter.generateQuiz({
        ...subjectInfo,
        subjects: subjectInfo.subjects.filter((x) => {
          return selectedQuizzes.includes(x.name);
        }),
      });
      navigate("/quiz/test");
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  React.useEffect(() => {
    setLoading(true);
    clientAdapter
      .getTutorSubjects(subjectInfo)
      .then(({ tutorSubjects }) => {
        if (tutorSubjects.length > 0) {
          setTakeQuiz(true);
          setTestableSubjects(tutorSubjects[0].quizzes.map((o) => o.name));
        } else {
          setTakeQuiz(false);
          toast({
            title: `Not permitted to take ${subjectInfo.name} quiz`,
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        throw error;
        // setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState text="Fetching Subjects" />;
  return (
    <QuizSelectionView
      canTakeQuiz={canTakeQuiz}
      toSubjectPage={() => navigate("/")}
      testSubject={subjectInfo.name}
      testableSubjects={testableSubjects}
      generateQuiz={onNextClick}
    />
  );
};

export default SelectSubjectTestPage;

export async function getStaticPaths() {
  const subjects =
    (await serverAdapter.getTuteriaSubjects()) as Array<TuteriaSubjectType>;
  const paths = subjects.map(({ slug }) => ({ params: { slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const subjectInfo = await serverAdapter.getTuteriaSubjects(params.slug);
  return { props: { subjectInfo } };
}
