import { RootStore } from "@tuteria/shared-lib/src/stores";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import Dynamic from "next/dynamic";
import React, { useEffect } from "react";
import { adapter } from "../../server_utils/client";
import { serverAdapter } from "../../server_utils/server";

const store = RootStore.create({}, { adapter });

const PersonalInfo = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/PersonalInfo")
);
const LocationInfo = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/LocationInfo")
);
const WorkHistory = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/WorkHistory")
);
const EducationHistory = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/EducationHistory")
);

const Subjects = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Subject")
);

const Index = ({ data }) => {
  useEffect(() => {
    store.initializeStore(data);
  }, []);

  return (
    <TutorPageWrapper store={store}>
      <PersonalInfo
        store={store}
        onSubmit={() => {
          store.toNextPath();
        }}
      />

      <LocationInfo
        store={store}
        onSubmit={() => {
          store.toNextPath();
        }}
      />

      <EducationHistory store={store} />

      <WorkHistory store={store} />
      <Subjects
        store={store.subject}
        onTakeTest={() => {}}
      />
    </TutorPageWrapper>
  );
};

export async function getServerSideProps({ params }) {
  const { id } = params;
  const data = await serverAdapter.getTutorInfo(id);
  return {
    props: { data }
  }
}

export default Index;
