import { initializeStore } from "@tuteria/shared-lib/src/stores";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { getUserInfo, serverAdapter } from "../server_utils/server";
import { usePrefetchHook } from "../server_utils/util";
import ApplicationCompletedPage from "@tuteria/shared-lib/src/tutor-application/pages/ApplicationCompletedPage";

const store = initializeStore(clientAdapter);

function ACompletedPage({ tutorInfo, actualUrl }: any) {
  const [loading, setLoading] = React.useState(false);
  const { navigate } = usePrefetchHook({
    routes: ["/login", "/complete", "subjects", "/apply"],
  });

  React.useEffect(() => {
    store.updateTutorInfo(tutorInfo);
    store.setCurrentStep("application-verified");
    setLoading(true);
  }, []);

  function onLogout() {
    clientAdapter.onLogout();
    navigate("/");
  }
  return (
    <ApplicationCompletedPage
      firstName={tutorInfo.personalInfo.firstName}
      store={store}
      photo={store.identity.profilePhoto}
      onLogout={onLogout}
      subjectLink={`${actualUrl}?redirect_url=/subjects/`}
    />
  );
  // return <CompletedApplicationPage key={loading as any}  />;
}

export async function getServerSideProps({ query, res }) {
  const access_token = query.access_token || "";
  try {
    if (access_token) {
      let userInfo = getUserInfo(access_token);
      let tutorInfo = await serverAdapter.getTutorDetails(
        userInfo.personalInfo.email
      );
      return {
        props: {
          tutorInfo: tutorInfo.tutorData,
          actualUrl: tutorInfo.actualUrl,
          seo: {
            title: "Application Completed  | Tutor Application - Tuteria",
            description: "Thanks for completing your application",
          },
        },
      };
    } else {
      throw new Error("not allowed");
    }
  } catch (error) {
    res.writeHead(302, {
      Location: `/`,
    });
    res.end();
  }
}

export default ACompletedPage;
