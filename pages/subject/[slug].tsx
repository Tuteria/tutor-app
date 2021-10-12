import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import SubjectEditView from "@tuteria/shared-lib/src/tutor-revamp/SubjectEditView";
import { useRouter } from "next/router";
import React from "react";
import { clientAdapter } from "../../server_utils/client";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

const SubjectDetail = () => {
  const [loading, setLoading] = React.useState(true);
  let {query: {slug}}= useRouter()

  React.useEffect(() => {
    if(slug) {
      store.subject.fetchTutorSubjects().then((res) => {
        store.subject.setCurrentSubjectId(parseInt(slug as string));
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return <LoadingState text="Fetching subject details..." />;
  }

  return <SubjectEditView store={store.subject} />;
};

export default SubjectDetail;
