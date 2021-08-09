import React from "react";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";
import { getRootStore } from "@tuteria/shared-lib/src/data/store";

const Index = () => {
  const store = getRootStore();
  return <TutorPageWrapper allCountries={[]} store={store} />;
};

export default Index;
