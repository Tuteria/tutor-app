import { RootStore } from "@tuteria/shared-lib/src/stores";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { scrollToId } from "@tuteria/shared-lib/src/utils/functions";
import storage from "@tuteria/shared-lib/src/storage";
import Dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { adapter } from "../../server_utils/client";
import { serverAdapter, } from '../../server_utils/server';
import { usePrefetchHook } from '../../server_utils/util';

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

const TutorSubjectsPage = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Subject")
);

export  default function ApplicationPage({ countries, regions }) {
  const [isLoading, setIsLoading] = useState(true);
  const { navigate } = usePrefetchHook({
    routes: [
      '/login',
    ]
  })

  const stepsArray: any = [
    { key: "personal-info", name: "Personal Info", completed: false },
    { key: "location-info", name: "Location Info", completed: false },
    {
      key: "education-history",
      name: "Education History",
      completed: false,
    },
    { key: "work-history", name: "Work History", completed: false },
    { key: "subject-addition", name: "Subject Selection", completed: false },
  ];

  const [formIndex, setFormIndex] = useState(1);
  const [steps, setSteps] = useState<any[]>(stepsArray);
  const [activeStep, setActiveStep] = useState("personal-info");

  const handleFormSubmit = (id, presentStep) => {
    setFormIndex((index) => index + 1);
    setActiveStep(id);
    setSteps(
      [...steps].map((object) => {
        if (object.key === presentStep) {
          return {
            ...object,
            completed: true,
          };
        } else return object;
      })
    );
    scrollToId(id);
  };


  useEffect(() => {
    storage.set(adapter.regionKey, regions);
    storage.set(adapter.countryKey, countries);
    const data: any = adapter.decodeToken("");
    if (!data) {
      const { pathname, search } = window.location;
      navigate(`/login?next=${`${pathname}${search}`}`);
    } else {
      store.initializeTutorData(regions, countries, data);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <TutorPageWrapper
      formIndex={formIndex}
      steps={steps}
      activeStep={activeStep}
      store={store}
    >
      <PersonalInfo
        store={store}
        currentEditableForm={activeStep}
        onSubmit={(formData: any) => {
          store.personalInfo.onFormSubmit(formData);
          store.onFormSubmit(formData, "personal-info").then(() => {
            handleFormSubmit("location-info", "personal-info");
          });
        }}
      />

      <LocationInfo
        store={store}
        onSubmit={(formData: any) => {
          store.locationInfo.updateFields(formData);
          store.onFormSubmit(formData, "location-info").then(() => {
            handleFormSubmit("education-history", "location-info");
          });
        }}
      />

      <EducationHistory
        store={store}
        onSubmit={(formData: any) => {
          store.onFormSubmit(formData, "education-history").then(() => {
            handleFormSubmit("work-history", "education-history");
          });
        }}
      />

      <WorkHistory
        store={store}
        onSubmit={(formData: any) => {
          store.onFormSubmit(formData, "work-history").then(() => {
            handleFormSubmit("subject-addition", "work-history");
          });
        }}
      />
      <TutorSubjectsPage
        store={store.subject}
        onTakeTest={() => {
          navigate(`/application/test?subject=${store.subject.testSubject}`)
        }}
        onSubmit={(formData: any) => {
          store.onFormSubmit(formData, "subject-addition").then(() => {
            // handleFormSubmit("subject-selection", "work-history");
          });
        }}
      />
    </TutorPageWrapper>
  );
};


export async function getStaticProps() {
  const [regions, countries] = await Promise.all([
    serverAdapter.getRegions(),
    serverAdapter.getCountries(),
  ]);
  return {
    props: { regions, countries },
  };
}