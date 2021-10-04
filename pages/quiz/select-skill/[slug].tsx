import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { RootStore } from "@tuteria/shared-lib/src/stores";
import { SelectQuizzesToTake } from "@tuteria/shared-lib/src/tutor-revamp/TestPage";
import { observer } from "mobx-react-lite";
import React from "react";
import { adapter } from "../../../server_utils/client";
import { serverAdapter } from "../../../server_utils/server";
import { usePrefetchHook } from "../../../server_utils/util";

const store = RootStore.create({}, { adapter });

const SelectSubjectTestPage = ({slug}) => {
  const { navigate } = usePrefetchHook({ routes: ['/quiz/test'] });
  const [loading, setLoading] = React.useState(false);

  async function onNextClick() {
    try {
      await store.subject.generateQuiz()
      navigate("/quiz/test")
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  React.useEffect(() => {
    setLoading(true);
    store
      .fetchTutorSubjects(slug)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState text="Fetching Subjects"/>
  return (
    <SelectQuizzesToTake 
      store={store}
      toSubjectPage={() => navigate("/")}
      onNextClick={onNextClick}
    />
  );
};

export default observer(SelectSubjectTestPage);

export async function getStaticPaths() {
  const subjects = await serverAdapter.getTuteriaSubjects()
  const paths = subjects.map(({slug}) => ({params: {slug}}))
  return {paths, fallback: false}
}

export async function getStaticProps({params}) {
  return {props: {slug: params.slug}}
}
