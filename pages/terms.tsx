import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import {
  APPLICATION_STEPS,
  STEPS,
} from "@tuteria/shared-lib/src/stores/rootStore";
import React from "react";

import { clientAdapter } from "../server_utils/client";
import { serverAdapter } from "../server_utils/server";
import { TuteriaSubjectType } from "../server_utils/types";
import { usePrefetchHook } from "../server_utils/util";
import TutorAgreementPage from "@tuteria/shared-lib/src/tutor-application/pages/TutorAgreementPage";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

declare global {
  interface Window {
    $crisp: any;
  }
}

function TutorTermsAndAgreementPage({
  allCountries,
  allRegions,
  supportedCountries,
  educationData,
  tuteriaSubjects = [],
}: {
  allCountries: any[];
  allRegions: any[];
  supportedCountries: any[];
  educationData: any[];
  tuteriaSubjects: TuteriaSubjectType[];
}) {
  const { navigate, onError, buildNavigation } = usePrefetchHook({
    routes: ["/login", "/terms", "application-verified"],
  });
  const [loaded, setLoaded] = React.useState("initialize");
  function getCurrentEditableForm(step) {
    if (
      [
        STEPS.GUARANTOR_INFO,
        STEPS.AGREEMENT_INFO,
        STEPS.VERIFY_EMAIL,
        STEPS.NEW_DEVELOPMENT,
      ].includes(step)
    ) {
      return step;
    }
    return STEPS.GUARANTOR_INFO;
  }

  async function initialize(setIsLoading) {
    setIsLoading(true);
    try {
      let result = await clientAdapter.initializeApplication(adapter, {
        regions: allRegions,
        countries: allCountries,
        supportedCountries,
        educationData,
        tuteriaSubjects: [],
      });
      if (!clientAdapter.canUseSpinner()) {
        if (
          result.tutorInfo?.appData?.currentStep ===
          APPLICATION_STEPS.TUTOR_PREFERENCES
        ) {
          setIsLoading(false);
        }
      }
      store.initializeTutorData({
        ...result,
        tutorInfo: {
          ...result.tutorInfo,
          appData: {
            ...(result.tutorInfo?.appData || {
              currentEditableForm: getCurrentEditableForm(
                result.tutorInfo?.appData?.currentEditableForm
              ),
              currentStep: APPLICATION_STEPS.TERMS,
            }),
            // ...({
            //   currentStep: APPLICATION_STEPS.APPLY,
            // }),
          },
        },
      });
      if (window.$crisp) {
        window.$crisp.push(["set", "user:email", [store.personalInfo.email]]);
        console.log("Email set for crisp");
      }
      if (store.currentStep === APPLICATION_STEPS.TERMS) {
        setIsLoading(false);
      } else {
        let queryParams = clientAdapter.getQueryValues();
        if (queryParams.force === "true") {
          setIsLoading(false);
        } else {
          let v = buildNavigation(result.accessToken, result.tutorInfo);
          navigate(v);
        }
      }
      setLoaded("done");
    } catch (error) {
      console.log(error);
      onError(error);
    }
  }
  function onLogout() {
    clientAdapter.onLogout();
    navigate("/");
  }
  let { currentStep } = clientAdapter.getQueryValues();
  return (
    <LoadingStateWrapper
      defaultLoading={false}
      // controlled={false}
      // defaultLoading={currentStep === undefined}
      initialize={initialize}
    >
      <TutorAgreementPage
        currentStep={currentStep ? store.currentEditableForm : currentStep}
        key={loaded}
        store={store}
        onLogout={onLogout}
        onNextStep={() => {
          navigate("/application-verified");
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
        title: "Begin Your Application | Tutor Application - Tuteria",
        description: "Fill all forms to apply to become a tutor on Tuteria",
      },
    },
  };
}

export default TutorTermsAndAgreementPage;
