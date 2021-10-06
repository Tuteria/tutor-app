import { useToast } from "@chakra-ui/toast";
import FormWrapper from "@tuteria/shared-lib/src/components/FormWrapper";
import { IRootStore } from "@tuteria/shared-lib/src/stores";
import { FormStepType } from "@tuteria/shared-lib/src/stores/types";
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

const VerificationIdentity = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/VerificationIdentity")
);

const ScheduleCard = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Schedule")
);

const Agreements = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Agreements")
);
const LearningProcess = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/NewDevelopment")
);

const stepsArray: any = [
  { key: "personal-info", name: "Personal Information", completed: false },
  { key: "password-info", name: "Password Information", completed: false },
  { key: "location-info", name: "Location Information", completed: false },
  {
    key: "education-history",
    name: "Education History",
    completed: false,
  },
  { key: "work-history", name: "Work History", completed: false },
  { key: "subject-selection", name: "Subject Selection", completed: false },
  {
    key: "verification-info",
    name: "Identity Verification",
    completed: false,
  },
  { key: "schedule-info", name: "Schedule Information", completed: false },
];

const TutorPageComponent: React.FC<{
  store: IRootStore;
  onTakeTest: () => any;
}> = ({ store, onTakeTest }) => {
  const toast = useToast();

  const [formIndex, setFormIndex] = useState(1);
  const [steps, setSteps] = useState<any[]>(stepsArray);
  const [activeStep, setActiveStep] = useState(store.currentEditableForm);

  useEffect(() => {
    scrollToId(activeStep);
  }, []);

  const handleFormSubmit = (id: FormStepType, presentStep: FormStepType) => {
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
  function onError() {
    toast({
      title: `An error occured.`,
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "top",
    });
  }

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
          onSubmit={async (formData: any) => {
            store.personalInfo.onFormSubmit(formData);
            return await store
              .onFormSubmit(formData, "personal-info", "location-info")
              .then(() => {
                handleFormSubmit("location-info", "personal-info");
              })
              .catch((error) => {
                onError();
                throw error;
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
          onSubmit={async (formData: any) => {
            store.locationInfo.updateFields(formData);
            return await store
              .onFormSubmit(formData, "location-info", "education-history")
              .then(() => {
                handleFormSubmit("education-history", "location-info");
              })
              .catch((error) => {
                onError();
                throw error;
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
          onSubmit={async (formData: any) => {
            return await store
              .onFormSubmit(formData, "education-history", "work-history")
              .then(() => {
                handleFormSubmit("work-history", "education-history");
              })
              .catch((error) => {
                onError();
                throw error;
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
          onSubmit={async (formData: any) => {
            return await store
              .onFormSubmit(formData, "work-history", "subject-selection")
              .then(() => {
                handleFormSubmit("subject-selection", "work-history");
              });
          }}
        />
        <TutorSubjectsPage
          formHeader={subjectData.lockedForm.title}
          lockedDescription={subjectData.lockedForm.description}
          store={store.subject}
          label="subject-selection"
          completed={
            (store.subject.tutorSubjects.length > 0 &&
              activeStep === "subject-selection") ||
            (store.subject.tutorSubjects.length === 0 &&
              activeStep === "subject-selection") ||
            store.subject.tutorSubjects.length > 0
          }
          showWelcomeModal={
            activeStep === "subject-selection" &&
            store.subject.tutorSubjects.length === 0
          }
          currentStep={activeStep}
          isCollapsed={false}
          onTakeTest={onTakeTest}
          onSubmit={async (formData: any) => {
            return await store
              .onFormSubmit(formData, "subject-selection", "verification-info")
              .then(() => {
                handleFormSubmit("verification-info", "subject-selection");
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
          rootStore={store}
        />
        <VerificationIdentity
          formHeader={"Identity Verification"}
          lockedDescription="Verify your identity in order to complete steps"
          label="verification-info"
          isCollapsed={false}
          currentStep={activeStep}
          store={store.identity}
          onSubmit={async (formData: any) => {
            return await store
              .onFormSubmit(formData, "verification-info", "schedule-info")
              .then(() => {
                handleFormSubmit("schedule-info", "verification-info");
              });
          }}
        />
        <ScheduleCard
          handleChange={() => {}}
          formHeader={"Tutor Schedule"}
          lockedDescription="select your teaching schedule"
          isCollapsed={false}
          store={store.schedule}
          onSubmit={async (formData: any) => {}}
        />

        <Agreements
          formHeader={"Tutor Agreements"}
          lockedDescription="Tutor agreements"
          isCollapsed={false}
          store={store.agreement}
          onSubmit={async (formData: any) => {}}
        />

        <LearningProcess
          formHeader={"New development"}
          lockedDescription="Learning process"
          isCollapsed={false}
          store={store.agreement}
          onSubmit={async (formData: any) => {}}
        />
      </FormWrapper>
    </TutorPageWrapper>
  );
};
export default observer(TutorPageComponent);
