import { RootStore } from "@tuteria/shared-lib/src/stores";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import Dynamic from "next/dynamic";
import React, { useEffect } from "react";
import { adapter } from "../../server_utils/client";

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

const Index = () => {
  useEffect(() => {
    adapter.fetchTutorInfo("").then((data) => {
      store.initializeStore(data);
    });
  }, []);

  return (
    <TutorPageWrapper>
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
    </TutorPageWrapper>
  );
};

export default Index;
