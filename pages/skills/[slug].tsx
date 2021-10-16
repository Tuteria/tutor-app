import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import {
  buildProfileInfo,
  RootStore,
  TutorSubject,
} from "@tuteria/shared-lib/src/stores";
import { SUBJECT_EDIT_STEPS } from "@tuteria/shared-lib/src/stores/subject";
import SubjectEditView from "@tuteria/shared-lib/src/tutor-revamp/SubjectEditView";
import TutorProfile from "@tuteria/shared-lib/src/tutor-revamp/TutorPreview";
import React from "react";
import { clientAdapter } from "../../server_utils/client";
import { usePrefetchHook } from "../../server_utils/util";

const adapter = loadAdapter(clientAdapter);
const subjectStore = TutorSubject.create({}, { adapter });
const store = RootStore.create({}, { adapter });

const SubjectDetail = () => {
  const { router, onError } = usePrefetchHook({ routes: [] });
  let {
    query: { slug },
  } = router;

  async function initialize(setLoading) {
    if (slug) {
      try {
        let { foundSubject, response: result } =
          await clientAdapter.initializeSubject(
            adapter,
            { id: parseInt(slug as string) },
            "id"
          );

        if (foundSubject) {
          await store.initializeTutorData(
            result.staticData,
            result.tutorInfo,
            result.subjectData
          );
          subjectStore.initialize(foundSubject);
          setLoading(false);
        }
      } catch (error) {
        console.log(error);
        onError(error);
      }
    } else {
      setLoading(true);
    }
  }

  return (
    <LoadingStateWrapper
      key={slug as any}
      text="Fetching subject details..."
      initialize={initialize}
    >
      <SubjectEditView store={subjectStore}>
        {(currentForm) => {
          if (currentForm === SUBJECT_EDIT_STEPS.PREVIEW) {
            return <TutorProfile {...buildProfileInfo(store, subjectStore)} />;
          }
        }}
      </SubjectEditView>
    </LoadingStateWrapper>
  );
};

export default SubjectDetail;
