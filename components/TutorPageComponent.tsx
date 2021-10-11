import { useToast } from "@chakra-ui/react";
import FormWrapper from "@tuteria/shared-lib/src/components/FormWrapper";
import { FormStepType, IRootStore } from "@tuteria/shared-lib/src/stores";
import { STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import educationHistoryData from "@tuteria/shared-lib/src/tutor-revamp/formData/educationHistory.json";
import guarantorInfoData from "@tuteria/shared-lib/src/tutor-revamp/formData/guarantorInfo.json";
import personalInfoData from "@tuteria/shared-lib/src/tutor-revamp/formData/personalInfo.json";
import subjectContents from "@tuteria/shared-lib/src/tutor-revamp/formData/subject.json";
import workHistoryData from "@tuteria/shared-lib/src/tutor-revamp/formData/workHistory.json";
import { scrollToId } from "@tuteria/shared-lib/src/utils/functions";
import { observer } from "mobx-react-lite";
import Dynamic from "next/dynamic";
import { default as React } from "react";

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

const GuarantorsInfoForm = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Guarantors")
);

const NewDevelopment = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/NewDevelopment")
);
const PaymentInfo = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/PaymentInfo")
);
const SpecialNeeds = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/SpecialNeeds")
);

const stepsArray: any = [
  { key: STEPS.PERSONAL_INFO, name: "Personal Information", completed: false },
  { key: STEPS.PASSWORD_INFO, name: "Password Information", completed: false },
  { key: STEPS.LOCATION_INFO, name: "Location Information", completed: false },
  {
    key: STEPS.EDUCATION_HISTORY,
    name: "Education History",
    completed: false,
  },
  { key: STEPS.WORK_HISTORY, name: "Work History", completed: false },
  { key: STEPS.SUBJECT_SELECTION, name: "Subject Selection", completed: false },
  {
    key: STEPS.VERIFICATION,
    name: "Identity Verification",
    completed: false,
  },
  { key: STEPS.SCHEDULE_INFO, name: "Schedule Information", completed: false },
  {
    key: STEPS.AGREEMENT_INFO,
    name: "Agreements Information",
    completed: false,
  },
  {
    key: STEPS.GUARANTOR_INFO,
    name: "Guarantor Information",
    completed: false,
  },
  {
    key: STEPS.NEW_DEVELOPMENT,
    name: "New Development Information",
    completed: false,
  },
  { key: STEPS.SPECIAL_NEEDS, name: "Special Needs", completed: false },
];

