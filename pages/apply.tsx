import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import { APPLICATION_STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
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

  async function initialize(setIsLoading) {
    try {
      let result = await clientAdapter.initializeApplication(adapter, {
        regions: allRegions,
        countries: allCountries,
        supportedCountries,
        educationData,
        tuteriaSubjects,
      });
      store.initializeTutorData(result);
      if (store.currentStep === APPLICATION_STEPS.APPLY) {
        setIsLoading(false);
      } else {
        const paths = {
          [APPLICATION_STEPS.VERIFY]: `/verify`,
          [APPLICATION_STEPS.COMPLETE]: `/complete?access_token=${result.accessToken}`,
        };
        navigate(paths[store.currentStep]);
      }
      await store.fetchBanksInfo();
    } catch (error) {
      console.log(error);
      onError(error);
    }
  }

  return (
    <LoadingStateWrapper initialize={initialize}>
      <TutorPageComponent
        onEditSubject={(subject) => {
          return `/skills/${subject}`;
        }}
        store={store}
        onTakeTest={(subject) => {
          let instance = tuteriaSubjects.find((o) => o.name === subject);
          return `/quiz/select-skill/${instance.slug}`;
        }}
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
