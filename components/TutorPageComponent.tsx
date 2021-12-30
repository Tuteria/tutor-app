import { Button, Stack } from "@chakra-ui/react";
import FormWrapper, {
  useTutorApplicationFlow,
} from "@tuteria/shared-lib/src/components/FormWrapper";
import { IRootStore } from "@tuteria/shared-lib/src/stores";
import { STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import { observer } from "mobx-react-lite";
import React from "react";
import Dynamic from "next/dynamic";
import { ChevronRightIcon } from "@chakra-ui/icons";

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

const ScheduleCard = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Schedule")
);

const Agreements = Dynamic(
  () => import("@tuteria/shared-lib/src/tutor-revamp/Agreements")
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
  onNextStep: () => void;
  currentStep?: string;
  onLogout?:()=>any;
}> = ({ store, currentStep, onNextStep,onLogout }) => {
  const { getFormWrapperProps, formIndex, steps, activeStep, completedForm } =
    useTutorApplicationFlow(store, currentStep);

  return (
    <TutorPageWrapper
      // formIndex={formIndex}
      // steps={steps}
      // activeStep={activeStep}
      onLogout={onLogout}
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

        <ScheduleCard {...getFormWrapperProps(STEPS.SCHEDULE_INFO)} />
        <TeachingProfile {...getFormWrapperProps(STEPS.TEACHING_PROFILE)} />
        <PaymentInfo {...getFormWrapperProps(STEPS.PAYMENT_INFO)} />
        <NewDevelopment {...getFormWrapperProps(STEPS.NEW_DEVELOPMENT)} />
        <Agreements {...getFormWrapperProps(STEPS.AGREEMENT_INFO)} />
      </FormWrapper>
      <Stack>
        <Button
          onClick={() => {
            store.submitApplication(store.currentStep).then(() => {
              onNextStep();
            });
          }}
          colorScheme="blue"
          size="lg"
          height={["48px", "64px"]}
          rightIcon={<ChevronRightIcon fontSize="2xl" />}
          isLoading={store.applicationLoading}
          loadingText="Submitting"
          isDisabled={!completedForm}
        >
          Next step: Verifications
        </Button>
      </Stack>
    </TutorPageWrapper>
  );
};

export default observer(TutorPageComponent);
