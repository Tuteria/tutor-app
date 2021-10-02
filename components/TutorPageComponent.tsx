import FormWrapper from "@tuteria/shared-lib/src/components/FormWrapper";
import { IRootStore } from "@tuteria/shared-lib/src/stores";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import educationHistoryData from "@tuteria/shared-lib/src/tutor-revamp/formData/educationHistory.json";
import personalInfoData from "@tuteria/shared-lib/src/tutor-revamp/formData/personalInfo.json";
import subjectData from "@tuteria/shared-lib/src/tutor-revamp/formData/subject.json";
import workHistoryData from "@tuteria/shared-lib/src/tutor-revamp/formData/workHistory.json";
import { scrollToId } from "@tuteria/shared-lib/src/utils/functions";
import { observer } from "mobx-react-lite";
import Dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

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
const TutorPageComponent: React.FC<{
  store: IRootStore;
  onTakeTest: () => any;
}> = ({ store, onTakeTest }) => {
  const [formIndex, setFormIndex] = useState(1);
  const [steps, setSteps] = useState<any[]>(stepsArray);
  const [activeStep, setActiveStep] = useState(store.currentEditableForm);

  useEffect(() => {
    scrollToId(activeStep);
  }, []);

  const handleFormSubmit = (id, presentStep) => {
    setFormIndex((index) => index + 1);
    setActiveStep(id);
    store.setEditableForm(id);
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

  const countries = store.locationInfo.countries.map((country) => country.name);

  return (
    <TutorPageWrapper
      formIndex={formIndex}
      steps={steps}
      activeStep={activeStep}
      store={store}
    >
      <FormWrapper
        rootStore={store}
        currentEditableForm={activeStep}
        activeForm={formIndex}
      >
        <PersonalInfo
          formHeader={personalInfoData.formTitle.header}
          formSummary={[
            store.personalInfo.firstName,
            store.personalInfo.nationality,
            store.personalInfo.email,
            store.personalInfo.dateOfBirth,
            store.personalInfo.phone,
            store.personalInfo.gender,
          ]}
          lockedDescription={personalInfoData.formTitle.subHeader}
          label="personal-info"
          loading={store.loading}
          countries={countries}
          viewModel={store.locationInfo}
          store={store.personalInfo}
          onSubmit={(formData: any) => {
            store.personalInfo.onFormSubmit(formData);
            store.onFormSubmit(formData, "personal-info").then(() => {
              handleFormSubmit("location-info", "personal-info");
            });
          }}
        />

        <LocationInfo
          store={store.locationInfo}
          label="location-info"
          formHeader={"Location Information"}
          lockedDescription="Enter your location"
          loading={store.loading}
          formSummary={[
            store.locationInfo.country,
            store.locationInfo.state,
            store.locationInfo.region,
            store.locationInfo.vicinity,
          ]}
          onSubmit={(formData: any) => {
            store.locationInfo.updateFields(formData);
            store.onFormSubmit(formData, "location-info").then(() => {
              handleFormSubmit("education-history", "location-info");
            });
          }}
        />

        <EducationHistory
          store={store.educationWorkHistory}
          formHeader={educationHistoryData.formTitle.header}
          formsetDescription={`Please we would love to know more about your education`}
          rootStore={store}
          loading={store.loading}
          isDisabled={!(store.educationWorkHistory.educations.length > 0)}
          displayType="complex"
          label="education-history"
          lockedDescription={educationHistoryData.formTitle.subHeader}
          buttonText={educationHistoryData.buttonText.saveAndContinue}
          textData={educationHistoryData}
          completed={store.educationWorkHistory.educationCompleted}
          onSubmit={(formData: any) => {
            store.onFormSubmit(formData, "education-history").then(() => {
              handleFormSubmit("work-history", "education-history");
            });
          }}
        />

        <WorkHistory
          store={store.educationWorkHistory}
          formHeader={"Work History"}
          formsetDescription={`Please we would love to know more about your working experience`}
          loading={store.loading}
          displayType="complex"
          label="work-history"
          isDisabled={store.educationWorkHistory.workHistories.length === 0}
          lockedDescription={"Enter your work history"}
          buttonText={workHistoryData.buttonText.saveAndContinue}
          textData={workHistoryData}
          completed={store.educationWorkHistory.workCompleted}
          onSubmit={(formData: any) => {
            store.onFormSubmit(formData, "work-history").then(() => {
              handleFormSubmit("subject-addition", "work-history");
            });
          }}
        />
        <TutorSubjectsPage
          formHeader={subjectData.lockedForm.title}
          lockedDescription={subjectData.lockedForm.description}
          store={store.subject}
          label="subject-addition"
          completed={
            store.subject.tutorSubjects.length > 0 &&
            activeStep === "subject-addition"
          }
          showWelcomeModal={
            activeStep === "subject-addition" &&
            store.subject.tutorSubjects.length === 0
          }
          currentStep={activeStep}
          isCollapsed={false}
          onSubmit={(formData: any) => {
            store.onFormSubmit(formData, "subject-addition").then(() => {});
          }}
          onTakeTest={onTakeTest}
        />
      </FormWrapper>
    </TutorPageWrapper>
  );
};
export default observer(TutorPageComponent);
