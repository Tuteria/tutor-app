import { useToast } from "@chakra-ui/toast";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import { APPLICATION_STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
import VerificationPage from "@tuteria/shared-lib/src/tutor-revamp/VerificationPage";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { usePrefetchHook } from "../server_utils/util";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

export default function TutorVerificationPage() {
  const toast = useToast();
  const { navigate } = usePrefetchHook({
    routes: ["/login", "/complete", "/apply"],
  });

  async function initialize(setIsLoading) {
    try {
      let result = await clientAdapter.initializeApplication(adapter, {
        regions: [],
        countries: [],
        tuteriaSubjects: [],
      });
      await store.initializeTutorData(
        result.staticData,
        { ...result.tutorInfo, currentStep: APPLICATION_STEPS.VERIFY },
        result.subjectData
      );
      if (store.currentStep === APPLICATION_STEPS.VERIFY) {
        setIsLoading(false);
      } else {
        const paths = {
          [APPLICATION_STEPS.APPLY]: `/apply`,
          [APPLICATION_STEPS.COMPLETE]: `/complete?access_token=${result.accessToken}`,
        };
        navigate(paths[store.currentStep]);
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

  return (
    <LoadingStateWrapper
      text="Fetching Tutor details..."
      initialize={initialize}
    >
      <VerificationPage
        store={store}
        onNextStep={async () => {
          let token = await store.submitApplication(true);
          navigate(`/complete?access_token=${token}`);
        }}
      />
    </LoadingStateWrapper>
  );
}

// export async function getStaticProps() {
//   const [allRegions, allCountries, tuteriaSubjects] = await Promise.all([
//     serverAdapter.getRegions(),
//     serverAdapter.getCountries(),
//     serverAdapter.getTuteriaSubjects(),
//   ]);
//   return {
//     props: { allRegions, allCountries, tuteriaSubjects },
//   };
// }
