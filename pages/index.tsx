import LandingPage from "@tuteria/shared-lib/src/tutor-application/pages/LandingPage";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { usePrefetchHook } from "../server_utils/util";

function Index() {
  const { navigate } = usePrefetchHook({ routes: ["/login", "/apply"] });
  const continueUrl = "/apply?currentStep=personal-info";

  async function checkLoggedInStatus() {
    try {
      let { loggedIn, email } = await clientAdapter.updateLoggedInStatus();
      return { loggedIn, email };
    } catch (error) {
      console.log(error);
    }
  }

  async function authenticateUser(data, key) {
    try {
      let response = await clientAdapter.authenticateUser(data);
      if (key === "otp-code") {
        navigate("/apply?currentStep=personal-info");
      }
      return response;
    } catch (error) {
      throw error;
    }
  }
  

  return (
    <LandingPage
      beginApplication={() => navigate(continueUrl)}
      continueUrl={continueUrl}
      onSubmit={clientAdapter.beginTutorApplication}
      onLogin={authenticateUser}
      isUserLoggedIn={checkLoggedInStatus}
    />
  );
}

export default Index;
