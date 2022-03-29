import LandingPage from "@tuteria/shared-lib/src/tutor-application/pages/LandingPage";
import React, { useState } from "react";
import { clientAdapter } from "../server_utils/client";
import { usePrefetchHook } from "../server_utils/util";

function Index() {
  const { navigate, buildNavigation } = usePrefetchHook({
    routes: ["/login", "/apply"],
  });
  const [continueUrl, setUrl] = React.useState(
    "/apply?currentStep=personal-info"
  );
  const [continueText, setContinueText] = React.useState(
    "Continue Application"
  );
  const [tutorData, setTutorData] = React.useState<any>();
  const [clientSideLoaded, setClientSideLoaded] = useState(false);
  const queryParams = clientAdapter.getQueryValues();

  React.useEffect(() => {
    setClientSideLoaded(true);
  }, []);

  async function checkLoggedInStatus() {
    try {
      let { loggedIn, email, tutorData, accessToken, redirectUrl } =
        await clientAdapter.updateLoggedInStatus();
      if (tutorData) {
        let v = buildNavigation(accessToken, tutorData);
        if (v) {
          setUrl(v);
        }
        if (redirectUrl) {
          setContinueText("Return to Dashboard");
          setUrl(redirectUrl);
        }
      }
      return { loggedIn, email };
    } catch (error) {
      console.log(error);
    }
  }

  async function authenticateUser(data, key) {
    try {
      let response = await clientAdapter.authenticateUser(data);
      if (key === "otp-code") {
        if (response.redirectUrl) {
          window.location.replace(response.redirectUrl);
        } else {
          let accessToken = response.accessToken;
          let v = buildNavigation(accessToken, response?.tutorData);
          if (v) {
            navigate(v);
          } else {
            navigate("/apply?currentStep=personal-info");
          }
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  }
  async function onSubmit(payload: any) {
    try {
      let result = await clientAdapter.beginTutorApplication(payload);
      if (result?.tutorData) {
        setTutorData(result.tutorData);
      }
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  function onLogout() {
    clientAdapter.onLogout();
    window.location.href='/'
    // navigate("/");
  }
  return (
    <LandingPage
      beginApplication={() => {
        if (tutorData) {
          let v = buildNavigation(tutorData?.accessToken, tutorData?.tutorData);
          if (v) {
            navigate(v);
          } else {
            navigate("/apply?currentStep=personal-info");
          }
        } else {
          navigate("/apply?currentStep=personal-info");
        }
      }}
      onLogoutClick={onLogout}
      continueUrl={continueUrl}
      displayBanner={clientSideLoaded && queryParams.denied === "true"}
      onSubmit={onSubmit}
      onLogin={authenticateUser}
      continueText={continueText}
      isUserLoggedIn={checkLoggedInStatus}
    />
  );
}

Index.getInitialProps = async (ctx) => {
  return {
    displayCrisp: true,
    seo: {
      title: "Become a Tutor and Earn Money Teaching What You Love - Tuteria",
      description: `Teach students in-person or online, and fit lessons into your schedule. Simply take up jobs, deliver great lessons and get paid! It's that easy. Apply now.`,
    },
  };
};
export default Index;
