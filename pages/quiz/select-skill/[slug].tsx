import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { RootStore } from "@tuteria/shared-lib/src/stores";
import { SelectQuizzesToTake } from "@tuteria/shared-lib/src/tutor-revamp/TestPage";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React from "react";
import { adapter } from "../../../server_utils/client";
import { serverAdapter } from "../../../server_utils/server";

const store = RootStore.create({}, { adapter });

const SelectSubjectTestPage = ({slug}) => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onNextClick(payload) {
    try {
      const response = await adapter.generateQuiz(payload)
      console.log(response)
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
      toSubjectPage={() => router.push("/")}
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
