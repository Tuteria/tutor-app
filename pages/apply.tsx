import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import {
  APPLICATION_STEPS,
  STEPS,
} from "@tuteria/shared-lib/src/stores/rootStore";
import React from "react";
import TutorPageComponent from "../components/TutorPageComponent";
import { clientAdapter } from "../server_utils/client";
import { serverAdapter } from "../server_utils/server";
import { TuteriaSubjectType } from "../server_utils/types";
import { usePrefetchHook } from "../server_utils/util";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

export default function ApplicationPage({
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
  const { navigate, onError } = usePrefetchHook({
    routes: ["/login", "/complete"],
  });
  const [loaded, setLoaded] = React.useState("initialize");

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
          result.tutorInfo?.appData?.currentStep === APPLICATION_STEPS.APPLY
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
              currentStep: APPLICATION_STEPS.APPLY,
            }),
            // currentEditableForm: STEPS.GUARANTOR_INFO,
            // currentStep: APPLICATION_STEPS.APPLY,
          },
        },
      });
      if (store.currentStep === APPLICATION_STEPS.APPLY) {
        setIsLoading(false);
      } else {
        const paths = {
          [APPLICATION_STEPS.VERIFY]: `/verify`,
          [APPLICATION_STEPS.SUBJECT]: `/subjects?access_token=${result.accessToken}`,
          [APPLICATION_STEPS.COMPLETE]: `/complete?access_token=${result.accessToken}`,
        };
        navigate(paths[store.currentStep]);
      }
      setLoaded("done");
    } catch (error) {
      console.log(error);
      onError(error);
    }
  }
  let { currentStep } = clientAdapter.getQueryValues();
  return (
    <LoadingStateWrapper
      defaultLoading={false}
      // controlled={false}
      // defaultLoading={currentStep === undefined}
      initialize={initialize}
    >
      <TutorPageComponent
        currentStep={currentStep ? store.currentEditableForm : currentStep}
        key={loaded}
        store={store}
        onNextStep={() => {
          navigate("/verify");
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
    },
  };
}
