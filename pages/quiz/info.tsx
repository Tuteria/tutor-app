import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { RootStore } from "@tuteria/shared-lib/src/stores";
import TestPage from "@tuteria/shared-lib/src/tutor-revamp/TestPage";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React from "react";
import { adapter } from "../../server_utils/client";

const store = RootStore.create({}, { adapter });

const SelectSubjectTestPage = () => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // setLoading(true)
  }, [])

  if (loading) return <LoadingState text="Fetching Subjects"/>
  return (
    <TestPage
      store={store}
      navigateToQuiz={() => router.push("/")}
      navigateBack={() => router.push("/quiz")}
    />
  );
};

export default observer(SelectSubjectTestPage);
