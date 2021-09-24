import { useRouter } from "next/router";
import { RootStore } from "@tuteria/shared-lib/src/stores";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import Dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
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

const Subjects = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Subject")
);

export  default function ApplicationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get Id from auth flow
    adapter.fetchTutorInfo("")
      .then((data) => store.initializeStore(data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

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
        onTakeTest={() => {
          router.push(`/application/test?subject=${store.subject.testSubject}`)
        }}
      />
    </TutorPageWrapper>
  );
};
