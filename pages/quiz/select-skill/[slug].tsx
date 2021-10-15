import { useToast } from "@chakra-ui/toast";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import QuizSelectionView from "@tuteria/shared-lib/src/tutor-revamp/QuizSelectionView";
import React from "react";
import { clientAdapter } from "../../../server_utils/client";
import { serverAdapter } from "../../../server_utils/server";
import { TuteriaSubjectType } from "../../../server_utils/types";
import { usePrefetchHook } from "../../../server_utils/util";

const SelectSubjectTestPage: React.FC<{ subjectInfo: TuteriaSubjectType }> = ({
  subjectInfo,
}) => {
  const { navigate } = usePrefetchHook({ routes: ["/quiz/test"] });
  const [canTakeQuiz, setTakeQuiz] = React.useState(true);
  const toast = useToast();
  const [testableSubjects, setTestableSubjects] = React.useState(
    subjectInfo.subjects.map((o) => o.name)
  );

  async function onNextClick(selectedQuizzes: string[]) {
    const payload = {
      ...subjectInfo,
      subjects: subjectInfo.subjects.filter((x) => {
        return selectedQuizzes.includes(x.name);
      }),
    };
    const subjects = payload.subjects.map(({ url }) => url).join(",");
    try {
      await clientAdapter.beginQuiz({ subjects: [subjectInfo.name] });
      navigate(`/quiz/test/${subjectInfo.slug}?skills=${subjects}`);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async function initialize(setLoading) {
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
  }
  return (
    <LoadingStateWrapper initialize={initialize} text="Fetching Subjects">
      <QuizSelectionView
        canTakeQuiz={canTakeQuiz}
        toSubjectPage={() => navigate("/")}
        testSubject={subjectInfo.name}
        testableSubjects={testableSubjects}
        generateQuiz={onNextClick}
      />
    </LoadingStateWrapper>
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
