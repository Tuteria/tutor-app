import React from "react";
import Dynamic from "next/dynamic";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import { getRootStore } from "@tuteria/shared-lib/src/data/store";

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
  const store = getRootStore();
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
