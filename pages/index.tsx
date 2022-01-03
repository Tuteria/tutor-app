import LandingPage from "@tuteria/shared-lib/src/tutor-application/pages/LandingPage";
import React from "react";
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
  const [tutorData, setTutorData] = React.useState<any>()

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
  async function onSubmit(payload:any){
    try{
      let result = await clientAdapter.beginTutorApplication(payload)
      if(result?.tutorData){
        setTutorData(result.tutorData)
      }
      return result
    
    }catch(error){
      console.log(error);
      throw error
    }
  }
  

  return (
    <LandingPage
      beginApplication={() => {
        if(tutorData){
        let v = buildNavigation(tutorData?.accessToken, tutorData?.tutorData);
          if (v) {
            navigate(v);
          } else {
            navigate("/apply?currentStep=personal-info");
          }
        }else{
        navigate("/apply?currentStep=personal-info")}}

        }
      continueUrl={continueUrl}
      onSubmit={onSubmit}
      onLogin={authenticateUser}
      continueText={continueText}
      isUserLoggedIn={checkLoggedInStatus}
    />
  );
}

export default Index;
