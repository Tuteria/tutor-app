import { Button, Stack } from "@chakra-ui/react";
import FormWrapper, { useTutorApplicationFlow } from "@tuteria/shared-lib/src/components/FormWrapper";
import { IRootStore } from "@tuteria/shared-lib/src/stores";
import { STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import { observer } from "mobx-react-lite";
import React from "react";
import Dynamic from "next/dynamic";

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
const TeachingProfile = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/SpecialNeeds")
);

const TutorPageComponent: React.FC<{
  store: IRootStore;
  onTakeTest: any;
  onEditSubject: (subject: any) => any;
  onSumbitApplication?: () => any;
  applicationLoading?: boolean;
}> = ({
  store,
  onTakeTest,
  onEditSubject,
  onSumbitApplication,
  applicationLoading,
}) => {
  const { getFormWrapperProps, formIndex, steps, activeStep, completedForm } =
    useTutorApplicationFlow(store);

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
        <PersonalInfo {...getFormWrapperProps(STEPS.PERSONAL_INFO)} />
        <LocationInfo {...getFormWrapperProps(STEPS.LOCATION_INFO)} />
        <EducationHistory {...getFormWrapperProps(STEPS.EDUCATION_HISTORY)} />

        <WorkHistory {...getFormWrapperProps(STEPS.WORK_HISTORY)} />
        <TutorSubjectsPage
          {...getFormWrapperProps(STEPS.SUBJECT_SELECTION)}
          onTakeTest={onTakeTest}
          onEditSubject={onEditSubject}
        />

        <ScheduleCard {...getFormWrapperProps(STEPS.SCHEDULE_INFO)} />
        <TeachingProfile {...getFormWrapperProps(STEPS.TEACHING_PROFILE)} />
        <VerificationIdentity {...getFormWrapperProps(STEPS.VERIFICATION)} />

        <GuarantorsInfoForm {...getFormWrapperProps(STEPS.GUARANTOR_INFO)} />
        <PaymentInfo {...getFormWrapperProps(STEPS.PAYMENT_INFO)} />
        <NewDevelopment {...getFormWrapperProps(STEPS.NEW_DEVELOPMENT)} />
        <Agreements {...getFormWrapperProps(STEPS.AGREEMENT_INFO)} />
      </FormWrapper>
      <Stack>
        <Button
          onClick={onSumbitApplication}
          colorScheme="blue"
          size="lg"
          isLoading={applicationLoading}
          isDisabled={!completedForm}
        >
          Submit Application
        </Button>
      </Stack>
    </TutorPageWrapper>
  );
};

export default observer(TutorPageComponent);