const TutorPageComponent: React.FC<{
  store: IRootStore;
  onTakeTest: any;
  onEditSubject: (subject: any) => any;
}> = ({ store, onTakeTest, onEditSubject, ...rest }) => {
  let nextStep: any;
  const toast = useToast();

  const [formIndex, setFormIndex] = React.useState(1);
  const [steps, setSteps] = React.useState<any[]>(stepsArray);
  const [activeStep, setActiveStep] = React.useState(store.currentEditableForm);
  React.useEffect(() => {
    scrollToId(activeStep);
  }, []);

  const handleFormSubmit = (
    id: FormStepType | string,
    presentStep: FormStepType | string
  ) => {
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
  // function onSubmitForm(formData: any, nextStep, currentStep, storeSubmission) {
  //     store.personalInfo.onFormSubmit(formData);
  //     store
  //       .onFormSubmit(formData, currentStep, nextStep)
  //       .then(() => {
  //         handleFormSubmit(nextStep, currentStep);
  //       })
  //       .catch((error) => {
  //         onError();
  //         throw error;
  //       });
  //   }
  // }

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
          label={STEPS.PERSONAL_INFO}
          loading={store.loading}
          countries={countries}
          viewModel={store.locationInfo}
          store={store.personalInfo}
          onSubmit={async (formData: any) => {
            store.personalInfo.onFormSubmit(formData);
            // nextStep = store.hasPassword ? "location-info" : "password-info";
            nextStep = STEPS.LOCATION_INFO;
            await store
              .onFormSubmit(formData, STEPS.PERSONAL_INFO, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.PERSONAL_INFO);
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
        />
        {/* <PasswordSection
          formHeader={"Password Information"}
          label="password-info"
          lockedDescription="Set your password"
          isCollapsed={false}
          onSubmit={(formData: any) => {
            nextStep = "location-info";
            store.password.onFormSubmit(formData);
            store.onFormSubmit(formData, "password-info", nextStep).then(() => {
              store.setPasswordStatus(true);
              handleFormSubmit(nextStep, "password-info");
            });
          }}
          store={store.password}
        /> */}

        <LocationInfo
          store={store.locationInfo}
          label={STEPS.LOCATION_INFO}
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
            nextStep = STEPS.EDUCATION_HISTORY;
            store.locationInfo.updateFields(formData);
            await store
              .onFormSubmit(formData, STEPS.LOCATION_INFO, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.LOCATION_INFO);
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
          formsetDescription={educationHistoryData.formTitle.subHeader}
          rootStore={store}
          loading={store.loading}
          isDisabled={!(store.educationWorkHistory.educations.length > 0)}
          displayType="complex"
          label={STEPS.EDUCATION_HISTORY}
          lockedDescription={educationHistoryData.formTitle.subHeader}
          buttonText={educationHistoryData.buttonText.saveAndContinue}
          textData={educationHistoryData}
          completed={store.educationWorkHistory.educationCompleted}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.WORK_HISTORY;
            await store
              .onFormSubmit(formData, STEPS.EDUCATION_HISTORY, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.EDUCATION_HISTORY);
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
        />

        <WorkHistory
          store={store.educationWorkHistory}
          formHeader={workHistoryData.formTitle.header}
          formsetDescription={workHistoryData.formTitle.subHeader}
          loading={store.loading}
          displayType="complex"
          label={STEPS.WORK_HISTORY}
          isDisabled={store.educationWorkHistory.workHistories.length === 0}
          lockedDescription={workHistoryData.formTitle.subHeader}
          buttonText={workHistoryData.buttonText.saveAndContinue}
          textData={workHistoryData}
          completed={store.educationWorkHistory.workCompleted}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.SUBJECT_SELECTION;
            await store
              .onFormSubmit(formData, STEPS.WORK_HISTORY, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.WORK_HISTORY);
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
        />
        <TutorSubjectsPage
          formHeader={subjectContents.lockedForm.title}
          lockedDescription={subjectContents.lockedForm.description}
          store={store.subject}
          label={STEPS.SUBJECT_SELECTION}
          rootStore={store}
          completed={
            (store.subject.tutorSubjects.length > 0 &&
              activeStep === STEPS.SUBJECT_SELECTION) ||
            (store.subject.tutorSubjects.length === 0 &&
              activeStep === STEPS.SUBJECT_SELECTION) ||
            store.subject.tutorSubjects.length > 0
          }
          showWelcomeModal={
            activeStep === STEPS.SUBJECT_SELECTION &&
            store.subject.tutorSubjects.length === 0
          }
          currentStep={activeStep}
          isCollapsed={false}
          onTakeTest={onTakeTest}
          onEditSubject={onEditSubject}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.VERIFICATION;
            return await store
              .onFormSubmit(formData, STEPS.SUBJECT_SELECTION, nextStep)
              .then(() => {
                if (
                  store.subject.tutorSubjects.filter((x) =>
                    ["active", "denied", "pending"].includes(x.status)
                  ).length > 0
                ) {
                  handleFormSubmit(nextStep, STEPS.SUBJECT_SELECTION);
                }
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
        />
        <VerificationIdentity
          formHeader={"Identity Verification"}
          lockedDescription="Verify your identity in order to complete steps"
          label={STEPS.VERIFICATION}
          currentStep={activeStep}
          store={store.identity}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.SCHEDULE_INFO;
            await store
              .onFormSubmit(formData, STEPS.VERIFICATION, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.VERIFICATION);
              });
          }}
        />
        <ScheduleCard
          formHeader={"Tutor Schedule"}
          label={STEPS.SCHEDULE_INFO}
          lockedDescription="select your teaching schedule"
          store={store.schedule}
          formSummary={[
            `maximum Days: ${store.schedule.maxDays}`,
            `maximum Hours: ${store.schedule.maxHours}`,
            `maximum Students: ${store.schedule.maxStudents}`,
            // [...Object.keys(store.schedule.availability)]
          ]}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.AGREEMENT_INFO;
            await store
              .onFormSubmit(formData, STEPS.SCHEDULE_INFO, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.SCHEDULE_INFO);
              });
          }}
        />

        <Agreements
          formHeader={"Tutor Agreements"}
          label={STEPS.AGREEMENT_INFO}
          lockedDescription="Tutor agreements"
          store={store.agreement}
          loading={store.loading}
          formSummary={[
            `Payment date: ${
              store.agreement.paymentDate === true ? "Agreed" : "Not Agreed"
            }`,
            `Tax compliance: ${
              store.agreement.taxCompliance === true ? "Agreed" : "Not Agreed"
            }`,
            `Lesson Percent: ${
              store.agreement.lessonPercent === true ? "Agreed" : "Not Agreed"
            }`,
            `Contract: ${
              store.agreement.contractAgreement === true
                ? "Agreed"
                : "Not Agreed"
            }`,
          ]}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.GUARANTOR_INFO;
            store.agreement.updateFields(formData);
            await store
              .onFormSubmit(formData, STEPS.AGREEMENT_INFO, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.AGREEMENT_INFO);
              });
          }}
        />

        <GuarantorsInfoForm
          store={store.educationWorkHistory}
          formHeader={guarantorInfoData.formTitle.header}
          formsetDescription={guarantorInfoData.formTitle.subHeader}
          loading={store.loading}
          displayType="complex"
          label={STEPS.GUARANTOR_INFO}
          isDisabled={store.educationWorkHistory.guarantors.length === 0}
          lockedDescription={guarantorInfoData.formTitle.subHeader}
          buttonText={guarantorInfoData.buttonText.saveAndContinue}
          textData={guarantorInfoData}
          completed={store.educationWorkHistory.guarantorsCompleted}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.PAYMENT_INFO;
            await store
              .onFormSubmit(formData, STEPS.GUARANTOR_INFO, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.GUARANTOR_INFO);
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
        />
        <PaymentInfo
          store={store.paymentInfo}
          label={STEPS.PAYMENT_INFO}
          formHeader={"Payment Information"}
          lockedDescription="Enter your bank details"
          loading={store.loading}
          formSummary={[
            store.paymentInfo.bankName,
            store.paymentInfo.accountName,
            store.paymentInfo.accountNumber,
          ]}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.NEW_DEVELOPMENT;
            store.paymentInfo.updateFields(formData);
            await store
              .onFormSubmit(formData, STEPS.PAYMENT_INFO, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.PAYMENT_INFO);
              })
              .catch((error) => {
                onError();
                throw error;
              });
          }}
        />

        <NewDevelopment
          formHeader={"New development"}
          lockedDescription="Learning process"
          label={STEPS.NEW_DEVELOPMENT}
          formSummary={["New development"]}
          store={store.others}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.SPECIAL_NEEDS;
            // store.agreement.updateFields(formData);
            await store
              .onFormSubmit(formData, STEPS.NEW_DEVELOPMENT, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.NEW_DEVELOPMENT);
              });
          }}
        />
        <SpecialNeeds
          formHeader={"Special needs"}
          lockedDescription="If you are specially trained to teach learners with disabilities, or if you have a disability, please let us know."
          label={STEPS.SPECIAL_NEEDS}
          formSummary={["New development"]}
          store={store.teachingProfile}
          onSubmit={async (formData: any) => {
            nextStep = STEPS.SPECIAL_NEEDS;
            // store.agreement.updateFields(formData);
            await store
              .onFormSubmit(formData, STEPS.NEW_DEVELOPMENT, nextStep)
              .then(() => {
                handleFormSubmit(nextStep, STEPS.NEW_DEVELOPMENT);
              });
          }}
        />
      </FormWrapper>
    </TutorPageWrapper>
  );
};

export default observer(TutorPageComponent);
