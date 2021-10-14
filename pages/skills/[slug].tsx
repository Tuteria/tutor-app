import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { TutorSubject } from "@tuteria/shared-lib/src/stores";
import SubjectEditView from "@tuteria/shared-lib/src/tutor-revamp/SubjectEditView";
import { useRouter } from "next/router";
import React from "react";
import { clientAdapter } from "../../server_utils/client";

const store = TutorSubject.create({}, { adapter: loadAdapter(clientAdapter) });

const SubjectDetail = () => {
  const [loading, setLoading] = React.useState(true);
  let {
    query: { slug },
  } = useRouter();

  React.useEffect(() => {
    if (slug) {
      clientAdapter.getTutorSubjects({ pk: parseInt(slug as string) }).then(({ tutorSubjects }) => {
        setLoading(false);
        store.initialize(tutorSubjects[0]);
      });
    }
  }, [slug]);

  if (loading) {
    return <LoadingState text="Fetching subject details..." />;
  }

  return <SubjectEditView store={store} />;
};

export default SubjectDetail;
