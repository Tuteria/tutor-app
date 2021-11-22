import { initializeStore } from "@tuteria/shared-lib/src/stores";
import CompletedApplicationPage from "@tuteria/shared-lib/src/tutor-revamp/CompletedApplicationPage";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { getUserInfo, serverAdapter } from "../server_utils/server";
import { usePrefetchHook } from "../server_utils/util";

const store = initializeStore(clientAdapter);

export default function CompletedPage({ tutorInfo }: any) {
  const { navigate } = usePrefetchHook({
    routes: ["/login", "/complete", "subjects", "/apply"],
  });

  React.useEffect(() => {
    store.setCurrentStep("complete");
  }, []);

  return (
    <CompletedApplicationPage
      firstName={tutorInfo.personalInfo.firstName}
      store={store}
      photo={store.identity.profilePhoto}
    />
  );
}

export async function getServerSideProps({ query, res }) {
  const access_token = query.access_token || "";
  try {
    if (access_token) {
      let userInfo = getUserInfo(access_token);
      let tutorInfo = await serverAdapter.getTutorInfo(
        userInfo.personalInfo.email
      );
      return { props: { tutorInfo } };
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
