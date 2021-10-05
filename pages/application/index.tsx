import { loadAdapter } from "@tuteria/shared-lib/src/adapter";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import storage from "@tuteria/shared-lib/src/storage";
import { initializeStore } from "@tuteria/shared-lib/src/stores";
import React, { useEffect, useState } from "react";
import TutorPageComponent from "../../components/TutorPageComponent";
import { clientAdapter } from "../../server_utils/client";
import { serverAdapter } from "../../server_utils/server";
import { usePrefetchHook } from "../../server_utils/util";

const adapter = loadAdapter(clientAdapter);
const store = initializeStore(clientAdapter);

export default function ApplicationPage({ allCountries, allRegions }) {
  const [isLoading, setIsLoading] = useState(true);
  const { navigate } = usePrefetchHook({
    routes: ["/login"],
  });

  useEffect(() => {
    storage.set(adapter.regionKey, allRegions);
    storage.set(adapter.countryKey, allCountries);
    try {
      const cleanedData = clientAdapter.validateCredentials();
      store.initializeTutorData(
        allRegions,
        allCountries,
        cleanedData.supportedCountries,
        cleanedData.tutor_data
      );
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      const { pathname, search } = window.location;
      navigate(`/login?next=${`${pathname}${search}`}`);
    }
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }
  return (
    <TutorPageComponent
      store={store}
      onTakeTest={() => {
        navigate(`/application/test?subject=${store.subject.testSubject}`);
      }}
    />
  );
}

export async function getStaticProps() {
  const [allRegions, allCountries] = await Promise.all([
    serverAdapter.getRegions(),
    serverAdapter.getCountries(),
  ]);
  return {
    props: { allRegions, allCountries },
  };
}
