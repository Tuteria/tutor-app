import LandingPage from '@tuteria/shared-lib/src/tutor-application/pages/LandingPage';
import React from 'react';
import { clientAdapter } from '../server_utils/client';
import { usePrefetchHook } from '../server_utils/util';

function Index() {
  const { navigate, buildNavigation } = usePrefetchHook({
    routes: ['/login', '/apply'],
  });
  const [continueUrl, setUrl] = React.useState(
    '/apply?currentStep=personal-info'
  );

  async function checkLoggedInStatus() {
    try {
      let { loggedIn, email, tutorData, accessToken } =
        await clientAdapter.updateLoggedInStatus();
      if (tutorData) {
        let v = buildNavigation(accessToken, tutorData);
        if (v) {
          setUrl(v);
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
      if (key === 'otp-code') {
        if (response.redirectUrl) {
          window.location.replace(response.redirectUrl);
        } else {
          let accessToken = response.accessToken;
          let v = buildNavigation(accessToken, response?.tutorData);
          if (v) {
            navigate(v);
          } else {
            navigate('/apply?currentStep=personal-info');
          }
        }
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
