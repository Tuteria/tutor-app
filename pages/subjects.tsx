import { useToast } from "@chakra-ui/toast";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingStateWrapper } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import { APPLICATION_STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { serverAdapter } from "../server_utils/server";
import { usePrefetchHook } from "../server_utils/util";
import SubjectCreationPage from "@tuteria/shared-lib/src/tutor-application/pages/SubjectCreationPage";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

export default function TutorVerificationPage({
  allCountries,
  allRegions,
  supportedCountries,
  educationData,
  tuteriaSubjects = [],
  preferences,
  pricing,
  groups = []
}) {
  const toast = useToast();
  const { navigate, buildNavigation } = usePrefetchHook({
    routes: ["/login", "/complete", "subjects", "/apply"],
  });

  async function initialize(setIsLoading) {
    try {
      let result = await clientAdapter.initializeApplication(adapter, {
        regions: allRegions,
        countries: allCountries,
        supportedCountries,
        educationData,
        tuteriaSubjects,
        preferences,
        pricing,
        groups
      });
      store.initializeTutorData({
        ...result,
        tutorInfo: {
          ...result.tutorInfo,
          // appData: {
          //   ...(result.tutorInfo?.appData || {
          //     currentStep: APPLICATION_STEPS.APPLY,
          //   }),
          //   // currentEditableForm: STEPS.GUARANTOR_INFO,
          //   currentStep: APPLICATION_STEPS.SUBJECT,
          // },
        },
      });
      if (store.currentStep === APPLICATION_STEPS.SUBJECT) {
        setIsLoading(false);
      } else {
        let _path = buildNavigation(result.accessToken, result.tutorInfo);
        if (_path) {
          navigate(_path);
        } else {
          navigate("/apply");
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

  function onLogout(){
    clientAdapter.onLogout()
    navigate("/")
  }
  return (
    <LoadingStateWrapper
      text="Fetching Tutor subjects..."
      initialize={initialize}
    >
      <SubjectCreationPage
        onLogout={onLogout}
        onNextStep={async () => {
          let token = await store.submitApplication(store.currentStep);
          navigate(`/complete?access_token=${token}`);
        }}
        store={store}
      />
    </LoadingStateWrapper>
  );
}
export async function getStaticProps() {
  const result = await serverAdapter.initializeApplication(true);
  return {
    props: {
      ...result,
    },
  };
}
