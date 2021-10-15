import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { TutorSubject } from "@tuteria/shared-lib/src/stores";
import { SUBJECT_EDIT_STEPS } from "@tuteria/shared-lib/src/stores/subject";
import SubjectEditView from "@tuteria/shared-lib/src/tutor-revamp/SubjectEditView";
import TutorProfile from "@tuteria/shared-lib/src/tutor-revamp/TutorPreview";
import React from "react";
import { clientAdapter } from "../../server_utils/client";
import { usePrefetchHook } from "../../server_utils/util";

const store = TutorSubject.create({}, { adapter: loadAdapter(clientAdapter) });

const SubjectDetail = ({ slug }) => {
  const { navigate } = usePrefetchHook({
    routes: ["/login", "/complete"],
  });

  async function initialize(setLoading) {
    try {
      const result = clientAdapter.validateCredentials();
      if (slug) {
        clientAdapter
          .getTutorSubjects({ pk: parseInt(slug as string) })
          .then(({ tutorSubjects }) => {
            setLoading(false);
            store.initialize(tutorSubjects[0]);
          });
      }
    } catch (error) {
      navigate("/login");
    }
  }

  return (
    <LoadingStateWrapper
      text="Fetching subject details..."
      initialize={initialize}
    >
      <SubjectEditView store={store}>
        {(currentForm) => {
          if (currentForm === SUBJECT_EDIT_STEPS.PREVIEW) {
            return <div></div>;
          }
        }}
      </SubjectEditView>
    </LoadingStateWrapper>
  );
};

export default SubjectDetail;

export async function getServerSideProps({ params }) {
  return {
    props: {
      slug: params.slug,
    },
  };
}
