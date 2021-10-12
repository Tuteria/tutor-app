import { useToast } from "@chakra-ui/toast";
import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import storage from "@tuteria/shared-lib/src/local-storage";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import { STEPS } from "@tuteria/shared-lib/src/stores/rootStore";
import React, { useEffect, useState } from "react";
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
  tuteriaSubjects = [],
}: {
  allCountries: any[];
  allRegions: any[];
  tuteriaSubjects: TuteriaSubjectType[];
}) {
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const { navigate } = usePrefetchHook({
    routes: ["/login"],
  });

  async function initialize() {
    try {
      const cleanedData = clientAdapter.validateCredentials();
      storage.set(adapter.regionKey, allRegions);
      storage.set(adapter.countryKey, allCountries);
      storage.set(
        adapter.supportedCountriesKey,
        cleanedData.supportedCountries
      );
      storage.set(adapter.tuteriaSubjectsKey, tuteriaSubjects);
      store.initializeTutorData(
        allRegions,
        allCountries,
        cleanedData.supportedCountries,
        {...cleanedData.tutor_data, currentEditableForm:STEPS.SUBJECT_SELECTION}
      );
      if (store.currentEditableForm === "subject-selection") {
        await store.subject.fetchTutorSubjects();
      }
      if (store.currentEditableForm === "payment-info") {
        await store.fetchBanksInfo();
      }
      setIsLoading(false);
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

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }
  return (
    <TutorPageComponent
      onEditSubject={(subject) => {
        navigate(`/skills/${subject.id}`);
      }}
      store={store}
      onTakeTest={(subject) => {
        let instance = tuteriaSubjects.find((o) => o.name === subject.name);
        navigate(`/quiz/select-skill/${instance.slug}`);
      }}
    />
  );
}

export async function getStaticProps() {
  const [allRegions, allCountries, tuteriaSubjects] = await Promise.all([
    serverAdapter.getRegions(),
    serverAdapter.getCountries(),
    serverAdapter.getTuteriaSubjects(),
  ]);
  return {
    props: { allRegions, allCountries, tuteriaSubjects },
  };
}
