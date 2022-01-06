import { useToast } from "@chakra-ui/toast";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import {
  APPLICATION_STEPS,
  STEPS,
} from "@tuteria/shared-lib/src/stores/rootStore";
import VerificationPage from "@tuteria/shared-lib/src/tutor-application/pages/VerificationPage";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { serverAdapter } from "../server_utils/server";
import { usePrefetchHook } from "../server_utils/util";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

declare global {
  interface Window {
    $crisp: any
  }
}

function TutorVerificationPage({
  allCountries,
  allRegions,
  supportedCountries,
  educationData,
  tuteriaSubjects = [],
}) {
  const toast = useToast();
  const { navigate, buildNavigation } = usePrefetchHook({
    routes: ["/login", "/complete", "/apply"],
  });

  async function initialize(setIsLoading) {
    try {
      let result = await clientAdapter.initializeApplication(adapter, {
        regions: allRegions,
        countries: allCountries,
        supportedCountries,
        educationData,
        tuteriaSubjects,
      });
      let step = result.tutorInfo.appData.currentEditableForm;
      if ([STEPS.VIDEO_SUMMARY, STEPS.VERIFY_EMAIL].includes(step)) {
        if (result.tutorInfo.others?.videoSummary?.url.includes("http")) {
          step = STEPS.VERIFY_EMAIL;
        }
        if (step === STEPS.VERIFY_EMAIL && result.tutorInfo.email_verified) {
          step = STEPS.GUARANTOR_INFO;
        }
      }
      await store.initializeTutorData({
        ...result,
        tutorInfo: {
          ...result.tutorInfo,
          // others:{...result.tutorInfo.others,canApply:true},
          appData: {
            ...result.tutorInfo.appData,
            currentEditableForm: step,
          },
        },
      });

      if (window?.$crisp) {
        window.$crisp.push(["set", "user:email", [store.personalInfo.email]]);
        console.log("Email set for crisp")
      }
      if (store.currentStep === APPLICATION_STEPS.VERIFY) {
        setIsLoading(false);
      } else {
        let queryParams = clientAdapter.getQueryValues()
        if (queryParams.force === "true") {
          setIsLoading(false)
        } else {
          let v = buildNavigation(result.accessToken, result.tutorInfo);
          navigate(v);

        }
      }
    } catch (error) {
      console.log(error);
      if (error === "Invalid Credentials") {
        const { pathname, search } = window.location;
        navigate(`/login?next=${`${pathname}${search}`}`);
      } else {
        toast({
          title: `An error occured.`,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }
    }
  }

  function onLogout() {
    clientAdapter.onLogout()
    navigate("/")
  }
  return (
    <LoadingStateWrapper
      text="Fetching Tutor details..."
      initialize={initialize}
    >
      <VerificationPage
        store={store}
        onLogout={onLogout}
        onNextStep={async () => {
          let token = await store.submitApplication(store.currentStep);
          navigate(`/subjects`);
        }}
      />
    </LoadingStateWrapper>
  );
}
export async function getStaticProps() {
  const result = await serverAdapter.initializeApplication();
  return {
    props: {
      ...result,
      seo: {
        title: "Complete Verification  | Tutor Application - Tuteria",
        description: "Upload profile photo, Video and ID"
      },
    },
  };
}

export default TutorVerificationPage
